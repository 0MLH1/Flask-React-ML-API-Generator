# model_selector.py
def select_best(task, trained_models):
    if task == "classification":
        return max(trained_models.items(), key=lambda x: x[1]["metric"])
    return min(trained_models.items(), key=lambda x: x[1]["metric"])