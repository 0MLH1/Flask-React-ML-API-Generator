"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { apiClient, type CreateModelResponse } from "@/lib/api-client"

interface CreateModelDialogProps {
  onModelCreated: (model: CreateModelResponse) => void
}

export function CreateModelDialog({ onModelCreated }: CreateModelDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Model name is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      const model = await apiClient.createModel({
        name: name.trim(),
        description: description.trim(),
      })
      setOpen(false)
      setName("")
      setDescription("")
      onModelCreated(model)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create model")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-32 w-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-accent hover:bg-card/50 transition-colors"
      >
        <div className="text-3xl font-light text-muted-foreground mb-2">+</div>
        <div className="text-sm font-medium text-foreground">New Model</div>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full mx-4 shadow-lg">
        <h2 className="text-2xl font-bold text-foreground mb-6">Create New Model</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Model Name</label>
            <Input
              placeholder="e.g., Customer Churn Prediction"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="bg-input border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <Textarea
              placeholder="Describe what this model will do..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="bg-input border-border resize-none"
              rows={3}
            />
          </div>
        </div>

        {error && <div className="bg-destructive/20 text-destructive px-3 py-2 rounded text-sm mb-4">{error}</div>}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading} className="flex-1">
            {loading ? "Creating..." : "Create Model"}
          </Button>
        </div>
      </div>
    </div>
  )
}
