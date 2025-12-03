import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient, type APIResponse } from "@/lib/api-client"
import { ArrowLeft, Activity, TrendingUp, Clock, HardDrive } from "lucide-react"
import { format } from "date-fns"
import { APIConsumerPage } from "./api-consumer-page"

interface APIMonitoringPageProps {
  api: APIResponse
  onBack: () => void
  onConsume?: (api: APIResponse) => void
}

type PageView = "monitoring" | "consumer"

export function APIMonitoringPage({ api, onBack, onConsume }: APIMonitoringPageProps) {
  const [details, setDetails] = useState<APIResponse | null>(api)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [view, setView] = useState<PageView>("monitoring")

  useEffect(() => {
    loadAPIDetails()
    // Refresh every 5 seconds
    const interval = setInterval(loadAPIDetails, 5000)
    return () => clearInterval(interval)
  }, [api.id])

  const loadAPIDetails = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAPIDetails(api.id)
      setDetails(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API details")
    } finally {
      setLoading(false)
    }
  }

  if (view === "consumer" && details) {
    return <APIConsumerPage api={details} onBack={() => setView("monitoring")} />
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Loading API details...</p>
          </div>
        </div>
      </div>
    )
  }

  const successRate =
    details.metrics.total_requests > 0
      ? Math.round((details.metrics.successful_requests / details.metrics.total_requests) * 100)
      : 0

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{details.api_name}</h1>
              <p className="text-muted-foreground">{details.description || "No description provided"}</p>
            </div>

            <Button onClick={() => setView("consumer")} size="lg">
              Consume API
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Tabs for different sections */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="info">API Info</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Requests */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Total Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{details.metrics.total_requests}</div>
                  <p className="text-xs text-muted-foreground mt-1">All-time predictions</p>
                </CardContent>
              </Card>

              {/* Success Rate */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{successRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {details.metrics.successful_requests} / {details.metrics.total_requests}
                  </p>
                </CardContent>
              </Card>

              {/* Avg Response Time */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    Avg Response Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{details.metrics.average_response_time.toFixed(2)}ms</div>
                  <p className="text-xs text-muted-foreground mt-1">Per request</p>
                </CardContent>
              </Card>

              {/* Total Resource Usage */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-purple-500" />
                    Resource Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{details.metrics.total_memory_used.toFixed(1)}MB</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {details.metrics.total_cpu_time.toFixed(2)}s CPU
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Health Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Health Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div
                    className={`h-4 w-4 rounded-full ${
                      successRate > 90 ? "bg-green-500" : successRate > 70 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                  />
                  <span className="font-medium">
                    {successRate > 90
                      ? "Excellent - API is performing well"
                      : successRate > 70
                        ? "Good - API is working but has some issues"
                        : "Poor - API needs attention"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Successful Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Successful Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {details.metrics.successful_requests}
                  </p>
                </CardContent>
              </Card>

              {/* Failed Requests */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Failed Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {details.metrics.failed_requests}
                  </p>
                </CardContent>
              </Card>

              {/* Total CPU Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total CPU Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {details.metrics.total_cpu_time.toFixed(2)}s
                  </p>
                </CardContent>
              </Card>

              {/* Total Memory Used */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Memory Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {details.metrics.total_memory_used.toFixed(1)}MB
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API Info Tab */}
          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>API Information</CardTitle>
                <CardDescription>Technical details about this generated API</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* API ID */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">API ID</p>
                  <p className="font-medium text-lg">{details.id}</p>
                </div>

                {/* Model ID */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Model ID</p>
                  <p className="font-medium text-lg">{details.model_id}</p>
                </div>

                {/* Version */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Version</p>
                  <p className="font-medium text-lg">{details.version}</p>
                </div>

                {/* Created */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Created</p>
                  <p className="font-medium text-lg">{format(new Date(details.created_at), "PPP p")}</p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Status</p>
                  <Badge className="bg-green-500">Active</Badge>
                </div>

                {/* Request URL */}
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-2">Request URL (POST)</p>
                  <p className="font-mono p-2 bg-muted rounded text-sm">
                    {`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/consume"}/predict/`}
                  </p>
                </div>

                {/* Example Postman JSON */}
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-2">Postman Body Example</p>
                  <pre className="p-4 bg-muted rounded text-xs font-mono overflow-auto">
                    {JSON.stringify({
                      api_id: details.id,
                      data: [
                        (details.input_columns ?? []).reduce((acc, col) => {
                          acc[col] = 0
                          return acc
                        }, {} as Record<string, number>)
                      ],
                    }, null, 2)}
                  </pre>
                </div>

              </CardContent>

            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-between">
          <Button onClick={() => loadAPIDetails()} variant="outline">
            Refresh Data
          </Button>
          <Button onClick={() => setView("consumer")} size="lg">
            Consume API for Predictions
          </Button>
        </div>
      </div>
    </main>
  )
}
