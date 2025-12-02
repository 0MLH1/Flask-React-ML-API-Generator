"""Router for API management and monitoring."""
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database.connection import get_db
from app.database.models import API, APIUsageLog, Model
from app.schemas.api import (
    APICreate,
    APIResponse,
    APIDetailResponse,
    APIListResponse,
    DashboardStats,
)
from app.services.api_generator import APIGenerator
from sqlalchemy.exc import IntegrityError
import logging

logger = logging.getLogger("ml-platform.routers.apis")

router = APIRouter()


@router.post("/create", response_model=APIDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_api(
    payload: APICreate,
    db: Session = Depends(get_db)
):
    """
    Create and generate a Flask API from a trained model.
    This should be called after model training is complete.
    """
    # Check if model exists
    model = db.query(Model).filter(Model.id == payload.model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Check if model has been trained (has input/output columns)
    if not model.input_columns or not model.output_columns:
        raise HTTPException(status_code=400, detail="Model must be trained before creating API")
    
    # Generate API using the service
    try:
        # Choose a model file path if available (trainer saves files to models/)
        import glob, os

        model_dir = os.path.join(os.getcwd(), "backend", "models")
        if not os.path.isdir(model_dir):
            model_dir = os.path.join(os.getcwd(), "models")

        candidate = None
        try:
            pattern = os.path.join(model_dir, f"model_{model.id}_*.pkl")
            files = glob.glob(pattern)
            if files:
                # choose the most recently modified file
                candidate = max(files, key=os.path.getmtime)
        except Exception:
            candidate = None

        model_path = candidate or "models/placeholder.pkl"

        # Note: best_algorithm ideally comes from training metadata
        best_algo = model.best_algorithm if hasattr(model, 'best_algorithm') and model.best_algorithm else "best_algorithm"

        api_info = APIGenerator.generate_api(
            model_id=model.id,
            api_name=payload.api_name or f"API-{model.id}",
            best_algorithm=best_algo,
            model_path=model_path,
            input_columns=model.input_columns,
            output_columns=model.output_columns,
            task=model.task or "classification",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating API: {str(e)}")
    
    # Store API metadata in database
    db_api = API(
        model_id=payload.model_id,
        api_name=payload.api_name,
        description=payload.description,
        best_algorithm="best_algorithm",  # Should come from training
        file_path=api_info["file_path"],
        created_at=datetime.utcnow(),
    )
    
    try:
        db.add(db_api)
        db.commit()
        db.refresh(db_api)
    except IntegrityError as ie:
        db.rollback()
        logger.error("IntegrityError creating API: %s", ie)
        raise HTTPException(status_code=400, detail="API name already exists")
    except Exception as e:
        db.rollback()
        logger.exception("Unexpected error creating API: %s", e)
        raise HTTPException(status_code=500, detail=f"Unexpected error creating API: {e}")
    
    return APIDetailResponse(
        id=db_api.id,
        model_id=db_api.model_id,
        api_name=db_api.api_name,
        description=db_api.description,
        best_algorithm=db_api.best_algorithm,
        created_at=db_api.created_at,
        version=db_api.version,
        file_path=db_api.file_path,
        metrics={
            "total_requests": db_api.total_requests,
            "successful_requests": db_api.successful_requests,
            "failed_requests": db_api.failed_requests,
            "total_cpu_time": db_api.total_cpu_time,
            "total_memory_used": db_api.total_memory_used,
            "average_response_time": db_api.average_response_time,
        }
    )


@router.get("/", response_model=APIListResponse)
async def list_apis(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """List all generated APIs with pagination."""
    apis = db.query(API).offset(skip).limit(limit).all()
    total = db.query(API).count()
    
    api_responses = []
    for api in apis:
        api_responses.append(APIResponse(
            id=api.id,
            model_id=api.model_id,
            api_name=api.api_name,
            description=api.description,
            best_algorithm=api.best_algorithm,
            created_at=api.created_at,
            version=api.version,
            metrics={
                "total_requests": api.total_requests,
                "successful_requests": api.successful_requests,
                "failed_requests": api.failed_requests,
                "total_cpu_time": api.total_cpu_time,
                "total_memory_used": api.total_memory_used,
                "average_response_time": api.average_response_time,
            }
        ))
    
    return APIListResponse(apis=api_responses, total=total)


@router.get("/{api_id}", response_model=APIDetailResponse)
async def get_api_details(
    api_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific API."""
    api = db.query(API).filter(API.id == api_id).first()
    if not api:
        raise HTTPException(status_code=404, detail="API not found")
    
    # include model's input/output columns if available
    input_cols = None
    output_cols = None
    try:
        if api.model:
            input_cols = getattr(api.model, 'input_columns', None)
            output_cols = getattr(api.model, 'output_columns', None)
    except Exception:
        pass

    return APIDetailResponse(
        id=api.id,
        model_id=api.model_id,
        api_name=api.api_name,
        description=api.description,
        best_algorithm=api.best_algorithm,
        created_at=api.created_at,
        version=api.version,
        file_path=api.file_path,
        input_columns=input_cols,
        output_columns=output_cols,
        metrics={
            "total_requests": api.total_requests or 0,
            "successful_requests": api.successful_requests or 0,
            "failed_requests": api.failed_requests or 0,
            "total_cpu_time": api.total_cpu_time or 0.0,
            "total_memory_used": api.total_memory_used or 0.0,
            "average_response_time": api.average_response_time or 0.0,
        }
    )


@router.post("/{api_id}/usage")
async def log_api_usage(
    api_id: int,
    success: int = 1,
    response_time_ms: float = 0.0,
    cpu_time_ms: float = 0.0,
    memory_used_mb: float = 0.0,
    error_message: str = None,
    db: Session = Depends(get_db)
):
    """
    Log API usage for monitoring.
    Called after each prediction request.
    """
    api = db.query(API).filter(API.id == api_id).first()
    if not api:
        raise HTTPException(status_code=404, detail="API not found")
    
    # Create usage log
    usage_log = APIUsageLog(
        api_id=api_id,
        success=success,
        response_time_ms=response_time_ms,
        cpu_time_ms=cpu_time_ms,
        memory_used_mb=memory_used_mb,
        error_message=error_message,
    )
    
    # Update API metrics
    api.total_requests += 1
    if success:
        api.successful_requests += 1
    else:
        api.failed_requests += 1
    
    if response_time_ms:
        # Update average response time
        total_time = api.average_response_time * (api.total_requests - 1) + response_time_ms
        api.average_response_time = total_time / api.total_requests
    
    if cpu_time_ms:
        api.total_cpu_time += cpu_time_ms
    
    if memory_used_mb:
        api.total_memory_used += memory_used_mb
    
    db.add(usage_log)
    db.commit()
    
    return {"status": "logged"}


@router.get("/stats/dashboard")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get overall dashboard statistics."""
    total_models = db.query(Model).count()
    total_apis = db.query(API).count()
    # Count both API predictions and direct model predictions
    from app.database.models import ModelPredictionLog
    total_predictions = db.query(APIUsageLog).count() + db.query(ModelPredictionLog).count()
    
    # Calculate average response time
    # Collect response times from both logs
    api_logs = db.query(APIUsageLog).all()
    model_logs = db.query(ModelPredictionLog).all()
    all_logs = [log for log in api_logs + model_logs if getattr(log, 'response_time_ms', None)]
    avg_response_time = 0.0
    if all_logs:
        avg_response_time = sum(log.response_time_ms for log in all_logs) / len(all_logs)
    
    return DashboardStats(
        total_models=total_models,
        total_apis=total_apis,
        total_predictions=total_predictions,
        avg_response_time_ms=avg_response_time
    )
