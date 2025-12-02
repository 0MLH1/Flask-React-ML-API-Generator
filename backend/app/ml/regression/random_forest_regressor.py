from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib


def train_random_forest_regressor(X, y, model_path):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

    model = RandomForestRegressor(n_estimators=200)
    model.fit(X_train, y_train)

    joblib.dump(model, model_path)

    return model, X_test, y_test
