from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib


def train_svm_classifier(X, y, model_path):
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2)

    model = SVC(probability=True)
    model.fit(X_train, y_train)

    joblib.dump(model, model_path)

    return model, X_test, y_test
