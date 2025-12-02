"use client"

import { useState, useEffect } from "react"
import { CreateModelDialog } from "@/components/create-model-dialog"
import { WorkflowContainer } from "@/components/workflow-container"
import { SelectAPIDialog } from "@/components/select-api-dialog"
import { APIMonitoringPage } from "@/components/api-monitoring-page"
import { apiClient, type CreateModelResponse, type APIResponse, type DashboardStats } from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer } from 'recharts'

type PageState = "list" | "workflow" | "api-selection" | "api-monitoring"

export default function Page() {
  const [currentModel, setCurrentModel] = useState<CreateModelResponse | null>(null)
  const [selectedAPI, setSelectedAPI] = useState<APIResponse | null>(null)
  const [pageState, setPageState] = useState<PageState>("list")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [showAPIDialog, setShowAPIDialog] = useState(false)
  const [apiList, setApiList] = useState<APIResponse[]>([])
  const [chartDataReady, setChartDataReady] = useState(false)
  const [mostUsedApisData, setMostUsedApisData] = useState<any[]>([])

  // Load dashboard stats on mount and periodically
  useEffect(() => {
    loadDashboardStats()
    const interval = setInterval(loadDashboardStats, 10000) // Refresh every 10 seconds
    // also load api list and build charts
    loadApisAndBuildCharts()

    return () => clearInterval(interval)
  }, [])

  const loadDashboardStats = async () => {
    try {
      setLoadingStats(true)
      const data = await apiClient.getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error("Failed to load dashboard stats:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  const loadApisAndBuildCharts = async () => {
    try {
      const res = await apiClient.listAPIs(0, 100)
      const apis = res.apis || []
      setApiList(apis)

      // Most used APIs (by total_requests)
      const mostUsed = apis
        .map((a) => ({ name: a.api_name || `api-${a.id}`, value: a.metrics?.total_requests || 0 }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
      setMostUsedApisData(mostUsed)



      setChartDataReady(true)
    } catch (e) {
      console.error('Failed to load APIs for charts', e)
    }
  }

  const handleModelCreated = (model: CreateModelResponse) => {
    setCurrentModel(model)
    setPageState("workflow")
  }

  const handleWorkflowComplete = async () => {
    // After training is complete, show option to create API or go back
    setPageState("list")
    setCurrentModel(null)
    loadDashboardStats() // Refresh stats
  }

  const handleBackToList = () => {
    setPageState("list")
    setCurrentModel(null)
    loadDashboardStats()
  }

  const handleAPISelected = (api: APIResponse) => {
    setSelectedAPI(api)
    setPageState("api-monitoring")
  }

  // Show workflow
  if (pageState === "workflow" && currentModel) {
    return (
      <WorkflowContainer
        model={currentModel}
        onBack={handleBackToList}
        onComplete={handleWorkflowComplete}
      />
    )
  }

  // Show API monitoring
  if (pageState === "api-monitoring" && selectedAPI) {
    return (
      <APIMonitoringPage
        api={selectedAPI}
        onBack={() => {
          setPageState("list")
          setSelectedAPI(null)
        }}
      />
    )
  }

  // Show main dashboard
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Multi Model Training Platform</h1>
          <p className="text-muted-foreground text-lg">Build, train, deploy, and monitor machine learning models</p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Models</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-3xl font-bold text-foreground">{stats?.total_models || 0}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total APIs</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-3xl font-bold text-foreground">{stats?.total_apis || 0}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-3xl font-bold text-foreground">{stats?.total_predictions || 0}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-3xl font-bold text-foreground">{stats?.avg_response_time_ms.toFixed(2) || 0}ms</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-12 justify-center">
          <CreateModelDialog onModelCreated={handleModelCreated} />
          {(stats?.total_apis || 0) > 0 && (
            <Button variant="outline" onClick={() => setShowAPIDialog(true)} size="lg">
              Select API for Testing
            </Button>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>1. Create a new model and give it a name</p>
              <p>2. Upload a CSV file with your training data</p>
              <p>3. Select task type (Classification or Regression)</p>
              <p>4. Choose target and feature columns</p>
              <p>5. Train the model and get results</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>✓ Auto-generate Flask APIs from trained models</p>
              <p>✓ Monitor API usage and performance metrics</p>
              <p>✓ Track success rates and response times</p>
              <p>✓ Measure resource consumption</p>
              <p>✓ Make predictions through your generated APIs</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts: Most Used APIs only (placed under Info Cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-8">
          <Card className="glass shadow-soft">
            <CardHeader>
              <CardTitle>Most Used APIs</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {mostUsedApisData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No API usage data yet.</p>
              ) : (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={mostUsedApisData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={36}
                      outerRadius={84}
                      paddingAngle={4}
                      label={(entry) => entry.name}
                    >
                      {mostUsedApisData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#6B21A8', '#4F46E5', '#06B6D4', '#7C3AED', '#0EA5A4', '#84CC16', '#F59E0B', '#EF4444'][index % 8]} />
                      ))}
                    </Pie>
                    <ReTooltip />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* API Selection Dialog */}
      <SelectAPIDialog open={showAPIDialog} onOpenChange={setShowAPIDialog} onAPISelected={handleAPISelected} />
    </main>
  )
}
