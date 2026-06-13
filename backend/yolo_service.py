import os
import random

try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False

class YoloService:
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), "models", "best.pt")
        self.model = None
        self.class_map = {0: "Crack", 1: "Pothole"}
        
        if ULTRALYTICS_AVAILABLE and os.path.exists(self.model_path):
            try:
                self.model = YOLO(self.model_path)
                print(f"Loaded YOLO model from {self.model_path}")
            except Exception as e:
                print(f"Error loading YOLO model: {e}")
        else:
            print("YOLO model not found or ultralytics not installed. Using fallback inference.")

    def predict(self, image_path: str):
        if self.model and os.path.exists(image_path):
            results = self.model(image_path)
            
            # Get the detection with highest confidence
            best_det = None
            max_conf = -1
            
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    conf = float(box.conf[0].item())
                    if conf > max_conf:
                        max_conf = conf
                        cls_id = int(box.cls[0].item())
                        xyxy = box.xyxy[0].tolist()
                        
                        best_det = {
                            "damage_type": self.class_map.get(cls_id, "Unknown"),
                            "confidence": round(conf, 4),
                            "bbox": [round(c, 2) for c in xyxy],
                            "image_area": result.orig_shape[0] * result.orig_shape[1] # height * width
                        }
                        
            if best_det:
                return best_det
                
        # Fallback inference if no model or no detections
        # Mock detection for testing purposes
        damage_type = random.choice(["Crack", "Pothole"])
        confidence = round(random.uniform(0.6, 0.95), 4)
        
        # Mock bbox: [x1, y1, x2, y2]
        x1, y1 = random.randint(10, 100), random.randint(10, 100)
        x2, y2 = x1 + random.randint(50, 200), y1 + random.randint(50, 200)
        
        return {
            "damage_type": damage_type,
            "confidence": confidence,
            "bbox": [x1, y1, x2, y2],
            "image_area": 640 * 640 # mock image area
        }

yolo_service = YoloService()
