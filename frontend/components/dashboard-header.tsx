"use client"

import { FileSignature } from "lucide-react"
import { useEffect, useState } from "react"

export function DashboardHeader() {
  const [initial, setInitial] = useState<string>("U")

  useEffect(() => {
    // Wrapping the logic in a timeout defers it to the next tick,
    const timer = setTimeout(() => {
      try {
        const token = localStorage.getItem("token")
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]))
          if (payload.email) {
            setInitial(payload.email.charAt(0).toUpperCase())
          }
        }
      } catch (error) {
        console.error("Could not parse user token")
      }
    }, 0)

    // Cleanup function
    return () => clearTimeout(timer)
  }, [])

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <FileSignature className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">
          SignFlow
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-semibold text-primary">{initial}</span>
        </div>
      </div>
    </header>
  )
}