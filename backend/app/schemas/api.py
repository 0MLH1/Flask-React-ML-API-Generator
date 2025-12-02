"""Pydantic schemas for API management."""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class APICreate(BaseModel):
    """Schema for creating an API from a trained model."""
    model_id: int
    api_name: str
    description: Optional[str] = None


class APIMetrics(BaseModel):
    """API usage metrics."""
    total_requests: int
    successful_requests: int
    failed_requests: int
    total_cpu_time: float
    total_memory_used: float
    average_response_time: float


class APIResponse(BaseModel):
    """API information response."""
    id: int
    model_id: int
    api_name: str
    description: Optional[str]
    best_algorithm: str
    created_at: datetime
    version: str
    metrics: APIMetrics
    
    class Config:
        from_attributes = True


class APIDetailResponse(APIResponse):
    """Detailed API information including file path."""
    file_path: Optional[str]
    input_columns: Optional[List[str]] = None
    output_columns: Optional[List[str]] = None


class APIListResponse(BaseModel):
    """Response for listing multiple APIs."""
    apis: List[APIResponse]
    total: int


class APIUsageLogEntry(BaseModel):
    """Single API usage log entry."""
    timestamp: datetime
    success: bool
    response_time_ms: Optional[float]
    cpu_time_ms: Optional[float]
    memory_used_mb: Optional[float]
    error_message: Optional[str]


class DashboardStats(BaseModel):
    """Dashboard statistics."""
    total_models: int
    total_apis: int
    total_predictions: int
    avg_response_time_ms: float
