import os
from ultralytics import YOLO

def evaluate():
    models_dir = os.path.join("backend", "models")
    best_model_path = os.path.join(models_dir, "best.pt")

    if not os.path.exists(best_model_path):
        print(f"Model not found at {best_model_path}. Please train the model first.")
        return

    model = YOLO(best_model_path)
    
    print("Evaluating the best model...")
    metrics = model.val(data="dataset/data.yaml")

    print("\nEvaluation Metrics:")
    print(f"Precision: {metrics.results_dict['metrics/precision(B)']:.4f}")
    print(f"Recall: {metrics.results_dict['metrics/recall(B)']:.4f}")
    print(f"mAP50: {metrics.results_dict['metrics/mAP50(B)']:.4f}")
    print(f"mAP50-95: {metrics.results_dict['metrics/mAP50-95(B)']:.4f}")

if __name__ == "__main__":
    evaluate()
