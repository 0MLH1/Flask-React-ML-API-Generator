"""Router for consuming generated APIs for predictions."""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Any, Dict
from sqlalchemy.orm import Session
from datetime import datetime
import time
import numpy as np


from app.database.connection import get_db
from app.database.models import API, APIUsageLog
import pandas as pd
import joblib
import os
import glob

router = APIRouter()


class APIPredictionRequest(BaseModel):
    """Request to make a prediction using a generated API."""
    api_id: int
    data: Dict[str, Any]  # Single prediction data point


class APIPredictionBatchRequest(BaseModel):
    """Request to make batch predictions using a generated API."""
    api_id: int
    data: List[Dict[str, Any]]  # Multiple prediction data points


class APIPredictionResponse(BaseModel):
    """Response from API prediction."""
    api_id: int
    prediction: Any
    response_time_ms: float


class APIPredictionBatchResponse(BaseModel):
    """Response from batch API prediction."""
    api_id: int
    predictions: List[Any]
    response_time_ms: float


def safe_convert(pred):
    if isinstance(pred, np.ndarray):
        return pred.tolist()
    elif isinstance(pred, (np.integer, np.floating)):
        return pred.item()
    else:
        return pred


@router.post("/predict", response_model=APIPredictionResponse)
async def predict_with_api(
    request: APIPredictionRequest,
    db: Session = Depends(get_db)
):
    """
    Make a single prediction using a generated API.
    
    This endpoint routes the prediction request to the actual Flask API
    and logs the usage.
    """
    api = db.query(API).filter(API.id == request.api_id).first()
    if not api:
        raise HTTPException(status_code=404, detail="API not found")
    
    try:
        start_time = time.time()

        # Attempt to load the trained model file. Prefer model.best_model_path if set
        model_path = None
        try:
            model_rec = api.model
            if model_rec and getattr(model_rec, 'best_model_path', None):
                model_path = model_rec.best_model_path
        except Exception:
            model_path = None

        # Fallback: try to find a model file in models/ matching model id
        if not model_path:
            model_dir = os.path.join(os.getcwd(), "backend", "models")
            if not os.path.isdir(model_dir):
                model_dir = os.path.join(os.getcwd(), "models")
            pattern = os.path.join(model_dir, f"model_{api.model_id}_*.pkl")
            files = glob.glob(pattern)
            if files:
                model_path = max(files, key=os.path.getmtime)

        if not model_path or not os.path.exists(model_path):
            # Can't find model file, return error
            raise HTTPException(status_code=500, detail="Trained model file not found for this API")

        # Prepare data frame in correct column order
        input_columns = api.model.input_columns if api.model and api.model.input_columns else None
        if not input_columns:
            raise HTTPException(status_code=500, detail="API does not have input column metadata")

        # Support single dict (single prediction)
        data = request.data
        if isinstance(data, dict):
            df = pd.DataFrame([data])
        else:
            df = pd.DataFrame(data)

        # Ensure all required columns present
        missing = set(input_columns) - set(df.columns)
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing columns: {', '.join(missing)}")

        X = df[input_columns]

        # Load model and predict
        model = joblib.load(model_path)
        preds = model.predict(X)

        response_time_ms = (time.time() - start_time) * 1000
        
        # Estimate resource usage based on prediction complexity
        # CPU time approximation: use response time as proxy
        cpu_time_ms = response_time_ms
        
        # Memory estimation: estimate based on data size
        # For simplicity, estimate ~1MB per 1000 rows processed
        num_rows = len(df) if isinstance(df, pd.DataFrame) else 1
        memory_used_mb = max(0.1, num_rows / 1000)  # At least 0.1MB

        # Format prediction result
        prediction_result = safe_convert(preds[0] if isinstance(data, dict) else preds)



        # Log API usage directly into DB
        try:
            usage_log = APIUsageLog(
                api_id=request.api_id,
                success=1,
                response_time_ms=response_time_ms,
                cpu_time_ms=cpu_time_ms,
                memory_used_mb=memory_used_mb,
            )
            db.add(usage_log)

            # update aggregate metrics on API row
            api.total_requests = (api.total_requests or 0) + 1
            api.successful_requests = (api.successful_requests or 0) + 1
            api.total_cpu_time = (api.total_cpu_time or 0.0) + (cpu_time_ms / 1000)  # Convert to seconds
            api.total_memory_used = (api.total_memory_used or 0.0) + memory_used_mb
            prev_count = api.total_requests - 1
            prev_avg = api.average_response_time or 0.0
            api.average_response_time = ((prev_avg * prev_count) + response_time_ms) / api.total_requests
            db.add(api)
            db.commit()
        except Exception:
            db.rollback()

        return APIPredictionResponse(
            api_id=request.api_id,
            prediction=prediction_result,
            response_time_ms=response_time_ms
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling API: {str(e)}")


@router.post("/predict-batch", response_model=APIPredictionBatchResponse)
async def predict_batch_with_api(
    request: APIPredictionBatchRequest,
    db: Session = Depends(get_db)
):
    """
    Make batch predictions using a generated API.
    """
    api = db.query(API).filter(API.id == request.api_id).first()
    if not api:
        raise HTTPException(status_code=404, detail="API not found")
    
    try:
        start_time = time.time()

        # Validate model exists (reuse same logic as single predict)
        model_path = None
        try:
            model_rec = api.model
            if model_rec and getattr(model_rec, 'best_model_path', None):
                model_path = model_rec.best_model_path
        except Exception:
            model_path = None

        if not model_path:
            model_dir = os.path.join(os.getcwd(), "backend", "models")
            if not os.path.isdir(model_dir):
                model_dir = os.path.join(os.getcwd(), "models")
            pattern = os.path.join(model_dir, f"model_{api.model_id}_*.pkl")
            files = glob.glob(pattern)
            if files:
                model_path = max(files, key=os.path.getmtime)

        if not model_path or not os.path.exists(model_path):
            raise HTTPException(status_code=500, detail="Trained model file not found for this API")

        # Build DataFrame from incoming list
        data_list = request.data
        if not isinstance(data_list, list) or len(data_list) == 0:
            raise HTTPException(status_code=400, detail="Request data must be a non-empty list of records for batch prediction")

        df = pd.DataFrame(data_list)

        input_columns = api.model.input_columns if api.model and api.model.input_columns else None
        if not input_columns:
            raise HTTPException(status_code=500, detail="API does not have input column metadata")

        missing = set(input_columns) - set(df.columns)
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing columns: {', '.join(missing)}")

        X = df[input_columns]

        model = joblib.load(model_path)
        preds = model.predict(X)

        response_time_ms = (time.time() - start_time) * 1000
        
        # Estimate resource usage based on prediction complexity
        # CPU time approximation: use response time as proxy
        cpu_time_ms = response_time_ms
        
        # Memory estimation: estimate based on data size
        # For batch: estimate ~1MB per 1000 rows processed
        num_rows = len(df) if isinstance(df, pd.DataFrame) else len(data_list)
        memory_used_mb = max(0.1, num_rows / 1000)  # At least 0.1MB

        predictions = preds.tolist()

        # Log API usage entry for this batch (single record)
        try:
            usage_log = APIUsageLog(
                api_id=request.api_id,
                success=1,
                response_time_ms=response_time_ms,
                cpu_time_ms=cpu_time_ms,
                memory_used_mb=memory_used_mb,
            )
            db.add(usage_log)

            api.total_requests = (api.total_requests or 0) + 1
            api.successful_requests = (api.successful_requests or 0) + 1
            api.total_cpu_time = (api.total_cpu_time or 0.0) + (cpu_time_ms / 1000)  # Convert to seconds
            api.total_memory_used = (api.total_memory_used or 0.0) + memory_used_mb
            prev_count = api.total_requests - 1
            prev_avg = api.average_response_time or 0.0
            api.average_response_time = ((prev_avg * prev_count) + response_time_ms) / api.total_requests
            db.add(api)
            db.commit()
        except Exception:
            db.rollback()

        return APIPredictionBatchResponse(
            api_id=request.api_id,
            predictions=predictions,
            response_time_ms=response_time_ms
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calling API: {str(e)}")
