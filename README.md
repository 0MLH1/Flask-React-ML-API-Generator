# MULTI MODEL ML Platform by Mohamed LAHMAM

A comprehensive platform featuring a **FastAPI backend** and a **Next.js React frontend** for creating, training, deploying models and generating machine learning APIs with ease.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Running Locally](#option-running-locally)
3. [Project Structure](#project-structure)
4. [Complete Workflow Guide](#complete-workflow-guide)
5. [API Endpoints](#api-endpoints)
6. [Features](#features)
7. [Technologies Used](#technologies-used)
8. [Prerequisites](#prerequisites)
9. [Limits and Constraints](#limits-and-constraints)
10. [Troubleshooting](#troubleshooting)
11. [License](#license)

---

### 📋 Prerequisites

- **Python** 3.10+ (3.11 recommended)
- **Node.js** 18+ LTS
- **npm** 9+
- Minimum 2 GB available RAM
- Minimum 1 GB disk space

### 🔧 Step 1: Backend Setup

Navigate to backend directory:

```bash
cd backend
```

Create and activate virtual environment:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend server:

```bash
uvicorn app.main:app --reload 
```

✅ **Backend is ready at**: http://localhost:8000/docs

### 🔧 Step 2: Frontend Setup (in another terminal)

Navigate to frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Or use pnpm instead
```bash
use pnpm
```

Start the development server:

```bash
npm run dev
```

with pnpm
```bash
pnpm run dev
```


✅ **Frontend is ready at**: http://localhost:3000

### 📊 Step 3: Verify Both Services Running

- Open http://localhost:3000 in your browser
- You should see the application interface
- Backend should respond at http://localhost:8000/docs

---

## 📁 Project Structure

```
multi-model-app/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI entry point
│   │   ├── config/
│   │   │   └── settings.py         # Configuration
│   │   ├── database/
│   │   │   ├── connection.py       # Database setup
│   │   │   └── models_repository.py# Data models
│   │   ├── ml/
│   │   │   ├── classification/     # Classification algorithms
│   │   │   ├── regression/         # Regression algorithms
│   │   │   └── utils/              # ML utilities
│   │   ├── routers/
│   │   │   ├── models.py           # Model endpoints
│   │   │   ├── predict.py          # Prediction endpoints
│   │   │   ├── training.py         # Training endpoints
│   │   │   └── api_consumer.py     # API usage endpoints
│   │   ├── schemas/                # Request/response models
│   │   └── services/               # Business logic
│   ├── data/
│   │   └── Iris.csv               # Sample dataset
│   ├── models/                     # Trained model storage
│   ├── requirements.txt            # Python dependencies
│   
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Home page
│   │   └── globals.css            # Global styles (modern Apple design)
│   ├── components/
│   │   ├── steps/                 # Workflow steps
│   │   ├── ui/                    # Reusable UI components
│   │   └── *.tsx                  # Feature components
│   ├── lib/
│   │   └── api-client.ts          # Backend API communication
│   ├── package.json               # JavaScript dependencies
│   
├── README.md                       # This file
└── LICENSE                         # MIT License

```

---

## 🔄 Complete Workflow Guide

This section explains the typical user journey through the application.

### Step 1️⃣: Create a New Model

**What it does**: Initialize a new ML model entry in the system

**Frontend**: Click "Create New Model" → Enter model name
**Backend**: `POST /api/models/` → Returns model_id and version

```json
{
  "name": "Iris Classifier v1",
  "description": "Classification model for Iris dataset",
  "model_type": "classification"
}
```

### Step 2️⃣: Upload CSV Dataset

**What it does**: Upload your training data

**Frontend**: Select model → Upload CSV file (max 100 MB)
**Backend**: `POST /api/models/{model_id}/upload_csv`

**Supported formats:**
- CSV with comma delimiter
- CSV with other delimiters (auto-detected)
- Encodings: UTF-8, ISO-8859-1, Windows-1252

### Step 3️⃣: Analyze CSV Data

**What it does**: Inspects data and provides statistics

**Frontend**: Click "Analyze CSV" after upload
**Backend**: `POST /api/training/analyze` 
**Returns**:
- Column names and types (numeric, categorical, datetime)
- Missing values count
- Basic statistics (min, max, mean)
- Unique value counts

### Step 4️⃣: Select Task Type & Columns

**What it does**: Configure the ML problem

**Choose**:
1. **Task Type**: Classification OR Regression
2. **Target Column**: The variable you want to predict
3. **Feature Columns**: Input variables for the model
4. **Preprocessing Options**: Scaling, encoding preferences

### Step 5️⃣: Train the Model

**What it does**: Train the ML algorithm and evaluate performance

**Frontend**: Click "Train Model"
**Backend**: `POST /api/training/train`

**During training**:
- Data split: 80% training, 20% testing
- Algorithm selection: Best performer is selected
- Metrics tracked: Accuracy/R², Precision, Recall, F1-Score
- Model saved: joblib format for future predictions
- Duration: 30 seconds to 5 minutes (depends on dataset size)

### Step 6️⃣: Generate Flask API

**What it does**: Use trained model to generated a featured API ready to use.

#### Single Prediction
- Just click the generate API button in the final step of the process, and go back to the dashboard and select your API from the 'select API list'


### Step 7️⃣: Monitor API Usage

**What it does**: Track resource consumption and API health

**Metrics**:
- Total API calls
- Average response time
- CPU time used
- Memory consumed
- Success/error rate

---

## 📡 API Endpoints

### Model Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/models/` | Create new model |
| GET | `/api/models/` | List all models |
| GET | `/api/models/{id}` | Get model details |
| DELETE | `/api/models/{id}` | Delete a model |

### Data Upload & Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/models/{id}/upload_csv` | Upload training data |
| POST | `/api/training/analyze` | Analyze CSV structure |
| POST | `/api/training/task_detect` | Auto-detect task type |

### Training

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/training/train` | Train the model |
| GET | `/api/training/progress/{id}` | Get training progress |


### Generated API routes

| Method | Endpoint                     | Description            |
| ------ | ---------------------------- | ---------------------- |
| POST   | `/api/apis/create`           | Create API             |
| GET    | `/api/apis/`                 | List APIs              |
| GET    | `/api/apis/{api_id}`         | Get API Details        |
| POST   | `/api/apis/{api_id}/usage`   | Log API Usage          |
| GET    | `/api/apis/stats/dashboard`  | Get Dashboard Stats    |
| POST   | `/api/consume/predict`       | Predict With API       |
| POST   | `/api/consume/predict-batch` | Predict Batch With API |



### Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/docs` | Interactive API docs (Swagger) |
| GET | `/redoc` | ReDoc documentation |

---

## ✨ Features

### 🎯 Machine Learning
- ✅ Automatic task detection (Classification/Regression)
- ✅ Multiple algorithms: Logistic Regression, Random Forest, SVM, Gradient Boosting
- ✅ Automatic hyperparameter tuning
- ✅ Cross-validation support
- ✅ Feature importance analysis
- ✅ Model serialization and versioning

### 📊 Data Processing
- ✅ CSV file upload and parsing
- ✅ Automatic data type detection
- ✅ Missing value handling
- ✅ Categorical encoding
- ✅ Feature scaling and normalization
- ✅ Data quality analysis

### 🎨 User Interface
- ✅ Modern Apple-inspired design
- ✅ Dark/Light mode support
- ✅ Step-by-step workflow guidance
- ✅ Real-time progress tracking
- ✅ Interactive data visualization
- ✅ Responsive design (desktop, tablet, mobile)

### 📈 Analytics & Monitoring
- ✅ API usage tracking
- ✅ CPU and memory monitoring
- ✅ Response time metrics
- ✅ Prediction history
- ✅ Performance dashboards
- ✅ Resource consumption insights

### 🔒 Production Ready
- ✅ Error handling and validation
- ✅ Database persistence (SQLite)
- ✅ Docker containerization
- ✅ Environment-based configuration
- ✅ Logging and debugging
- ✅ RESTful API design

---

## 🛠 Technologies Used

### Backend Stack
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.10+
- **ORM**: SQLAlchemy 2.0+
- **Database**: SQLite 3.0+ (development)
- **Machine Learning**: Scikit-learn 1.3+, Pandas 2.0+, NumPy 1.24+
- **Async**: uvicorn 0.24+
- **Validation**: Pydantic 2.0+

### Frontend Stack
- **Framework**: Next.js 14+
- **UI Library**: React 18+
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 3.0+
- **Components**: Shadcn/ui
- **HTTP Client**: Axios
- **State**: React Hooks
- **Toast Notifications**: Sonner

### DevOps & Deployment
- **Version Control**: Git
- **Package Managers**: npm (frontend), pip (backend) , pnpm(frontend) as well

### Development Tools
- **Backend Dev**: Uvicorn, Pytest
- **Frontend Dev**: npm, TypeScript, ESLint
- **Code Quality**: Prettier, Black
- **Documentation**: OpenAPI/Swagger

---

## 📋 Prerequisites

### For Docker Execution (Easiest)
| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Docker | 20.10 | 24.0+ |
| RAM | 4 GB | 8 GB |
| Disk Space | 2 GB | 5 GB |
| CPU Cores | 2 | 4+ |

### For Local Execution
| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Python | 3.8 | 3.11 |
| Node.js | 16 | 18 LTS |
| npm | 8 | 9+ |
| RAM | 2 GB | 4 GB |
| Disk Space | 1 GB | 2 GB |

### System Requirements
- **OS**: Windows 10+, macOS 10.14+, Linux (Ubuntu 18.04+)
- **Browser**: Chrome, Firefox, Safari (latest versions)
- **Internet**: Required for npm/pip package downloads

---

## 📊 Limits and Constraints

### Data Limits
| Limit | Value | Notes |
|-------|-------|-------|
| Max CSV file size | 100 MB | Configurable in settings.py |
| Max number of features | 1000 columns | Memory dependent |
| Max rows per batch prediction | 1000 rows | API safety limit |
| Max number of models | Unlimited | Storage dependent |
| Training timeout | 30 minutes | Configurable |

### Format Support
| Format | Support | Notes |
|--------|---------|-------|
| CSV | ✅ Full | Comma, semicolon, tab delimited |
| TSV | ✅ Full | Auto-detected |
| Excel | ❌ Not supported | Convert to CSV first |
| JSON | ❌ Not supported | Use CSV format |
| Parquet | ❌ Not supported | Use CSV format |

### Character Encoding
- UTF-8 (recommended)
- ISO-8859-1
- Windows-1252

### Supported Algorithms
- **Classification**: Logistic Regression, Random Forest, SVM, Gradient Boosting
- **Regression**: Linear Regression, Ridge, Lasso, Random Forest, Gradient Boosting

---

## 🐛 Troubleshooting

### Docker Issues

**Problem**: "Docker daemon is not running"
```bash
# Solution: Start Docker Desktop or Docker daemon
# Windows/Mac: Open Docker Desktop
# Linux: sudo systemctl start docker
```

**Problem**: "Port 3000 or 8000 already in use"
```bash
# Solution:change ports in docker-compose.yml
```

**Problem**: "Out of memory" during training
```bash
# Increase Docker memory allocation:
# Docker Desktop Settings → Resources → Memory (set to 8GB+)
# Or reduce dataset size
```

### Local Setup Issues

**Problem**: Python "ModuleNotFoundError"
```bash
# Solution: Activate virtual environment
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate

# Then reinstall requirements
pip install -r requirements.txt --upgrade
```

**Problem**: Port 3000 already in use
```bash
# Kill process using port 3000
# Windows: netstat -ano | findstr :3000 | taskkill /PID <PID> /F
# Linux/Mac: lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

**Problem**: "CORS error" from frontend
```bash
# Backend CORS is configured in app/main.py
# Check that http://localhost:3000 is in allowed origins
# Restart both frontend and backend
```

### API Issues

**Problem**: "Connection refused" on http://localhost:8000
```bash
# Ensure backend is running
# Docker: Check with docker ps
# Local: Check uvicorn server output
```

**Problem**: Training takes too long
```bash
# Use smaller dataset
# Reduce number of features
# Use simpler model configuration
# Check CPU usage: high CPU = normal
```

**Problem**: Out of memory during training
```bash
# Use smaller dataset (< 50MB CSV)
# Reduce number of features
# Reduce number of rows
# Increase available system RAM
```

---

## 📝 License

MIT License - See the `LICENSE` file for full details.

### Summary
- ✅ Free for personal and commercial use
- ✅ Modify and distribute freely
- ✅ Must include license notice
- ⚠️ No warranty provided

---

## 📞 Support & Contribution

### Getting Help
1. Check the [Troubleshooting](#troubleshooting) section
2. Review API docs at http://localhost:8000/docs
3. Review project issues on GitHub

### Contributing
We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Last Updated**: November 2025
**Version**: 1.0.0
**Author**: Mohamed LAHMAM