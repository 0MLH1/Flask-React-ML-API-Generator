"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { apiClient, type CreateModelResponse } from "@/lib/api-client"

interface UploadCSVStepProps {
  model: CreateModelResponse
  onNext: (state: any) => void
}

export function UploadCSVStep({ model, onNext }: UploadCSVStepProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile)
      setError("")
    } else {
      setError("Please select a valid CSV file")
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError("")

    try {
      const result = await apiClient.uploadCSV(model.id, file)
      onNext({ csvFile: file, csvPath: result.path })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload CSV")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Upload Training Data</h2>
        <p className="text-muted-foreground">Select a CSV file to train your model</p>
      </div>

      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent hover:bg-muted/30 transition-colors">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={loading}
          className="hidden"
          id="csv-input"
        />
        <label htmlFor="csv-input" className="cursor-pointer">
          <div className="text-4xl text-muted-foreground mb-2">📊</div>
          <div className="text-lg font-medium text-foreground mb-1">
            {file ? file.name : "Click to select a CSV file"}
          </div>
          <div className="text-sm text-muted-foreground">or drag and drop here</div>
        </label>
      </div>

      {error && <div className="bg-destructive/20 text-destructive px-4 py-3 rounded">{error}</div>}

      <div className="flex gap-3 pt-4">
        <Button variant="outline" disabled={!file || loading} className="flex-1 bg-transparent">
          Skip
        </Button>
        <Button onClick={handleUpload} disabled={!file || loading} className="flex-1">
          {loading ? "Uploading..." : "Next"}
        </Button>
      </div>
    </div>
  )
}
