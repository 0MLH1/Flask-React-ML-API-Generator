import sqlite3
import os

# Path to DB file (placed next to this script)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db = os.path.join(BASE_DIR, 'ml_platform.db')

# Always connect (this will create the DB file if it doesn't exist)
con = sqlite3.connect(db)
cur = con.cursor()

print(f"Connected to database: {db}")

# Ensure models table exists (app may create it via SQLAlchemy, but we check)
try:
    tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]
    if 'models' not in tables:
        print("Warning: 'models' table not found. The application normally creates this via SQLAlchemy."
              " If you just installed, start the backend once to let SQLAlchemy create tables.")
    else:
        # Add column if it doesn't exist
        try:
            cols = [r[1] for r in cur.execute("PRAGMA table_info(models);").fetchall()]
            if 'best_model_path' not in cols:
                cur.execute("ALTER TABLE models ADD COLUMN best_model_path TEXT;")
                print('Added best_model_path column to models')
            else:
                print('best_model_path column already exists')
        except Exception as e:
            print('Error checking/adding best_model_path column (ignored):', e)
except Exception as e:
    print('Error enumerating tables (ignored):', e)

# Create model_prediction_logs table if not exists
try:
    cur.execute(
        """CREATE TABLE IF NOT EXISTS model_prediction_logs (
            id INTEGER PRIMARY KEY,
            model_id INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            success INTEGER DEFAULT 1,
            response_time_ms REAL,
            error_message TEXT
        );"""
    )
    print('Ensured model_prediction_logs table exists')
except Exception as e:
    print('Error creating model_prediction_logs table (ignored):', e)

# Create apis table if not exists (store generated API metadata)
try:
    cur.execute(
        """CREATE TABLE IF NOT EXISTS apis (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE,
            description TEXT,
            file_path TEXT,
            model_id INTEGER,
            input_columns TEXT,
            output_columns TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );"""
    )
    print('Ensured apis table exists')
except Exception as e:
    print('Error creating apis table (ignored):', e)

# Create api_usage_logs table if not exists
try:
    cur.execute(
        """CREATE TABLE IF NOT EXISTS api_usage_logs (
            id INTEGER PRIMARY KEY,
            api_id INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            success INTEGER DEFAULT 1,
            response_time_ms REAL,
            error_message TEXT
        );"""
    )
    print('Ensured api_usage_logs table exists')
except Exception as e:
    print('Error creating api_usage_logs table (ignored):', e)

con.commit()
con.close()
print('DB initialization complete.')
