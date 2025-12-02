"""FastAPI entrypoint for ml-platform backend.

This file configures the app, CORS, and mounts the routers in `app/routers/`.
It is written so it will work once the other modules (services, schemas, config)
are created in subsequent steps.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Initialize database
from app.database.connection import init_db
init_db()

# Routers will be imported below. If they are not yet present, we provide a
# helpful error message when the application starts.

app = FastAPI(
    title="ML Platform API",
    version="0.2.0",
    description="Backend API for a wizard-driven local ML training platform with API generation",
)

# Basic CORS setup, allow frontend dev origins (adjust in settings later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml-platform")

# Import routers lazily with helpful errors if modules are missing.
try:
    from app.routers import models as models_router
    from app.routers import training as training_router
 ## from app.routers import predict as predict_router
    from app.routers import apis as apis_router
    from app.routers import api_consumer as api_consumer_router
except Exception as e:
    logger.warning(
        "Some routers could not be imported yet. Make sure app/routers/*.py exist. %s",
        e,
    )
else:
    app.include_router(models_router.router, prefix="/api/models", tags=["models"])
    app.include_router(training_router.router, prefix="/api/training", tags=["training"])
 ## app.include_router(predict_router.router, prefix="/api/predict", tags=["predict"])
    app.include_router(apis_router.router, prefix="/api/apis", tags=["apis"])
    app.include_router(api_consumer_router.router, prefix="/api/consume", tags=["api-consumer"])

    

@app.get("/healthz", tags=["health"])
async def health_check():
    """Simple healthcheck endpoint."""
    return {"status": "ok"}

# Note: when you run this app before the remaining modules exist, you will see
# the logger warning above. That's intentional — the files are compatible and
# will plug in as we implement the services and schemas next.
