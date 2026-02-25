"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { SigningRoom } from "@/components/signing-room"
import { SignatureModal } from "@/components/signature-modal"
import { Loader2, AlertCircle, Lock } from "lucide-react" 
import { Button } from "@/components/ui/button"

export default function PublicSigningPage() {
  const params = useParams()
  const token = params.token as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 2. Added 'status' to the data we save in state
  const [documentData, setDocumentData] = useState<{ id: string, url: string, fileName: string, status: string } | null>(null)
  
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [savedSignature, setSavedSignature] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    const fetchPublicDocument = async () => {
      try {
        const res = await fetch(`https://signflow-backend-0f8n.onrender.com/api/docs/public/${token}`)
        const data = await res.json()

        if (!res.ok) throw new Error(data.error || "Failed to load document")
        
        setDocumentData({
          id: data.document.id,
          url: data.viewUrl,
          fileName: data.document.file_name,
          status: data.document.status // 3. We now grab the status from your database!
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "This link is invalid or has expired.")
      } finally {
        setIsLoading(false)
      }
    }

    if (token) fetchPublicDocument()
  }, [token])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading secure document...</p>
      </div>
    )
  }

  if (error || !documentData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border max-w-md w-full text-center flex flex-col items-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
        </div>
      </div>
    )
  }

  // This is the screen they see IMMEDIATELY after they finish signing in the current session
  if (isCompleted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="bg-card p-8 rounded-xl shadow-sm border border-border max-w-md w-full text-center">
          <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Document Signed!</h2>
          <p className="text-muted-foreground">You have successfully signed &quot;{documentData.fileName}&quot;. The sender has been notified.</p>
          <p className="text-sm text-muted-foreground mt-8">You may now close this tab.</p>
        </div>
      </div>
    )
  }

  // 4. THE SECURITY LOCK: If the document was already signed BEFORE they opened the link
  if (documentData.status.toLowerCase() === 'signed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="bg-card p-8 rounded-xl shadow-sm border border-border max-w-md w-full text-center">
          <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Document Locked</h2>
          <p className="text-muted-foreground">This document has already been signed and finalized. No further changes can be made.</p>
          <p className="text-sm text-muted-foreground mt-8">You may safely close this tab.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-card p-8 rounded-xl shadow-sm border border-border max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Signature Requested</h1>
        <p className="text-muted-foreground mb-8">You have been asked to sign: <strong className="text-foreground">{documentData.fileName}</strong></p>

        {!savedSignature ? (
          <div className="flex flex-col items-center">
            <Button onClick={() => setIsSignatureModalOpen(true)} size="lg" className="w-full">
              Create My Signature
            </Button>
            <p className="text-xs text-muted-foreground mt-4">By creating a signature, you agree to legally bind yourself to this document.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground mb-4">Your Signature is Ready</p>
            <div className="rounded-lg bg-white border-2 border-dashed border-border p-4 mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={savedSignature} alt="Your signature" className="h-24 object-contain" />
            </div>
            
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={() => setSavedSignature(null)} className="flex-1">
                Redraw
              </Button>
              <Button onClick={() => {}} className="flex-1 bg-primary text-primary-foreground hidden">
                Proceed to Sign
              </Button>
            </div>
          </div>
        )}
      </div>

      <SignatureModal 
        isOpen={isSignatureModalOpen} 
        onClose={() => setIsSignatureModalOpen(false)} 
        onSaveSignature={(sig) => setSavedSignature(sig)} 
      />

      {savedSignature && (
        <SigningRoom 
          documentId={documentData.id} 
          pdfUrl={documentData.url} 
          signatureUrl={savedSignature}
          onCancel={() => setSavedSignature(null)}
          onComplete={() => setIsCompleted(true)}
          publicToken={token} 
        />
      )}
    </div>
  )
}