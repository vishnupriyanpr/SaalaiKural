import os
import urllib.request
import zipfile
from ultralytics import YOLO

def download_sample_dataset():
    """
    Downloads a tiny sample dataset of road cracks and potholes to train on.
    For a production model, replace this with a large Roboflow/Kaggle dataset.
    """
    dataset_dir = os.path.join(os.path.dirname(__file__), "dataset")
    if not os.path.exists(dataset_dir):
        os.makedirs(dataset_dir)
        print("Creating dataset directory structure...")
        
        # We will create a dummy dataset just to generate a valid .pt model file quickly
        # In reality, you'd download a ZIP file with images and labels here.
        os.makedirs(os.path.join(dataset_dir, "images", "train"), exist_ok=True)
        os.makedirs(os.path.join(dataset_dir, "images", "val"), exist_ok=True)
        os.makedirs(os.path.join(dataset_dir, "labels", "train"), exist_ok=True)
        os.makedirs(os.path.join(dataset_dir, "labels", "val"), exist_ok=True)
        
        # Generate 1 dummy image and label so YOLO doesn't crash on an empty dataset
        from PIL import Image
        img = Image.new('RGB', (640, 640), color = 'gray')
        img.save(os.path.join(dataset_dir, "images", "train", "dummy.jpg"))
        img.save(os.path.join(dataset_dir, "images", "val", "dummy.jpg"))
        
        # Format: class x_center y_center width height (normalized)
        with open(os.path.join(dataset_dir, "labels", "train", "dummy.txt"), "w") as f:
            f.write("0 0.5 0.5 0.2 0.2\n")
        with open(os.path.join(dataset_dir, "labels", "val", "dummy.txt"), "w") as f:
            f.write("0 0.5 0.5 0.2 0.2\n")

        # Create a simple dataset.yaml
        yaml_content = f"""
path: {dataset_dir}
train: images/train
val: images/val

names:
  0: Crack
  1: Pothole
"""
        with open(os.path.join(dataset_dir, "dataset.yaml"), "w") as f:
            f.write(yaml_content.strip())
            
        print("Generated dataset.yaml")
        return os.path.join(dataset_dir, "dataset.yaml")
    return os.path.join(dataset_dir, "dataset.yaml")

def train():
    print("Initializing YOLOv8 Nano model...")
    # Load a pre-trained YOLOv8 nano model (fastest)
    model = YOLO("yolov8n.pt") 
    
    yaml_path = download_sample_dataset()
    
    print("\nStarting training... (This may take a few minutes depending on your hardware)")
    
    # Train the model. (Setting epochs to 1 for a quick generation. Increase to 50+ for real training)
    results = model.train(
        data=yaml_path,
        epochs=1, 
        imgsz=640,
        batch=2,
        name="roadwatch_model"
    )
    
    # Move the best weights to our backend/models folder
    source_weights = os.path.join("runs", "detect", "roadwatch_model", "weights", "best.pt")
    target_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(target_dir, exist_ok=True)
    target_weights = os.path.join(target_dir, "best.pt")
    
    if os.path.exists(source_weights):
        import shutil
        shutil.copy(source_weights, target_weights)
        print(f"\n✅ Training complete! Model saved successfully to: {target_weights}")
    else:
        print("\n❌ Training finished, but couldn't find best.pt. Ensure the dataset has valid images/labels.")

if __name__ == "__main__":
    train()
