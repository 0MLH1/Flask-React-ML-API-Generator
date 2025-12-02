from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
import logging
import shutil
import os
from datetime import datetime

from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Model as DBModel
from app.schemas.model import ModelCreate, ModelInfo  # Use ModelInfo instead of ModelOut

router = APIRouter()
logger = logging.getLogger("ml-platform.routers.models")

# In-memory store (kept for CSV uploads and quick UI interactions)
_IN_MEMORY_MODELS = {}
_NEXT_ID = 1


@router.post("/", response_model=ModelInfo, status_code=status.HTTP_201_CREATED)
async def create_model(payload: ModelCreate, db: Session = Depends(get_db)):
    """
    Create a model record in the database and keep an in-memory entry for CSV uploads.
    """
    global _NEXT_ID

    # Persist to DB
    db_model = DBModel(name=payload.name, description=payload.description, created_at=datetime.utcnow())
    db.add(db_model)
    db.commit()
    db.refresh(db_model)

    # Update in-memory store for backwards compatibility with existing upload/train flow
    model_id = int(db_model.id)
    _NEXT_ID = max(_NEXT_ID, model_id + 1)
    record = {
        "id": str(model_id),
        "name": payload.name,
        "description": payload.description,
        "created_at": db_model.created_at.isoformat(),
    }
    _IN_MEMORY_MODELS[model_id] = record

    return ModelInfo(**record)


UPLOAD_DIR = "uploaded_csv"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/{model_id}/upload_csv")
async def upload_csv(model_id: int, file: UploadFile = File(...)):
    """Save uploaded CSV and attach its path to the in-memory model entry.

    We intentionally keep CSV paths in-memory (for the trainer) and persist model metadata
    in the DB when models are created. If you prefer to persist CSV path, we can add a
    `csv_path` column to the `Model` table and update it here.
    """
    from app.routers.models import _IN_MEMORY_MODELS as _MODELS

    if model_id not in _MODELS:
        raise HTTPException(status_code=404, detail="Model not found")

    file_path = os.path.join(UPLOAD_DIR, f"model_{model_id}.csv")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    _MODELS[model_id]["csv_path"] = file_path

    return {"status": "uploaded", "path": file_path}


@router.get("/list")
async def list_models_debug(db: Session = Depends(get_db)):
    """Debug endpoint: list models from DB and in-memory store.

    Use this to confirm CSV upload state for the trainer and to inspect persisted
    model metadata.
    """
    # DB models
    db_models = []
    try:
        rows = db.query(DBModel).order_by(DBModel.created_at.desc()).all()
        for m in rows:
            db_models.append({
                "id": m.id,
                "name": m.name,
                "task": m.task,
                "input_columns": m.input_columns,
                "output_columns": m.output_columns,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            })
    except Exception:
        db_models = []

    # In-memory models
    in_memory = list(_IN_MEMORY_MODELS.values())

    return {"db_models": db_models, "in_memory_models": in_memory}


