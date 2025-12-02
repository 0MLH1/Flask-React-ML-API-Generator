import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient, type APIResponse } from "@/lib/api-client"
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface APIConsumerPageProps {
  api: APIResponse
  onBack: () => void
}

export function APIConsumerPage({ api, onBack }: APIConsumerPageProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [prediction, setPrediction] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const [responseTime, setResponseTime] = useState<number>(0)

  // Initialize input fields based on model's input columns
  // Note: In a real scenario, you'd fetch this from API details
  const handleInputChange = (column: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [column]: value,
    }))
  }

  const handlePredict = async () => {
    // Basic validation
    if (Object.values(values).some((v) => !v.trim())) {
      setError("Please fill all input fields")
      return
    }

    try {
      setLoading(true)
      setError("")
      setSuccess(false)

      // Convert string values to numbers
      const numericData: Record<string, number> = {}
      for (const [key, val] of Object.entries(values)) {
        const num = parseFloat(val)
        if (isNaN(num)) {
          setError(`Invalid number for ${key}`)
          setLoading(false)
          return
        }
        numericData[key] = num
      }

      const result = await apiClient.predictWithAPI(api.id, numericData)
      setPrediction(result.prediction)
      setResponseTime(result.response_time_ms)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to make prediction")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Monitoring
          </Button>

          <h1 className="text-3xl font-bold text-foreground mb-2">Test API: {api.api_name}</h1>
          <p className="text-muted-foreground">Use this form to make predictions with your generated API</p>
        </div>

        {/* API Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">API Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Model ID</p>
                <p className="font-medium">Model {api.model_id}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Version</p>
                <p className="font-medium">{api.version}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prediction Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Make Prediction</CardTitle>
            <CardDescription>Enter input values to get a prediction from the API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Input Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dynamic input fields based on API's model input columns */}
                  {(api.input_columns && api.input_columns.length > 0 ? api.input_columns : ["feature_1", "feature_2", "feature_3"]).map((feature: string) => (
                    <div key={feature} className="space-y-2">
                      <Label htmlFor={feature} className="capitalize">
                        {feature.replace(/_|\./g, " ")}
                      </Label>
                      <Input
                        id={feature}
                        type="number"
                        placeholder="Enter value"
                        value={values[feature] || ""}
                        onChange={(e) => handleInputChange(feature, e.target.value)}
                        disabled={loading}
                        step="any"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Prediction Result */}
              {success && prediction !== null && (
                <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                      Prediction successful!
                    </p>
                    <div className="bg-white dark:bg-gray-950 rounded p-3 mb-2">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{prediction}</p>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300">Response time: {responseTime.toFixed(2)}ms</p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={onBack} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  onClick={handlePredict}
                  disabled={
                    Object.values(values).some((v) => !v.trim()) || loading
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    "Get Prediction"
                  )}
                </Button>
                {success && (
                  <Button
                    onClick={() => {
                      setValues({})
                      setPrediction(null)
                      setSuccess(false)
                    }}
                    variant="secondary"
                  >
                    New Prediction
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How to use this API consumer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              1. Enter numeric values for each input feature in the form above
            </p>
            <p>
              2. Click "Get Prediction" to send the request to your generated API
            </p>
            <p>
              3. The API will process your input and return a prediction
            </p>
            <p>
              4. Each request is automatically logged and contributes to your API's usage metrics
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
