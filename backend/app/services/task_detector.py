# task_detector.py
def detect_task(target_dtype):
    if target_dtype == "numeric":
        return "regression"
    return "classification"
