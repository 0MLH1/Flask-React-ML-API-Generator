"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiClient, type CreateModelResponse, type TrainingResponse } from "@/lib/api-client"
import { Loader2 } from "lucide-react"

interface TrainingStepProps {
  model: CreateModelResponse
  task: "classification" | "regression"
  inputColumns: string[]
  outputColumns: string[]
  onNext: (state: any) => void
  onPrevious: () => void
}

export function TrainingStep({ model, task, inputColumns, outputColumns, onNext, onPrevious }: TrainingStepProps) {
  const [results, setResults] = useState<TrainingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showAPICreation, setShowAPICreation] = useState(false)
  const [apiName, setApiName] = useState(`API-${model.id}`)
  const [apiDescription, setApiDescription] = useState("")
  const [creatingAPI, setCreatingAPI] = useState(false)
  const [apiCreated, setApiCreated] = useState(false)

  useEffect(() => {
    const train = async () => {
      try {
        const result = await apiClient.trainModel({
          model_id: model.id,
          task,
          input_columns: inputColumns,
          output_columns: outputColumns,
        })
        setResults(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to train model")
      } finally {
        setLoading(false)
      }
    }

    train()
  }, [model.id, task, inputColumns, outputColumns])

  const handleCreateAPI = async () => {
    try {
      setCreatingAPI(true)
      await apiClient.createAPI(parseInt(model.id), apiName, apiDescription)
      setApiCreated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API")
    } finally {
      setCreatingAPI(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Training Model...</h2>
        <div className="bg-muted/50 rounded-lg p-12 text-center">
          <div className="inline-block animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-muted-foreground">Training multiple algorithms on your data</p>
        </div>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Training Results</h2>
        <div className="bg-destructive/20 text-destructive px-4 py-3 rounded">{error || "Failed to train model"}</div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onPrevious} className="flex-1 bg-transparent">
            Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Training Results</h2>
        <p className="text-muted-foreground">Review model performance metrics</p>
      </div>

      {/* All Results */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">All Algorithms</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {results.all_results.map((result) => (
            <div
              key={result.algorithm}
              className={`rounded-lg p-4 border bg-muted/30 border-border`}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-foreground">{result.algorithm}</h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {Object.entries(result.metrics)
                  .filter(([, value]) => typeof value === "number")
                  .map(([key, value]) => (
                    <div key={key} className="bg-background/50 rounded p-2">
                      <div className="text-muted-foreground text-xs mb-1">{key.toUpperCase().replace(/_/g, " ")}</div>
                      <div className="font-semibold text-foreground">
                        {typeof value === "number"
                          ? value < 1
                            ? (value * 100).toFixed(1) + "%"
                            : value.toFixed(2)
                          : value}
                      </div>
                    </div>
                  ))}
              </div>

              {result.metrics.confusion_matrix && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-2">Confusion Matrix</div>
                  <div className="bg-background/50 rounded p-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <tbody>
                        {result.metrics.confusion_matrix.map((row, i) => (
                          <tr key={i}>
                            {row.map((val, j) => (
                              <td key={j} className="px-2 py-1 text-center text-foreground border border-border/50">
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* API Creation Section */}
      {!apiCreated ? (
        <>
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📦 Generate Flask API</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              After training, you can generate a ready-to-use Flask API for this model. This API will handle predictions
              and track usage metrics automatically.
            </p>
            <Button
              onClick={() => setShowAPICreation(!showAPICreation)}
              variant="outline"
              className="mt-3 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              {showAPICreation ? "Hide API Creation" : "Generate Flask API"}
            </Button>
          </div>

          {showAPICreation && (
            <div className="border border-border rounded-lg p-6 space-y-4">
              <h4 className="font-semibold text-foreground">API Configuration</h4>

              <div className="space-y-2">
                <Label htmlFor="api-name">API Name</Label>
                <Input
                  id="api-name"
                  value={apiName}
                  onChange={(e) => setApiName(e.target.value)}
                  placeholder="e.g., Iris Classifier API"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-description">Description (Optional)</Label>
                <Textarea
                  id="api-description"
                  value={apiDescription}
                  onChange={(e) => setApiDescription(e.target.value)}
                  placeholder="Describe what this API does..."
                  rows={3}
                />
              </div>

              <Button onClick={handleCreateAPI} disabled={creatingAPI} className="w-full">
                {creatingAPI ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating API...
                  </>
                ) : (
                  "Create API"
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">✓ API Created Successfully!</h3>
          <p className="text-sm text-green-800 dark:text-green-200 mb-4">
            Your Flask API has been generated and is ready to use. You can now make predictions through it and monitor
            its performance.
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onPrevious} className="flex-1 bg-transparent">
          Back
        </Button>
        {/*
        <Button
          onClick={() => onNext({ bestAlgorithm: results.best_algorithm, trainingResults: results })}
          className="flex-1"
        >
          Next - Make Predictions
        </Button>
        */}

        <Button
          className="flex-1"
          onClick={() => window.location.href = "http://localhost:3000"}
        >
          Finish
        </Button>

        
      </div>
    </div>
  )
}
