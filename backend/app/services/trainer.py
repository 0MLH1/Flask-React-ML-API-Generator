# trainer.py
import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    mean_squared_error,
    mean_absolute_error,
    r2_score
)
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, LinearRegression
from app.schemas.training import TrainingSummary, AlgorithmResult

MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

class Trainer:
    def train(self, model_id, task, input_cols, output_cols):
        """
        Train multiple algorithms and return results in a unified format.
        Saves trained models on disk and returns metadata for API generation.
        """
        # Load CSV from uploaded path
        from app.routers.models import _IN_MEMORY_MODELS as _MODELS
        model_record = _MODELS.get(model_id)
        if not model_record:
            raise ValueError(f"Model with ID {model_id} not found")
        csv_path = model_record.get("csv_path")
        if not csv_path:
            raise ValueError("CSV not uploaded for this model")

        df = pd.read_csv(csv_path)
        X = df[input_cols]
        y = df[output_cols[0]]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        results = []

        if task == "classification":
            models = {
                "random_forest": RandomForestClassifier(),
                "logistic_regression": LogisticRegression(max_iter=200)
            }
        else:  # regression
            models = {
                "random_forest_reg": RandomForestRegressor(),
                "linear_regression": LinearRegression()
            }

        for name, model in models.items():
            model.fit(X_train, y_train)
            pred = model.predict(X_test)

            if task == "classification":
                metric_values = {
                    "accuracy": float(accuracy_score(y_test, pred)),
                    "f1_score": float(f1_score(y_test, pred, average='weighted')),
                    "precision": float(precision_score(y_test, pred, average='weighted')),
                    "recall": float(recall_score(y_test, pred, average='weighted')),
                    "confusion_matrix": confusion_matrix(y_test, pred).tolist()
                }
            else:  # regression
                metric_values = {
                    "MSE": float(mean_squared_error(y_test, pred)),
                    "MAE": float(mean_absolute_error(y_test, pred)),
                    "R2": float(r2_score(y_test, pred))
                }

            # Save model
            model_path = os.path.join(MODEL_DIR, f"model_{model_id}_{name}.pkl")
            joblib.dump(model, model_path)

            results.append(
                AlgorithmResult(
                    algorithm=name,
                    metrics=metric_values,
                    model_path=model_path
                )
            )

        # Determine best algorithm
        if task == "classification":
            best = max(results, key=lambda x: x.metrics["accuracy"])
            justification = "Selected based on highest accuracy"
        else:
            best = min(results, key=lambda x: x.metrics["MSE"])
            justification = "Selected based on lowest MSE"

        summary = TrainingSummary(
            best_algorithm=best.algorithm,
            justification=justification,
            all_results=results,
            task=task,
            input_columns=input_cols,
            output_columns=output_cols,
            best_model_path=best.model_path
        )

        return summary
