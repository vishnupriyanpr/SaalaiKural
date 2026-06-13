import os
import argparse
import json
from ultralytics import YOLO

def predict(image_path):
    models_dir = os.path.join("backend", "models")
    best_model_path = os.path.join(models_dir, "best.pt")

    if not os.path.exists(best_model_path):
        print(json.dumps({"error": f"Model not found at {best_model_path}. Please train the model first."}))
        return

    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image not found at {image_path}."}))
        return

    model = YOLO(best_model_path)
    
    # Class mapping
    class_map = {0: "Crack", 1: "Pothole"}

    results = model(image_path)
    
    predictions = []
    
    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())
            xyxy = box.xyxy[0].tolist()
            
            damage_type = class_map.get(cls_id, "Unknown")
            
            predictions.append({
                "damage_type": damage_type,
                "confidence": round(conf, 4),
                "bbox": [round(c, 2) for c in xyxy]
            })

    print(json.dumps(predictions, indent=4))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Predict using YOLO model")
    parser.add_argument("image_path", type=str, help="Path to the image to predict on")
    args = parser.parse_args()
    
    predict(args.image_path)
