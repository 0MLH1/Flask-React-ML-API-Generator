"""Service for generating Flask API files from trained ML models."""
import os
import json
from datetime import datetime
from typing import List, Dict, Any
import joblib


API_GENERATION_DIR = "generated_apis"
os.makedirs(API_GENERATION_DIR, exist_ok=True)


class APIGenerator:
    """Generates Flask API files for trained models."""
    
    @staticmethod
    def generate_api(
        model_id: int,
        api_name: str,
        best_algorithm: str,
        model_path: str,
        input_columns: List[str],
        output_columns: List[str],
        task: str,
    ) -> Dict[str, Any]:
        """
        Generate a Flask API file for the trained model.
        
        Args:
            model_id: ID of the model
            api_name: Name for the generated API
            best_algorithm: Name of the best algorithm used
            model_path: Path to the trained model file (.pkl)
            input_columns: List of input column names
            output_columns: List of output column names
            task: Type of task (classification or regression)
            
        Returns:
            Dictionary with API info including file_path
        """
        
        # Generate unique API filename
        sanitized_name = api_name.lower().replace(" ", "_")
        api_file_name = f"api_{model_id}_{sanitized_name}.py"
        api_file_path = os.path.join(API_GENERATION_DIR, api_file_name)
        
        # Create Flask API template
        flask_api_code = APIGenerator._generate_flask_template(
            api_name=api_name,
            model_id=model_id,
            best_algorithm=best_algorithm,
            model_path=model_path,
            input_columns=input_columns,
            output_columns=output_columns,
            task=task,
        )
        
        # Write Flask API to file using UTF-8 encoding to avoid platform encoding errors
        with open(api_file_path, "w", encoding="utf-8") as f:
            f.write(flask_api_code)
        
        return {
            "api_name": api_name,
            "file_path": api_file_path,
            "created_at": datetime.utcnow().isoformat(),
            "best_algorithm": best_algorithm,
            "input_columns": input_columns,
            "output_columns": output_columns,
            "task": task,
        }
    
    @staticmethod
    def _generate_flask_template(
        api_name: str,
        model_id: int,
        best_algorithm: str,
        model_path: str,
        input_columns: List[str],
        output_columns: List[str],
        task: str,
    ) -> str:
        """Generate Flask API template code."""
        
        input_cols_str = ", ".join([f'"{col}"' for col in input_columns])
        output_col_str = output_columns[0] if output_columns else "prediction"
        
        template = f'''"""Auto-generated Flask API for ML Model {model_id}."""
import os
import json
import joblib
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from datetime import datetime
import time

app = Flask(__name__)

# Configuration
MODEL_PATH = r"{model_path}"
API_NAME = "{api_name}"
MODEL_ID = {model_id}
BEST_ALGORITHM = "{best_algorithm}"
TASK = "{task}"
INPUT_COLUMNS = [{input_cols_str}]
OUTPUT_COLUMN = "{output_col_str}"

# Load model
try:
    model = joblib.load(MODEL_PATH)
    print(f"✓ Model loaded successfully from {{MODEL_PATH}}")
except Exception as e:
    print(f"✗ Error loading model: {{e}}")
    model = None


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({{
        "status": "ok",
        "api_name": API_NAME,
        "model_id": MODEL_ID,
        "algorithm": BEST_ALGORITHM,
        "timestamp": datetime.utcnow().isoformat()
    }})


@app.route("/info", methods=["GET"])
def api_info():
    """Get API information."""
    return jsonify({{
        "api_name": API_NAME,
        "model_id": MODEL_ID,
        "algorithm": BEST_ALGORITHM,
        "task": TASK,
        "input_columns": INPUT_COLUMNS,
        "output_column": OUTPUT_COLUMN,
        "created_at": datetime.utcnow().isoformat()
    }})


@app.route("/predict", methods=["POST"])
def predict():
    """
    Make prediction on input data.
    
    Expected JSON format:
    {{
        "data": {{
            "column1": value1,
            "column2": value2,
            ...
        }}
    }}
    
    Or for batch predictions:
    {{
        "data": [
            {{"column1": value1, "column2": value2}},
            {{"column1": value1, "column2": value2}}
        ]
    }}
    """
    try:
        if model is None:
            return jsonify({{"error": "Model not loaded"}}), 500
        
        request_data = request.get_json()
        if not request_data or "data" not in request_data:
            return jsonify({{"error": "Invalid request format. Expected {{'data': ...}}"}}), 400
        
        data = request_data["data"]
        start_time = time.time()
        
        # Handle single prediction
        if isinstance(data, dict):
            df = pd.DataFrame([data])
        # Handle batch predictions
        elif isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            return jsonify({{"error": "Data must be dict or list of dicts"}}), 400
        
        # Validate columns
        missing_cols = set(INPUT_COLUMNS) - set(df.columns)
        if missing_cols:
            return jsonify({{
                "error": f"Missing required columns: {{', '.join(missing_cols)}}"
            }}), 400
        
        # Make prediction
        X = df[INPUT_COLUMNS]
        predictions = model.predict(X)
        
        # Format response
        if isinstance(data, dict):
            result = {{"prediction": predictions[0].item() if hasattr(predictions[0], 'item') else float(predictions[0])}}
        else:
            result = {{"predictions": predictions.tolist()}}
        
        result["response_time_ms"] = (time.time() - start_time) * 1000
        result["task"] = TASK
        result["model_id"] = MODEL_ID
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({{"error": str(e)}}), 500


@app.errorhandler(404)
def not_found(e):
    """404 handler."""
    return jsonify({{"error": "Endpoint not found"}}), 404


@app.errorhandler(500)
def internal_error(e):
    """500 handler."""
    return jsonify({{"error": "Internal server error"}}), 500


if __name__ == "__main__":
    print(f"Starting {{API_NAME}} API for Model {{MODEL_ID}}...")
    print(f"Algorithm: {{BEST_ALGORITHM}} | Task: {{TASK}}")
    print(f"Input columns: {{INPUT_COLUMNS}}")
    app.run(debug=True, host="0.0.0.0", port=5000)
'''
        return template
