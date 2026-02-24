"use client"

import { useState } from "react"
import { PenLine, Send } from "lucide-react"
import { SignatureModal } from "./signature-modal"
import { RequestSignatureModal } from "./request-signature-modal" 

interface ActionTogglesProps {
  savedSignature: string | null;
  setSavedSignature: (sig: string | null) => void;
}

export function ActionToggles({ savedSignature, setSavedSignature }: ActionTogglesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

  const handleSaveSignature = (signatureDataUrl: string) => {
    setSavedSignature(signatureDataUrl)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full">
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex w-full items-center gap-3 rounded-xl px-4 sm:px-6 py-4 text-left transition-all duration-200 border border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground">
            <PenLine className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Sign it Myself</p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">Add your own signature to the document</p>
          </div>
        </button>

        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="group flex w-full items-center gap-3 rounded-xl px-4 sm:px-6 py-4 text-left transition-all duration-200 border border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground">
            <Send className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Request Signatures</p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">Send to others for signing</p>
          </div>
        </button>
      </div>

      {savedSignature && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-border bg-card p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 w-full overflow-hidden">
          <p className="text-sm font-medium text-muted-foreground mb-4">Your Active Signature</p>
          <div className="rounded-lg bg-white border-2 border-dashed border-border p-2 max-w-full overflow-hidden">
            <img src={savedSignature} alt="Your saved signature" className="h-20 sm:h-24 w-auto object-contain" />
          </div>
          <button onClick={() => setSavedSignature(null)} className="mt-4 text-xs text-red-500 hover:text-red-600 hover:underline transition-colors">
            Remove Signature
          </button>
        </div>
      )}

      <SignatureModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaveSignature={handleSaveSignature} />
      <RequestSignatureModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} />
    </>
  )
}