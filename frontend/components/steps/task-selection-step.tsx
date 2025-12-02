"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface TaskSelectionStepProps {
  onNext: (state: any) => void
  onPrevious: () => void
}

export function TaskSelectionStep({ onNext, onPrevious }: TaskSelectionStepProps) {
  const [selected, setSelected] = useState<"classification" | "regression" | null>(null)

  const tasks = [
    {
      id: "classification",
      title: "Classification",
      description: "Predict categories or classes (e.g., spam/not spam, customer segments)",
      icon: "🏷️",
    },
    {
      id: "regression",
      title: "Regression",
      description: "Predict continuous values (e.g., price, temperature, sales)",
      icon: "📈",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Select Task Type</h2>
        <p className="text-muted-foreground">Choose the type of prediction you want to make</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => setSelected(task.id as "classification" | "regression")}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              selected === task.id ? "border-accent bg-accent/10" : "border-border hover:border-accent/50 bg-muted/30"
            }`}
          >
            <div className="text-4xl mb-3">{task.icon}</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{task.title}</h3>
            <p className="text-sm text-muted-foreground">{task.description}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onPrevious} className="flex-1 bg-transparent">
          Back
        </Button>
        <Button onClick={() => onNext({ task: selected })} disabled={!selected} className="flex-1">
          Next
        </Button>
      </div>
    </div>
  )
}
