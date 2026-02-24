"use client"

import { useEffect, useState } from "react"
import { FileText, ExternalLink, Trash2, PenTool, History } from "lucide-react" 
import { AuditLogModal } from "./audit-log-modal" 

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DocumentItem {
  id: string;
  file_name: string;
  created_at: string;
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500" },
  signed: { label: "Signed", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500" },
  draft: { label: "Draft", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400" },
}

export function RecentDocuments({ refreshKey, onSignDocument }: { refreshKey: number; onSignDocument?: (id: string, url: string) => void; }) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [auditLogDocId, setAuditLogDocId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/docs/", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.documents) setDocuments(data.documents);
      } catch (error) {
        console.error("Failed to fetch documents", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, [refreshKey]);

  const handleViewDocument = async (id: string) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) newWindow.document.write('<p style="font-family:sans-serif;">Loading Secure Document...</p>');
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/docs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 404) {
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
        if (newWindow) newWindow.close();
        alert("This document was missing from the server and has been auto-removed.");
        return;
      }
      const data = await res.json();
      if (res.ok && data.viewUrl && newWindow) {
        newWindow.location.href = data.viewUrl;
      } else throw new Error(data.error || "Failed to get view URL");
    } catch (error) {
      if (newWindow) newWindow.close();
      alert("Could not open document. It might have been moved or deleted.");
    }
  }

  const handleSignClick = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/docs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 404) {
        setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== id));
        alert("This document was missing from the server and has been auto-removed.");
        return;
      }
      const data = await res.json();
      if (res.ok && data.viewUrl && onSignDocument) {
        onSignDocument(id, data.viewUrl);
      } else throw new Error(data.error || "Failed to get view URL");
    } catch (error) {
      alert("Could not load document for signing.");
    }
  }

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setDocumentToDelete(id); 
  }

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    const idToDelete = documentToDelete;
    setDocumentToDelete(null); 
    const previousDocs = [...documents];
    setDocuments(documents.filter(doc => doc.id !== idToDelete));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/docs/${idToDelete}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 404) return; 
      if (!res.ok) throw new Error("Delete failed");
    } catch (error) {
      alert("Failed to delete document from server.");
      setDocuments(previousDocs); 
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Recent Documents</h3>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="hidden sm:grid sm:grid-cols-[1fr_140px_100px_160px] gap-4 px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground border-b border-border">
          <span>Document</span>
          <span>Date</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="divide-y divide-border">
          {isLoading ? (
             <div className="p-8 text-center text-sm text-muted-foreground">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No documents uploaded yet.</div>
          ) : (
            documents.map((doc) => {
              const statusKey = doc.status.toLowerCase();
              const status = statusConfig[statusKey] || statusConfig.pending;
              const formattedDate = new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

              return (
                <div key={doc.id} className="group flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-accent/50 sm:grid sm:grid-cols-[1fr_140px_100px_160px] sm:items-center sm:gap-4">
                  <div className="flex items-center gap-3 cursor-pointer hover:underline min-w-0" onClick={() => handleViewDocument(doc.id)}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                    </div>
                    <span className="text-sm font-medium text-foreground truncate block">{doc.file_name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground pl-12 sm:pl-0 shrink-0">{formattedDate}</span>
                  <div className="pl-12 sm:pl-0 shrink-0">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>{status.label}</span>
                  </div>
                  
                  <div className="flex items-center justify-start sm:justify-end gap-2 pl-12 sm:pl-0 pt-2 sm:pt-0 mt-2 sm:mt-0 border-t sm:border-0 border-border sm:border-transparent">
                    <button onClick={(e) => handleSignClick(doc.id, e)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary" title="Sign Document">
                      <PenTool className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleViewDocument(doc.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title="Open Document">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setAuditLogDocId(doc.id); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30" title="View Audit Trail">
                      <History className="h-4 w-4" />
                    </button>
                    <button onClick={(e) => handleDeleteClick(doc.id, e)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600" title="Delete Document">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <AlertDialog open={documentToDelete !== null} onOpenChange={(isOpen: boolean) => !isOpen && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete your document from our servers.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600">Delete Document</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AuditLogModal isOpen={auditLogDocId !== null} documentId={auditLogDocId} onClose={() => setAuditLogDocId(null)} />
    </section>
  )
}