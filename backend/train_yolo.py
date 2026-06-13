import os
import shutil
from ultralytics import YOLO

def train():
    # Model Configuration
    model = YOLO("yolov8n.pt")  # Load pre-trained model

    # Create models directory if it doesn't exist
    models_dir = os.path.join("backend", "models")
    os.makedirs(models_dir, exist_ok=True)

    # Train the model
    results = model.train(
        data="dataset/data.yaml",
        epochs=5,
        imgsz=640,
        batch=8,
        patience=10,
        workers=4,
        project="runs",
        name="road_transparency"
    )

    # Move the best and last models to backend/models/
    weights_dir = os.path.join("runs", "road_transparency", "weights")
    best_model_path = os.path.join(weights_dir, "best.pt")
    last_model_path = os.path.join(weights_dir, "last.pt")

    if os.path.exists(best_model_path):
        shutil.copy(best_model_path, os.path.join(models_dir, "best.pt"))
        print(f"Saved best model to {os.path.join(models_dir, 'best.pt')}")
    
    if os.path.exists(last_model_path):
        shutil.copy(last_model_path, os.path.join(models_dir, "last.pt"))
        print(f"Saved last model to {os.path.join(models_dir, 'last.pt')}")

if __name__ == "__main__":
    train()
