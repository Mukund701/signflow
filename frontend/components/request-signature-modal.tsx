"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Send, Loader2, FileText, Mail, CheckCircle2, AlertCircle } from "lucide-react"

interface RequestSignatureModalProps {
  isOpen: boolean
  onClose: () => void
}

interface DocumentItem {
  id: string
  file_name: string
  status: string 
}

export function RequestSignatureModal({ isOpen, onClose }: RequestSignatureModalProps) {
  const [email, setEmail] = useState("")
  const [selectedDocId, setSelectedDocId] = useState("")
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  // State to manage our custom toast notification
  const [toast, setToast] = useState<{ message: string, type: "success" | "error" } | null>(null)

  useEffect(() => {
    if (!isOpen) return
    
    const fetchDocs = async () => {
      setIsLoadingDocs(true)
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("https://signflow-backend-0f8n.onrender.com/api/docs/", {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.documents) {
          const pendingDocs = data.documents.filter((doc: DocumentItem) => doc.status.toLowerCase() !== "signed")
          setDocuments(pendingDocs)
          if (pendingDocs.length > 0) setSelectedDocId(pendingDocs[0].id)
        }
      } catch (error) {
        console.error("Failed to fetch documents", error)
      } finally {
        setIsLoadingDocs(false)
      }
    }
    
    fetchDocs()
  }, [isOpen])

  const handleSendRequest = async () => {
    if (!email || !selectedDocId) return
    
    setIsSending(true)
    
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`https://signflow-backend-0f8n.onrender.com/api/docs/${selectedDocId}/request`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to send email")

      setToast({ message: `Success! The request has been sent to ${email}.`, type: "success" })
      
      onClose()
      setEmail("") 
      
      // Auto-hide the toast after 3.5 seconds
      setTimeout(() => {
        setToast(null)
      }, 3500)

    } catch (error) {
      console.error(error)

      setToast({ message: "Failed to send the request. Please check the backend console.", type: "error" })
      
      setTimeout(() => {
        setToast(null)
      }, 3500)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      {/* Custom Animated Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl border animate-in fade-in slide-in-from-top-4 duration-300 bg-foreground text-background">
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle>Request a Signature</DialogTitle>
            <DialogDescription>
              Send a secure link to someone else so they can legally sign your document.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-5 py-4">
            
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" /> Recipient Email
              </label>
              <input 
                type="email" 
                placeholder="client@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Document Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" /> Select Document
              </label>
              
              {isLoadingDocs ? (
                <div className="h-10 flex items-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading your vault...
                </div>
              ) : documents.length === 0 ? (
                <div className="h-10 flex items-center text-sm text-red-500 font-medium bg-red-50 px-3 rounded-md border border-red-100 dark:bg-red-950/50 dark:border-red-900">
                  You have no pending documents to send.
                </div>
              ) : (
                <select 
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                >
                  {documents.map(doc => (
                    <option key={doc.id} value={doc.id} className="text-foreground bg-background">
                      {doc.file_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-2">
            <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
            <Button 
              onClick={handleSendRequest} 
              disabled={!email || !selectedDocId || isSending} 
              className="w-full sm:w-auto bg-primary text-primary-foreground"
            >
              {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}