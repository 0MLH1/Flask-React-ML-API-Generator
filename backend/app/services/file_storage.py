# file_storage.py
import os
from pathlib import Path


BASE_DIR = Path("uploaded_files")
BASE_DIR.mkdir(exist_ok=True)


def save_csv(file):
    path = BASE_DIR / file.filename
    with open(path, "wb") as f:
        f.write(file.file.read())
    return str(path)
