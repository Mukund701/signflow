"use client"

import { useRef, useState } from "react"
import SignatureCanvas from "react-signature-canvas"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eraser, Check, PenTool, Type } from "lucide-react"

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveSignature: (signatureDataUrl: string) => void
}

const SIGNATURE_FONTS = ["Caveat", "Dancing Script", "Great Vibes", "Pacifico"]
const INK_COLORS = [
  { name: "Black", value: "#000000" },
  { name: "Blue", value: "#0000b3" },
  { name: "Red", value: "#d30000" }
]

export function SignatureModal({ isOpen, onClose, onSaveSignature }: SignatureModalProps) {
  const sigCanvas = useRef<SignatureCanvas | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const [inkColor, setInkColor] = useState(INK_COLORS[0].value)
  const [thickness, setThickness] = useState(2) 
  const [activeTab, setActiveTab] = useState<"draw" | "type">("draw")
  const [typedName, setTypedName] = useState("")
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0])

  const clear = () => {
    sigCanvas.current?.clear()
    setIsEmpty(true)
  }

  const save = () => {
    if (activeTab === "draw") {
      if (sigCanvas.current?.isEmpty()) return
      const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png")
      if (dataUrl) finishSaving(dataUrl)
    } 
    else if (activeTab === "type") {
      if (!typedName.trim()) return
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      const fontSize = 60
      ctx.font = `${thickness === 3 ? 'bold ' : ''}${fontSize}px "${selectedFont}", cursive`
      const metrics = ctx.measureText(typedName)
      const width = Math.max(metrics.width + 40, 200) 
      const height = 120 
      canvas.width = width
      canvas.height = height
      ctx.font = `${thickness === 3 ? 'bold ' : ''}${fontSize}px "${selectedFont}", cursive`
      ctx.fillStyle = inkColor 
      ctx.textBaseline = "middle"
      ctx.textAlign = "center"
      ctx.fillText(typedName, width / 2, height / 2)
      const dataUrl = canvas.toDataURL("image/png")
      finishSaving(dataUrl)
    }
  }

  const finishSaving = (dataUrl: string) => {
    onSaveSignature(dataUrl) 
    onClose()
    setTimeout(() => {
      clear()
      setTypedName("")
    }, 200)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Dancing+Script:wght@600&family=Great+Vibes&family=Pacifico&display=swap');`}} />
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Create Your Signature</DialogTitle>
            <DialogDescription className="sr-only">Draw or type your signature to save it to your vault.</DialogDescription>
          </DialogHeader>
          
          <div className="flex rounded-lg bg-muted p-1 w-full">
            <button onClick={() => setActiveTab("draw")} className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${activeTab === "draw" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <PenTool className="h-4 w-4" /> Draw
            </button>
            <button onClick={() => setActiveTab("type")} className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all ${activeTab === "type" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Type className="h-4 w-4" /> Type
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-md border border-border bg-card px-3 py-2 mt-2 gap-3 sm:gap-0 w-full">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground min-w-[30px] sm:min-w-0">Ink:</span>
              <div className="flex gap-2">
                {INK_COLORS.map(color => (
                  <button key={color.name} onClick={() => setInkColor(color.value)} className={`h-6 w-6 rounded-full border-2 transition-all ${inkColor === color.value ? 'border-primary scale-110' : 'border-transparent'}`} style={{ backgroundColor: color.value }} title={color.name} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-muted-foreground min-w-[45px] sm:min-w-0">Weight:</span>
              <div className="flex gap-1">
                <button onClick={() => setThickness(1)} className={`px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${thickness === 1 ? 'bg-muted font-bold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Thin</button>
                <button onClick={() => setThickness(2)} className={`px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${thickness === 2 ? 'bg-muted font-bold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Normal</button>
                <button onClick={() => setThickness(3)} className={`px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${thickness === 3 ? 'bg-muted font-bold text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Thick</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 py-2 w-full overflow-hidden">
            {activeTab === "draw" && (
              <div className="animate-in fade-in slide-in-from-left-2 w-full">
                <div className="rounded-md border-2 border-dashed border-border bg-muted/30 p-1 w-full overflow-hidden">
                  <SignatureCanvas 
                    ref={sigCanvas} 
                    onBegin={() => setIsEmpty(false)} 
                    penColor={inkColor} 
                    minWidth={thickness} 
                    maxWidth={thickness + 1.5} 
                    canvasProps={{ className: "w-full h-40 sm:h-48 rounded-md cursor-crosshair touch-none bg-white dark:bg-black" }} 
                  />
                </div>
                <p className="mt-3 text-center text-[10px] sm:text-xs text-muted-foreground px-2">Draw inside the box above using your mouse or finger.</p>
              </div>
            )}

            {activeTab === "type" && (
              <div className="animate-in fade-in slide-in-from-right-2 flex flex-col gap-4 w-full">
                <input type="text" placeholder="Type your name here..." value={typedName} onChange={(e) => setTypedName(e.target.value)} className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto p-1 w-full">
                  {SIGNATURE_FONTS.map(font => (
                    <button key={font} onClick={() => setSelectedFont(font)} className={`flex h-16 sm:h-20 items-center justify-center rounded-lg border-2 bg-card p-2 transition-all w-full overflow-hidden ${selectedFont === font ? "border-primary shadow-sm ring-1 ring-primary" : "border-border hover:border-primary/50"}`}>
                      <span style={{ fontFamily: font, color: inkColor, fontWeight: thickness === 3 ? 'bold' : 'normal' }} className="text-xl sm:text-2xl truncate px-2 max-w-full">{typedName || "Your Name"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between mt-2 w-full">
            {activeTab === "draw" ? (
              <Button variant="outline" onClick={clear} className="w-full sm:w-auto hidden sm:flex">
                <Eraser className="mr-2 h-4 w-4" /> Clear
              </Button>
            ) : <div className="hidden sm:block" />}

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto bg-transparent border-input order-1 sm:order-none">Cancel</Button>
              <Button onClick={save} disabled={activeTab === "draw" ? isEmpty : !typedName.trim()} className="w-full sm:w-auto order-2 sm:order-none">
                <Check className="mr-2 h-4 w-4" /> Save Signature
              </Button>
            </div>
            
            {activeTab === "draw" && (
              <Button variant="ghost" onClick={clear} className="w-full sm:hidden text-muted-foreground mt-2 order-3">
                <Eraser className="mr-2 h-4 w-4" /> Clear Canvas
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}