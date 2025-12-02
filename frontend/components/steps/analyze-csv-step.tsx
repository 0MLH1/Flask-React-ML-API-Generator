"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { apiClient, type CreateModelResponse, type AnalyzeCSVResponse } from "@/lib/api-client"

interface AnalyzeCSVStepProps {
  model: CreateModelResponse
  csvFile?: File
  onNext: (state: any) => void
  onPrevious: () => void
}

export function AnalyzeCSVStep({ model, csvFile, onNext, onPrevious }: AnalyzeCSVStepProps) {
  const [analysis, setAnalysis] = useState<AnalyzeCSVResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const analyze = async () => {
      try {
        const result = await apiClient.analyzeCSV(model.id)
        setAnalysis(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to analyze CSV")
      } finally {
        setLoading(false)
      }
    }

    analyze()
  }, [model.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Analyzing Data...</h2>
        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <div className="inline-block animate-spin text-2xl">⌛</div>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Data Analysis</h2>
        <div className="bg-destructive/20 text-destructive px-4 py-3 rounded">{error || "Failed to analyze data"}</div>
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
        <h2 className="text-2xl font-bold text-foreground mb-2">Data Analysis</h2>
        <p className="text-muted-foreground">Review your dataset before training</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Total Rows</div>
          <div className="text-3xl font-bold text-foreground">{analysis.n_rows}</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Total Columns</div>
          <div className="text-3xl font-bold text-foreground">{analysis.n_columns}</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm text-muted-foreground mb-1">File Size</div>
          <div className="text-3xl font-bold text-foreground">Ready</div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Columns ({analysis.n_columns})</h3>
        <div className="bg-muted/30 rounded-lg p-4 border border-border max-h-40 overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {analysis.columns.map((col) => (
              <div key={col} className="bg-card border border-border rounded-full px-3 py-1 text-sm text-foreground">
                {col}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onPrevious} className="flex-1 bg-transparent">
          Back
        </Button>
        <Button
          onClick={() =>
            onNext({
              columns: analysis.columns,
              nRows: analysis.n_rows,
              nColumns: analysis.n_columns,
            })
          }
          className="flex-1"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
