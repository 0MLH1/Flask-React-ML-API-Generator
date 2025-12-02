from pydantic import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "ML Platform"
    ENV: str = "development"

    # MySQL configuration
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "ml_platform"

    # File storage
    UPLOAD_DIR: str = "uploaded_files"

    class Config:
        env_file = ".env"

settings = Settings()
