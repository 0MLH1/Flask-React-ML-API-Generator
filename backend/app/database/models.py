"""Database models for ML Platform using SQLAlchemy ORM."""
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, JSON, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import os

Base = declarative_base()

# SQLite database for development (can switch to PostgreSQL in production)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ml_platform.db")


class Model(Base):
    """ML Model metadata."""
    __tablename__ = "models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    task = Column(String(50), nullable=True)  # classification or regression
    input_columns = Column(JSON, nullable=True)  # List of input column names
    output_columns = Column(JSON, nullable=True)  # List of output column names
    best_model_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    apis = relationship("API", back_populates="model", cascade="all, delete-orphan")
    

class API(Base):
    """Generated API metadata and tracking."""
    __tablename__ = "apis"
    
    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    api_name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    best_algorithm = Column(String(100), nullable=False)
    
    # File storage info
    file_path = Column(String(500), nullable=True)  # Path to generated Flask file
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    version = Column(String(20), default="1.0.0")
    
    # Monitoring
    total_requests = Column(Integer, default=0)
    successful_requests = Column(Integer, default=0)
    failed_requests = Column(Integer, default=0)
    
    # Resource usage (can be updated periodically)
    total_cpu_time = Column(Float, default=0.0)  # in seconds
    total_memory_used = Column(Float, default=0.0)  # in MB
    average_response_time = Column(Float, default=0.0)  # in milliseconds
    
    # Relationships
    model = relationship("Model", back_populates="apis")
    usage_logs = relationship("APIUsageLog", back_populates="api", cascade="all, delete-orphan")


class APIUsageLog(Base):
    """Log each API prediction request for monitoring."""
    __tablename__ = "api_usage_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    api_id = Column(Integer, ForeignKey("apis.id"), nullable=False)
    
    timestamp = Column(DateTime, default=datetime.utcnow)
    success = Column(Integer, default=1)  # 1 = success, 0 = failure
    response_time_ms = Column(Float, nullable=True)
    cpu_time_ms = Column(Float, nullable=True)
    memory_used_mb = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Relationships
    api = relationship("API", back_populates="usage_logs")


class ModelPredictionLog(Base):
    """Log predictions made directly against trained models (not via generated APIs)."""
    __tablename__ = "model_prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("models.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    success = Column(Integer, default=1)
    response_time_ms = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)

    # relationship back to model (optional)
    model = relationship("Model")


# Database initialization
def init_db():
    """Create tables in database."""
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    return engine


if __name__ == "__main__":
    init_db()
    print("Database tables created successfully!")
