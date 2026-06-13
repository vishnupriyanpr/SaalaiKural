"""
RoadWatch ML Server — port 5001
Accepts POST /analyze with multipart image upload.
Runs YOLO if best.pt exists, else returns mock detection.
Express backend proxies to this on photo complaint submission.
"""
import os, sys, json, math, random, tempfile, shutil, re
from http.server import BaseHTTPRequestHandler, HTTPServer

def parse_multipart(body_bytes: bytes, content_type: str):
    """Manual multipart parser — stdlib cgi was removed in Python 3.13."""
    boundary = None
    for part in content_type.split(';'):
        part = part.strip()
        if part.startswith('boundary='):
            boundary = part[len('boundary='):].strip().strip('"')
            break
    if not boundary:
        return None, None

    delimiter = b'--' + boundary.encode()
    parts = body_bytes.split(delimiter)

    for chunk in parts:
        if not chunk or chunk == b'--\r\n' or chunk == b'--':
            continue
        # Split headers from body at \r\n\r\n
        if b'\r\n\r\n' not in chunk:
            continue
        raw_headers, file_data = chunk.split(b'\r\n\r\n', 1)
        file_data = file_data.rstrip(b'\r\n')

        headers_str = raw_headers.decode(errors='ignore')
        disp_match  = re.search(r'filename="([^"]+)"', headers_str)
        if disp_match:
            filename = disp_match.group(1)
            return filename, file_data

    return None, None


# ── YOLO setup ──────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "best.pt")
FALLBACK_MODEL_PATH = os.path.join(os.path.dirname(__file__), "yolo26n.pt") # Found in root backend
CLASS_MAP  = {0: "Crack", 1: "Pothole"}

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

_model = None
_model_name = "mock"

if YOLO_AVAILABLE:
    if os.path.exists(MODEL_PATH):
        try:
            _model = YOLO(MODEL_PATH)
            _model_name = "best.pt"
            print(f"[ML] YOLO model loaded from {MODEL_PATH}", flush=True)
        except Exception as e:
            print(f"[ML] Failed to load YOLO model: {e}", flush=True)
    elif os.path.exists(FALLBACK_MODEL_PATH):
        try:
            _model = YOLO(FALLBACK_MODEL_PATH)
            _model_name = "yolo26n.pt"
            print(f"[ML] Fallback YOLO model loaded from {FALLBACK_MODEL_PATH}", flush=True)
        except Exception as e:
            print(f"[ML] Failed to load fallback YOLO model: {e}", flush=True)
    else:
        print(f"[ML] No models found — using smart mock fallback", flush=True)


def run_yolo(image_path: str) -> dict:
    """Run YOLO on image, return best detection dict."""
    if _model:
        try:
            results = _model(image_path)
            best, max_conf = None, -1
            for result in results:
                for box in result.boxes:
                    conf = float(box.conf[0].item())
                    if conf > max_conf:
                        max_conf = conf
                        cls_id = int(box.cls[0].item())
                        xyxy   = [round(c, 2) for c in box.xyxy[0].tolist()]
                        best   = {
                            "damage_type": CLASS_MAP.get(cls_id, "Unknown"),
                            "confidence":  round(conf, 4),
                            "bbox":        xyxy,
                            "image_area":  result.orig_shape[0] * result.orig_shape[1]
                        }
            if best:
                return best
        except Exception as e:
            print(f"[ML] YOLO inference error: {e}", flush=True)

    # Smart fallback mock
    damage_type = random.choice(["Crack", "Pothole"])
    confidence  = round(random.uniform(0.62, 0.95), 4)
    x1, y1      = random.randint(10, 120), random.randint(10, 120)
    x2, y2      = x1 + random.randint(60, 250), y1 + random.randint(60, 250)
    return {
        "damage_type": damage_type,
        "confidence":  confidence,
        "bbox":        [x1, y1, x2, y2],
        "image_area":  640 * 640
    }


def calc_severity(bbox, image_area, confidence, damage_type) -> dict:
    if not bbox or len(bbox) != 4 or image_area <= 0:
        return {"severity": 0.0, "category": "Low"}
    x1, y1, x2, y2 = bbox
    area_ratio      = min(1.0, (max(0, x2-x1) * max(0, y2-y1)) / image_area)
    weight          = 1.0 if damage_type.lower() == "pothole" else 0.8
    score           = min(100.0, math.sqrt(area_ratio) * confidence * weight * 100)
    cat             = "Critical" if score > 75 else "High" if score > 50 else "Medium" if score > 25 else "Low"
    return {"severity": round(score, 2), "category": cat}


def calc_priority(severity) -> dict:
    road_type, road_imp = random.choice([
        ("School Zone", 20), ("Hospital Area", 20), ("Main Road", 15),
        ("Bus Route", 15),   ("Residential",   10)
    ])
    score = min(100.0, (severity * 0.6) + 10 + road_imp + 10)
    cat   = "Critical" if score > 80 else "High" if score > 60 else "Medium" if score > 30 else "Low"
    return {"priority": round(score, 2), "category": cat, "road_type": road_type}


# ── HTTP Server ──────────────────────────────────────────────────────────────
class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[ML] {self.address_string()} {fmt % args}", flush=True)

    def send_json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        if self.path == "/" or self.path == "/health":
            self.send_json(200, {"status": "ok", "model_loaded": _model is not None})
        else:
            self.send_json(404, {"error": "Not found"})

    def do_POST(self):
        if self.path != "/analyze":
            self.send_json(404, {"error": "Not found"})
            return

        tmp_dir  = tempfile.mkdtemp()
        tmp_file = None

        try:
            content_type = self.headers.get("Content-Type", "")
            length       = int(self.headers.get("Content-Length", 0))
            body_bytes   = self.rfile.read(length)

            if "multipart/form-data" in content_type:
                filename, file_data = parse_multipart(body_bytes, content_type)
                if not filename or file_data is None:
                    self.send_json(400, {"error": "No image field found in multipart request"})
                    return

                ext      = os.path.splitext(filename)[1] or ".jpg"
                tmp_file = os.path.join(tmp_dir, f"upload{ext}")
                with open(tmp_file, "wb") as f:
                    f.write(file_data)
            else:
                # Non-multipart — use mock
                tmp_file = None

            detection       = run_yolo(tmp_file) if tmp_file else run_yolo("")
            severity_result = calc_severity(
                detection["bbox"], detection["image_area"],
                detection["confidence"], detection["damage_type"]
            )
            priority_result = calc_priority(severity_result["severity"])

            result = {
                "damage_type":       detection["damage_type"],
                "confidence":        detection["confidence"],
                "bbox":              detection["bbox"],
                "severity":          severity_result["severity"],
                "severity_category": severity_result["category"],
                "priority":          priority_result["priority"],
                "priority_category": priority_result["category"],
                "road_type":         priority_result["road_type"],
                "model_used":        _model_name
            }

            self.send_json(200, result)

        except Exception as e:
            print(f"[ML] Error: {e}", flush=True)
            self.send_json(500, {"error": str(e)})
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)



if __name__ == "__main__":
    PORT = 5001
    server = HTTPServer(("", PORT), Handler)
    print(f"[ML] RoadWatch ML Server running on http://localhost:{PORT}", flush=True)
    print(f"[ML] POST /analyze — image analysis endpoint", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[ML] Shutting down.", flush=True)
        server.shutdown()
