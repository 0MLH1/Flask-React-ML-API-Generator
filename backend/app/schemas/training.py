# schemas/training.py
from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class CSVUploadResponse(BaseModel):
    columns: List[str]
    inferred_types: Dict[str, str]


class TaskChoice(BaseModel):
    task: str  # "classification" or "regression"


class TrainingRequest(BaseModel):
    model_name: str
    description: str
    task: str
    inputs: List[str]
    outputs: List[str]


class AlgorithmResult(BaseModel):
    algorithm: str
    metrics: Dict[str, Any]
    model_path: Optional[str]


class TrainingSummary(BaseModel):
    best_algorithm: str
    justification: str
    all_results: List[AlgorithmResult]
    task: Optional[str] = None
    input_columns: Optional[List[str]] = None
    output_columns: Optional[List[str]] = None
    best_model_path: Optional[str] = None
