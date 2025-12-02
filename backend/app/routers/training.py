from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List

from app.schemas.training import TrainingSummary
from app.services.trainer import Trainer


import pandas as pd
from app.database.connection import get_db
from sqlalchemy.orm import Session

router = APIRouter()

# ------ Request schemas ------
class AnalyzeRequest(BaseModel):
    model_id: int

class AnalyzeResponse(BaseModel):
    n_rows: int
    n_columns: int
    columns: List[str]

class TrainRequest(BaseModel):
    model_id: int
    task: str
    input_columns: List[str]
    output_columns: List[str]

# ------ ROUTES ------

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Return info about the CSV linked to the model (rows, columns).
    """
    try:
        from app.routers.models import _IN_MEMORY_MODELS as _MODELS
    except Exception:
        raise HTTPException(status_code=500, detail="Model store not available yet")

    model = _MODELS.get(request.model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    csv_path = model.get("csv_path")
    if not csv_path:
        raise HTTPException(status_code=400, detail="Model has no CSV uploaded yet")

    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading CSV: {e}")

    return AnalyzeResponse(
        n_rows=len(df),
        n_columns=len(df.columns),
        columns=df.columns.tolist()
    )


@router.post("/train", response_model=TrainingSummary)
async def train(req: TrainRequest, db: Session = Depends(get_db)):
    trainer = Trainer()

    try:
        summary = trainer.train(
            model_id=req.model_id,
            task=req.task,
            input_cols=req.input_columns,
            output_cols=req.output_columns,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Persist training metadata to DB so other endpoints (API generation, dashboard)
    # can detect that the model has been trained.
    try:
        from app.database.models import Model as DBModel
        db_model = db.query(DBModel).filter(DBModel.id == req.model_id).first()
        if db_model:
            db_model.task = req.task
            db_model.input_columns = req.input_columns
            db_model.output_columns = req.output_columns
            # Save best model path returned by trainer summary, if present
            try:
                if getattr(summary, 'best_model_path', None):
                    db_model.best_model_path = summary.best_model_path
            except Exception:
                pass
            db.add(db_model)
            db.commit()
    except Exception:
        # Don't fail the whole request if DB update fails; training succeeded.
        pass

    return summary


