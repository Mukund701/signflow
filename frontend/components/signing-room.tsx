"use client"

import { useState, useRef } from "react"
import Draggable from "react-draggable"
import { PDFDocument } from "pdf-lib"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, X, Scaling } from "lucide-react" 

interface SigningRoomProps {
  documentId: string 
  pdfUrl: string
  signatureUrl: string
  onCancel: () => void
  onComplete: () => void
  publicToken?: string 
}

export function SigningRoom({ documentId, pdfUrl, signatureUrl, onCancel, onComplete, publicToken }: SigningRoomProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const boundaryRef = useRef<HTMLDivElement>(null)
  const draggableRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 50, y: 50 })
  const [scale, setScale] = useState(1)

  const handleStampSignature = async () => {
    setIsProcessing(true)
    try {
      if (!boundaryRef.current) return

      const bounds = boundaryRef.current.getBoundingClientRect()
      const percentX = position.x / bounds.width
      const percentY = position.y / bounds.height

      const pdfRes = await fetch(pdfUrl)
      const pdfArrayBuffer = await pdfRes.arrayBuffer()
      
      const sigRes = await fetch(signatureUrl)
      const sigArrayBuffer = await sigRes.arrayBuffer()

      const pdfDoc = await PDFDocument.load(pdfArrayBuffer)
      const pngImage = await pdfDoc.embedPng(sigArrayBuffer)

      const pages = pdfDoc.getPages()
      const firstPage = pages[0]
      const { width: pageWidth, height: pageHeight } = firstPage.getSize()

      const baseSigWidth = 150 
      const finalSigWidth = baseSigWidth * scale
      const finalSigHeight = (pngImage.height / pngImage.width) * finalSigWidth

      const pdfX = percentX * pageWidth
      const pdfY = pageHeight - (percentY * pageHeight) - finalSigHeight

      firstPage.drawImage(pngImage, {
        x: pdfX,
        y: pdfY,
        width: finalSigWidth,
        height: finalSigHeight,
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
      
      const formData = new FormData()
      formData.append("file", blob, "signed-document.pdf")

      let uploadRes;
      
      if (publicToken) {
        uploadRes = await fetch(`http://localhost:5000/api/docs/public/${publicToken}/sign`, {
          method: "PUT",
          body: formData,
        })
      } else {
        const token = localStorage.getItem("token")
        uploadRes = await fetch(`http://localhost:5000/api/docs/${documentId}/sign`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
      }

      if (!uploadRes.ok) throw new Error("Failed to upload signed document")

      onComplete() 
      
    } catch (error) {
      console.error("Failed to stamp PDF", error)
      alert("Failed to process the document. Check console for details.")
    } finally {
      setIsProcessing(false)
    }
  }

  const wrapperWidth = 192 * scale;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex min-h-16 items-center justify-between border-b border-border px-4 sm:px-6 bg-card flex-wrap gap-4 py-3 sm:py-0">
        <h2 className="text-lg font-semibold whitespace-nowrap hidden sm:block">Signing Room</h2>
        
        <div className="flex items-center gap-3 bg-muted/50 px-4 py-1.5 rounded-full border border-border w-full sm:w-auto justify-center">
          <Scaling className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Size</span>
          <input
            type="range"
            min="0.4"
            max="2.5"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-full sm:w-24 cursor-pointer accent-primary"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={isProcessing} className="flex-1 sm:flex-none">
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button onClick={handleStampSignature} disabled={isProcessing} className="bg-primary flex-1 sm:flex-none">
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Sign
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-muted/30 p-4 sm:p-8 flex justify-center items-center">
        <div 
          ref={boundaryRef}
          className="relative h-[75vh] w-full sm:h-[80vh] sm:w-[60vh] max-w-full bg-white shadow-2xl rounded-sm border border-border overflow-hidden flex flex-col"
        >
          <iframe 
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
            className="w-full h-full pointer-events-none" 
            title="PDF Document"
          />

          <div className="absolute inset-0 z-10">
            <Draggable
              nodeRef={draggableRef}
              bounds="parent"
              onStop={(e, data) => setPosition({ x: data.x, y: data.y })}
            >
              <div 
                ref={draggableRef} 
                className="absolute cursor-move rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-1 hover:bg-primary/10 transition-colors"
                style={{ width: `${wrapperWidth}px` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={signatureUrl} 
                  alt="Your Signature" 
                  className="w-full h-auto pointer-events-none drop-shadow-sm"
                />
              </div>
            </Draggable>
          </div>
        </div>
      </div>
      
      <div className="h-12 border-t border-border bg-card flex items-center justify-center text-xs sm:text-sm text-muted-foreground px-4 text-center">
        Drag your signature to the desired location, adjust the size, and click Sign.
      </div>
    </div>
  )
}