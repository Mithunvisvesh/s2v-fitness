"use client"

import * as React from "react"
import { Trash2, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SignaturePadProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  onClear?: () => void
  onStartDrawing?: () => void
}

export function SignaturePad({ value, onChange, disabled, onClear, onStartDrawing }: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = React.useState(false)
  const [history, setHistory] = React.useState<string[]>([])

  // Initialize canvas context
  const getContext = React.useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    return ctx
  }, [])

  // Clear canvas
  const clear = React.useCallback(() => {
    const canvas = canvasRef.current
    const ctx = getContext()
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHistory([])
      onChange("")
      onClear?.()
    }
  }, [getContext, onChange, onClear])

  // Setup drawing configuration
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  // Redraw if value is provided from form state and history is empty (initial load)
  React.useEffect(() => {
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx || !value) return

    if (history.length === 0) {
      setHistory([value])
    }

    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    img.src = value
  }, [value, getContext])

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()

    if ("touches" in e) {
      if (e.touches.length === 0) return null
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return
    e.preventDefault()

    const coords = getCoordinates(e)
    const ctx = getContext()
    if (coords && ctx) {
      ctx.beginPath()
      ctx.moveTo(coords.x, coords.y)
      setIsDrawing(true)
      onStartDrawing?.()
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return
    e.preventDefault()

    const coords = getCoordinates(e)
    const ctx = getContext()
    if (coords && ctx) {
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    const canvas = canvasRef.current
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png")
      setHistory(prev => [...prev, dataUrl])
      onChange(dataUrl)
    }
  }

  const undo = React.useCallback(() => {
    if (disabled) return
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx) return

    const newHistory = [...history]
    newHistory.pop() // remove current state
    setHistory(newHistory)

    if (newHistory.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      onChange("")
      onClear?.()
    } else {
      const lastState = newHistory[newHistory.length - 1]
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        onChange(lastState)
      }
      img.src = lastState
    }
  }, [history, getContext, onChange, onClear, disabled])

  return (
    <div className="flex flex-col gap-2">
      <div className="relative border rounded-lg bg-white h-40 overflow-hidden shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />
        {disabled && (
          <div className="absolute inset-0 bg-muted/40 cursor-not-allowed" />
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={disabled || history.length === 0}
          className="gap-2"
        >
          <Undo2 className="h-4 w-4" />
          Undo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clear}
          disabled={disabled}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  )
}
