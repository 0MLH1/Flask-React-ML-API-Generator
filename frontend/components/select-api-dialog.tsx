import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient, type APIResponse } from "@/lib/api-client"
import { Loader2 } from "lucide-react"

interface SelectAPIDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAPISelected: (api: APIResponse) => void
}

export function SelectAPIDialog({ open, onOpenChange, onAPISelected }: SelectAPIDialogProps) {
  const [apis, setApis] = useState<APIResponse[]>([])
  const [selectedApiId, setSelectedApiId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    if (open) {
      loadAPIs()
    }
  }, [open])

  const loadAPIs = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await apiClient.listAPIs()
      setApis(response.apis)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load APIs")
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = () => {
    const selected = apis.find((api) => api.id.toString() === selectedApiId)
    if (selected) {
      onAPISelected(selected)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select API</DialogTitle>
          <DialogDescription>Choose an API to use for making predictions</DialogDescription>
        </DialogHeader>

        {error && <div className="text-sm text-red-500 mb-4">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : apis.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">No APIs available. Create one first.</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-select">Available APIs</Label>
              <Select value={selectedApiId} onValueChange={setSelectedApiId}>
                <SelectTrigger id="api-select">
                  <SelectValue placeholder="Select an API..." />
                </SelectTrigger>
                <SelectContent>
                  {apis.map((api) => (
                    <SelectItem key={api.id} value={api.id.toString()}>
                      {api.api_name} (Model {api.model_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedApiId && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                {apis.find((api) => api.id.toString() === selectedApiId) && (
                  <>
                    <p className="font-medium mb-2">API Details</p>
                    <div className="space-y-1 text-xs">
                      <p>
                        <strong>Requests:</strong> {apis.find((api) => api.id.toString() === selectedApiId)?.metrics.total_requests}
                      </p>
                      <p>
                        <strong>Success Rate:</strong>{" "}
                        {apis.find((api) => api.id.toString() === selectedApiId)?.metrics.successful_requests}/
                        {apis.find((api) => api.id.toString() === selectedApiId)?.metrics.total_requests}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSelect} disabled={!selectedApiId}>
                Select API
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
