// API client for backend communication
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"

export interface CreateModelRequest {
  name: string
  description: string
}

export interface CreateModelResponse {
  id: string
  name: string
  description: string
  created_at: string
}

export interface AnalyzeCSVRequest {
  model_id: string
}

export interface AnalyzeCSVResponse {
  n_rows: number
  n_columns: number
  columns: string[]
}

export interface TrainingRequest {
  model_id: string
  task: "classification" | "regression"
  input_columns: string[]
  output_columns: string[]
}

export interface TrainingMetrics {
  accuracy?: number
  f1_score?: number
  precision?: number
  recall?: number
  confusion_matrix?: number[][]
  MSE?: number
  MAE?: number
  R2?: number
}

export interface TrainingResult {
  algorithm: string
  metrics: TrainingMetrics
  model_path: string
}

export interface TrainingResponse {
  best_algorithm: string
  justification: string
  all_results: TrainingResult[]
  task?: string
  input_columns?: string[]
  output_columns?: string[]
  best_model_path?: string
}

export interface PredictionRequest {
  model_id: string
  algorithm: string
  input_data: number[][]
}

export interface PredictionResponse {
  predictions: string[] | number[]
}

// API management interfaces
export interface APIMetrics {
  total_requests: number
  successful_requests: number
  failed_requests: number
  total_cpu_time: number
  total_memory_used: number
  average_response_time: number
}

export interface APIResponse {
  id: number
  model_id: number
  api_name: string
  description?: string
  best_algorithm: string
  created_at: string
  version: string
  metrics: APIMetrics
}

export interface APIDetailResponse extends APIResponse {
  file_path?: string
  input_columns?: string[]
  output_columns?: string[]
}

export interface APIListResponse {
  apis: APIResponse[]
  total: number
}

export interface DashboardStats {
  total_models: number
  total_apis: number
  total_predictions: number
  avg_response_time_ms: number
}

// API calls
export const apiClient = {
  createModel: async (data: CreateModelRequest): Promise<CreateModelResponse> => {
    const response = await fetch(`${BASE_URL}/models/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to create model")
    return response.json()
  },

  uploadCSV: async (modelId: string, file: File): Promise<{ status: string; path: string }> => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch(`${BASE_URL}/models/${modelId}/upload_csv`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) throw new Error("Failed to upload CSV")
    return response.json()
  },

  analyzeCSV: async (modelId: string): Promise<AnalyzeCSVResponse> => {
    const response = await fetch(`${BASE_URL}/training/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model_id: modelId }),
    })
    if (!response.ok) throw new Error("Failed to analyze CSV")
    return response.json()
  },

  trainModel: async (data: TrainingRequest): Promise<TrainingResponse> => {
    const response = await fetch(`${BASE_URL}/training/train`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to train model")
    return response.json()
  },

  predict: async (data: PredictionRequest): Promise<PredictionResponse> => {
    const response = await fetch(`${BASE_URL}/predict/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to get predictions")
    return response.json()
  },

  // API Management
  createAPI: async (modelId: number, apiName: string, description?: string) => {
    const response = await fetch(`${BASE_URL}/apis/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model_id: modelId, api_name: apiName, description }),
    })
    if (!response.ok) throw new Error("Failed to create API")
    return response.json() as Promise<APIDetailResponse>
  },

  listAPIs: async (skip: number = 0, limit: number = 100): Promise<APIListResponse> => {
    const response = await fetch(`${BASE_URL}/apis/?skip=${skip}&limit=${limit}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (!response.ok) throw new Error("Failed to list APIs")
    return response.json()
  },

  getAPIDetails: async (apiId: number): Promise<APIDetailResponse> => {
    const response = await fetch(`${BASE_URL}/apis/${apiId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (!response.ok) throw new Error("Failed to get API details")
    return response.json()
  },

  logAPIUsage: async (
    apiId: number,
    success: boolean,
    responseTimeMs: number,
    cpuTimeMs: number = 0,
    memoryUsedMb: number = 0,
    errorMessage?: string
  ) => {
    const response = await fetch(`${BASE_URL}/apis/${apiId}/usage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: success ? 1 : 0,
        response_time_ms: responseTimeMs,
        cpu_time_ms: cpuTimeMs,
        memory_used_mb: memoryUsedMb,
        error_message: errorMessage,
      }),
    })
    if (!response.ok) throw new Error("Failed to log API usage")
    return response.json()
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await fetch(`${BASE_URL}/apis/stats/dashboard`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (!response.ok) throw new Error("Failed to get dashboard stats")
    return response.json()
  },

  // API Consumption
  predictWithAPI: async (apiId: number, data: Record<string, number>) => {
    const response = await fetch(`${BASE_URL}/consume/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_id: apiId, data }),
    })
    if (!response.ok) throw new Error("Failed to make prediction with API")
    return response.json()
  },

  predictBatchWithAPI: async (apiId: number, data: Record<string, number>[]) => {
    const response = await fetch(`${BASE_URL}/consume/predict-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_id: apiId, data }),
    })
    if (!response.ok) throw new Error("Failed to make batch predictions with API")
    return response.json()
  },
}
