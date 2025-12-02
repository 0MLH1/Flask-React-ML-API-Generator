import os
import pickle

MODELS_DIR = "models"

def list_pkl_files():
    files = []
    for filename in os.listdir(MODELS_DIR):
        if filename.endswith(".pkl"):
            path = os.path.join(MODELS_DIR, filename)
            files.append({
                "file": filename,
                "path": path,
                "size_kb": round(os.path.getsize(path) / 1024, 2)
            })
    return files

def load_model(model_filename: str):
    path = os.path.join(MODELS_DIR, model_filename)
    
    if not os.path.exists(path):
        raise FileNotFoundError("Model file not found!")

    with open(path, "rb") as f:
        model = pickle.load(f)

    return model
