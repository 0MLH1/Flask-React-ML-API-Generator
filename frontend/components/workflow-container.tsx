"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UploadCSVStep } from "./steps/upload-csv-step"
import { AnalyzeCSVStep } from "./steps/analyze-csv-step"
import { TaskSelectionStep } from "./steps/task-selection-step"
import { ColumnSelectionStep } from "./steps/column-selection-step"
import { TrainingStep } from "./steps/training-step"
// import { PredictionStep } from "./steps/prediction-step"
import type { CreateModelResponse } from "@/lib/api-client"

type WorkflowStep = "upload" | "analyze" | "taskSelection" | "columnSelection" | "training" /* | "prediction" */

interface WorkflowState {
  csvFile?: File
  csvPath?: string
  columns: string[]
  nRows: number
  nColumns: number
  task?: "classification" | "regression"
  inputColumns: string[]
  outputColumns: string[]
  trainingResults?: any
  bestAlgorithm?: string
}

interface WorkflowContainerProps {
  model: CreateModelResponse
  onBack: () => void
  onComplete?: () => void
}

export function WorkflowContainer({ model, onBack, onComplete }: WorkflowContainerProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("upload")
  const [state, setState] = useState<WorkflowState>({
    columns: [],
    nRows: 0,
    nColumns: 0,
    inputColumns: [],
    outputColumns: [],
  })

  const steps: { id: WorkflowStep; label: string; number: number }[] = [
    { id: "upload", label: "Upload CSV", number: 1 },
    { id: "analyze", label: "Analyze Data", number: 2 },
    { id: "taskSelection", label: "Select Task", number: 3 },
    { id: "columnSelection", label: "Select Columns", number: 4 },
    { id: "training", label: "Train Model", number: 5 },
    //{ id: "prediction", label: "Make Predictions", number: 6 },
  ]

  const currentStepNumber = steps.findIndex((s) => s.id === currentStep) + 1

  const handleNext = (newState?: Partial<WorkflowState>) => {
    if (newState) setState((prev) => ({ ...prev, ...newState }))
    const currentIndex = steps.findIndex((s) => s.id === currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id)
    }
  }

  const handlePrevious = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={onBack} className="mb-4 text-muted-foreground hover:text-foreground">
            ← Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">{model.name}</h1>
          <p className="text-muted-foreground">{model.description}</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    index < currentStepNumber - 1
                      ? "bg-primary text-primary-foreground"
                      : index === currentStepNumber - 1
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index < currentStepNumber - 1 ? "✓" : step.number}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      index < currentStepNumber - 1 ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-2 text-xs">
            {steps.map((step) => (
              <div key={step.id} className="text-center text-muted-foreground">
                {step.label}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-card border border-border rounded-lg p-8">
          {currentStep === "upload" && <UploadCSVStep model={model} onNext={handleNext} />}
          {currentStep === "analyze" && (
            <AnalyzeCSVStep model={model} csvFile={state.csvFile} onNext={handleNext} onPrevious={handlePrevious} />
          )}
          {currentStep === "taskSelection" && <TaskSelectionStep onNext={handleNext} onPrevious={handlePrevious} />}
          {currentStep === "columnSelection" && (
            <ColumnSelectionStep
              columns={state.columns}
              inputColumns={state.inputColumns}
              outputColumns={state.outputColumns}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
          {currentStep === "training" && (
            <TrainingStep
              model={model}
              task={state.task!}
              inputColumns={state.inputColumns}
              outputColumns={state.outputColumns}
              onNext={handleNext}
              onPrevious={handlePrevious}
            />
          )}
          {/*
          {currentStep === "prediction" && state.bestAlgorithm && (
            <PredictionStep
              model={model}
              algorithm={state.bestAlgorithm}
              inputColumns={state.inputColumns}
              onPrevious={handlePrevious}
            />
          )}
          */}
        </div>
      </div>
    </main>
  )
}
