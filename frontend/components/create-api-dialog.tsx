import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api-client"
import { Loader2 } from "lucide-react"

interface CreateAPIDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modelId: number
  onAPICreated: () => void
}

export function CreateAPIDialog({ open, onOpenChange, modelId, onAPICreated }: CreateAPIDialogProps) {
  const [apiName, setApiName] = useState(`API-${modelId}`)
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCreate = async () => {
    if (!apiName.trim()) {
      setError("API name is required")
      return
    }

    try {
      setLoading(true)
      setError("")
      await apiClient.createAPI(modelId, apiName, description)
      setApiName(`API-${modelId}`)
      setDescription("")
      onOpenChange(false)
      onAPICreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create API</DialogTitle>
          <DialogDescription>Generate a Flask API from your trained model</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="api-name">API Name</Label>
            <Input
              id="api-name"
              value={apiName}
              onChange={(e) => setApiName(e.target.value)}
              placeholder="e.g., Iris Classifier API"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-description">Description (Optional)</Label>
            <Textarea
              id="api-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this API does..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create API"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
