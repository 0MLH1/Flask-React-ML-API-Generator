"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient, type CreateModelResponse, type PredictionResponse } from "@/lib/api-client"

interface PredictionStepProps {
  model: CreateModelResponse
  algorithm: string
  inputColumns: string[]
  onPrevious: () => void
}

export function PredictionStep({ model, algorithm, inputColumns, onPrevious }: PredictionStepProps) {
  const [values, setValues] = useState<string[]>(Array(inputColumns.length).fill(""))
  const [predictions, setPredictions] = useState<PredictionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (index: number, value: string) => {
    const newValues = [...values]
    newValues[index] = value
    setValues(newValues)
  }

  const handlePredict = async () => {
    // Validate all fields are filled
    if (values.some((v) => !v.trim())) {
      setError("Please fill all input fields")
      return
    }

    setLoading(true)
    setError("")

    try {
      const inputData = [values.map((v) => Number.parseFloat(v))]
      const result = await apiClient.predict({
        model_id: model.id,
        algorithm,
        input_data: inputData,
      })
      setPredictions(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to make prediction")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Make Predictions</h2>
        <p className="text-muted-foreground">Enter values for your input features</p>
      </div>

      {/* Input Form */}
      <div className="bg-muted/30 rounded-lg p-6 border border-border space-y-4">
        {inputColumns.map((col, index) => (
          <div key={col}>
            <label className="block text-sm font-medium text-foreground mb-2">{col}</label>
            <Input
              type="number"
              placeholder="Enter value"
              value={values[index]}
              onChange={(e) => handleInputChange(index, e.target.value)}
              disabled={loading}
              className="bg-input border-border"
              step="any"
            />
          </div>
        ))}
      </div>

      {error && <div className="bg-destructive/20 text-destructive px-4 py-3 rounded">{error}</div>}

      {/* Prediction Result */}
      {predictions && (
        <div className="bg-primary/10 border-2 border-primary rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-2">Prediction Result</div>
          <div className="text-3xl font-bold text-primary mb-4">
            {Array.isArray(predictions.predictions) ? predictions.predictions[0] : predictions.predictions}
          </div>
          <p className="text-sm text-muted-foreground">
            Using <span className="font-semibold text-foreground">{algorithm}</span> algorithm
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onPrevious} className="flex-1 bg-transparent">
          Back
        </Button>
        <Button onClick={handlePredict} disabled={values.some((v) => !v.trim()) || loading} className="flex-1">
          {loading ? "Predicting..." : "Get Prediction"}
        </Button>
        {predictions && (
          <Button
            onClick={() => {
              setValues(Array(inputColumns.length).fill(""))
              setPredictions(null)
            }}
            variant="secondary"
            className="flex-1"
          >
            New Prediction
          </Button>
        )}
      </div>
    </div>
  )
}
