# schemas/model.py
from pydantic import BaseModel
from typing import List, Optional


class ModelCreate(BaseModel):
    name: str
    description: str


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    created_at: str


class ColumnSelection(BaseModel):
    inputs: List[str]
    outputs: List[str]
