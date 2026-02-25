"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2, Clock, Monitor, Globe, FileText, CheckCircle, MailOpen } from "lucide-react"

interface AuditLog {
  id: string
  event_type: string
  ip_address: string
  user_agent: string
  created_at: string
}

interface AuditLogModalProps {
  isOpen: boolean
  documentId: string | null
  onClose: () => void
}

export function AuditLogModal({ isOpen, documentId, onClose }: AuditLogModalProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !documentId) return

    const fetchLogs = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`https://signflow-backend-0f8n.onrender.com/api/docs/${documentId}/logs`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to fetch logs")
        
        setLogs(data.logs || [])
      } catch (err) {
        setError("Failed to load the audit trail. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
  }, [isOpen, documentId])

  // Helper to pick the right icon based on the event
  const getEventIcon = (eventType: string) => {
    if (eventType.includes("Uploaded")) return <FileText className="h-4 w-4 text-blue-500" />
    if (eventType.includes("Opened")) return <MailOpen className="h-4 w-4 text-yellow-500" />
    if (eventType.includes("Signed")) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <Clock className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Legal Audit Trail</DialogTitle>
          <DialogDescription>
            A secure, tamper-proof record of all activity on this document.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Retrieving secure logs...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 p-4 rounded-lg text-sm text-center border border-red-100 dark:border-red-900">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
              No activity recorded for this document yet.
            </div>
          ) : (
            <div className="relative border-l border-muted ml-3 space-y-6 pb-4">
              {logs.map((log) => {
                const date = new Date(log.created_at)
                return (
                  <div key={log.id} className="relative pl-6">
                    {/* The Timeline Dot */}
                    <span className="absolute -left-[13px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border shadow-sm">
                      {getEventIcon(log.event_type)}
                    </span>
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-foreground">{log.event_type}</h4>
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {date.toLocaleDateString()} at {date.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 mt-1 p-3 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Globe className="h-3.5 w-3.5" />
                          <span>IP: <strong className="text-foreground">{log.ip_address}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground truncate" title={log.user_agent}>
                          <Monitor className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate max-w-[200px] sm:max-w-[250px]">{log.user_agent}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}