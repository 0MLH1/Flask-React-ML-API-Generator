from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
import joblib


def train_linear_regression(X, y, model_path):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

    model = LinearRegression()
    model.fit(X_train, y_train)

    joblib.dump(model, model_path)

    return model, X_test, y_test
