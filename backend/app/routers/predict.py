from fastapi import APIRouter, HTTPException, Depends
import joblib
import os
from app.schemas.predict import PredictRequest, PredictResponse
from app.database.connection import get_db
from sqlalchemy.orm import Session
from app.database.models import ModelPredictionLog
import time

router = APIRouter()

@router.post("/", response_model=PredictResponse)
async def predict(req: PredictRequest, db: Session = Depends(get_db)):
    from app.routers.models import _IN_MEMORY_MODELS as _MODELS

    model_record = _MODELS.get(req.model_id)
    if not model_record:
        raise HTTPException(status_code=404, detail="Model not found")

    model_path = os.path.join("models", f"model_{req.model_id}_{req.algorithm}.pkl")
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail="Model file not found")

    try:
        start = time.time()
        model = joblib.load(model_path)
        preds = model.predict(req.input_data)
        response_time_ms = (time.time() - start) * 1000

        # Log the model prediction into ModelPredictionLog
        try:
            log = ModelPredictionLog(
                model_id=req.model_id,
                success=1,
                response_time_ms=response_time_ms
            )
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()

    except Exception as e:
        # Log failure
        try:
            log = ModelPredictionLog(
                model_id=req.model_id,
                success=0,
                error_message=str(e)
            )
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()
        raise HTTPException(status_code=400, detail=f"Error during prediction: {e}")

    return PredictResponse(predictions=preds.tolist())
