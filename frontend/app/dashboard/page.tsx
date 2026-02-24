"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { io } from "socket.io-client"
import { DashboardHeader } from "@/components/dashboard-header"
import { UploadZone } from "@/components/upload-zone"
import { ActionToggles } from "@/components/action-toggles"
import { RecentDocuments } from "@/components/recent-documents"
import { SigningRoom } from "@/components/signing-room" 
import { DashboardStats } from "@/components/dashboard-stats"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function Page() {
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const [isAuthorized, setIsAuthorized] = useState(false)

  const [savedSignature, setSavedSignature] = useState<string | null>(null)
  const [activeDocument, setActiveDocument] = useState<{ id: string, url: string } | null>(null)

  // ROUTE PROTECTOR
  useEffect(() => {
    const verifyAccess = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/")
      } else {
        setIsAuthorized(true)
      }
    }
    verifyAccess()
  }, [router])

  // NEW: REAL-TIME WEBSOCKET CONNECTION
  useEffect(() => {
    // Only connect if the user is authorized and logged in
    if (!isAuthorized) return

    // Connect to your backend
    const socket = io("http://localhost:5000")

    socket.on("connect", () => {
      console.log("🟢 Connected to Real-Time WebSockets!")
    })

    // Listen for our custom broadcast event
    socket.on("documentUpdated", () => {
      console.log("⚡ Document was signed! Auto-refreshing dashboard...")
      // This magically forces all components using 'refreshKey' to fetch fresh data instantly!
      setRefreshKey((prev) => prev + 1)
    })

    // Cleanup the connection if the user leaves the page
    return () => {
      socket.disconnect()
    }
  }, [isAuthorized])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/")
  }

  if (!isAuthorized) {
    return null 
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex w-full justify-end p-4 px-6">
        <Button 
          variant="ghost" 
          onClick={handleLogout} 
          className="text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </Button>
      </div>

      <main className="mx-auto max-w-3xl px-4 pb-8 sm:px-6 sm:pb-12">
        <DashboardHeader />

        <div className="mt-6 flex flex-col gap-8">
          
          <section>
            <DashboardStats refreshKey={refreshKey} />
          </section>

          <section>
            <UploadZone onUploadSuccess={() => setRefreshKey((prev) => prev + 1)} />
          </section>

          <section>
            <ActionToggles 
              savedSignature={savedSignature} 
              setSavedSignature={setSavedSignature} 
            />
          </section>

          <section>
            <RecentDocuments 
              refreshKey={refreshKey} 
              onSignDocument={(id, url) => setActiveDocument({ id, url })}
            />
          </section>
        </div>
      </main>

      {activeDocument && savedSignature && (
        <SigningRoom 
          documentId={activeDocument.id}
          pdfUrl={activeDocument.url} 
          signatureUrl={savedSignature}
          onCancel={() => setActiveDocument(null)}
          onComplete={() => {
            setActiveDocument(null)
            setRefreshKey(prev => prev + 1)
          }}
        />
      )}

      {activeDocument && !savedSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
           <div className="bg-card p-6 rounded-xl shadow-lg text-center max-w-sm border border-border">
             <h3 className="text-lg font-bold mb-2">No Signature Found</h3>
             <p className="text-muted-foreground mb-6 text-sm">Please create and save a signature using the &quot;Sign it Myself&quot; button first!</p>
             <Button className="w-full" onClick={() => setActiveDocument(null)}>Got it</Button>
           </div>
        </div>
      )}
    </div>
  )
}