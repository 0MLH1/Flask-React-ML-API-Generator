from pydantic import BaseModel
from typing import List, Any

class PredictRequest(BaseModel):
    model_id: int
    algorithm: str
    input_data: List[List[float]]  # liste de lignes à prédire

class PredictResponse(BaseModel):
    predictions: List[Any]
