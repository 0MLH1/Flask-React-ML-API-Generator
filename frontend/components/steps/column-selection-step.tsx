"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface ColumnSelectionStepProps {
  columns: string[]
  inputColumns: string[]
  outputColumns: string[]
  onNext: (state: any) => void
  onPrevious: () => void
}

export function ColumnSelectionStep({
  columns,
  inputColumns: initialInputColumns,
  outputColumns: initialOutputColumns,
  onNext,
  onPrevious,
}: ColumnSelectionStepProps) {
  const [inputColumns, setInputColumns] = useState<string[]>(initialInputColumns)
  const [outputColumns, setOutputColumns] = useState<string[]>(initialOutputColumns)

  const toggleInput = (col: string) => {
    setInputColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]))
  }

  const toggleOutput = (col: string) => {
    setOutputColumns((prev) => (prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Select Columns</h2>
        <p className="text-muted-foreground">Choose input (features) and output (target) columns</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Input Columns (Features)</h3>
          <div className="space-y-3 bg-muted/30 rounded-lg p-4 border border-border">
            {columns.map((col) => (
              <label key={col} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={inputColumns.includes(col)}
                  onCheckedChange={() => toggleInput(col)}
                  className="border-border"
                />
                <span className="text-foreground">{col}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Output Column (Target)</h3>
          <div className="space-y-3 bg-muted/30 rounded-lg p-4 border border-border">
            {columns.map((col) => (
              <label key={col} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={outputColumns.includes(col)}
                  onCheckedChange={() => toggleOutput(col)}
                  disabled={inputColumns.includes(col)}
                  className="border-border"
                />
                <span className={outputColumns.includes(col) ? "text-foreground" : "text-muted-foreground"}>{col}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onPrevious} className="flex-1 bg-transparent">
          Back
        </Button>
        <Button
          onClick={() => onNext({ inputColumns, outputColumns })}
          disabled={inputColumns.length === 0 || outputColumns.length === 0}
          className="flex-1"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
