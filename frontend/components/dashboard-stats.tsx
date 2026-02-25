"use client"

import { useEffect, useState } from "react"
import { FileText, Clock, CheckCircle } from "lucide-react"

interface DashboardStatsProps {
  refreshKey: number
}

export function DashboardStats({ refreshKey }: DashboardStatsProps) {
  const [stats, setStats] = useState({ total: 0, pending: 0, signed: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("https://signflow-backend-0f8n.onrender.com/api/docs/", { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (data.documents) {
          const total = data.documents.length
          const pending = data.documents.filter((d: { status: string }) => d.status.toLowerCase() !== 'signed').length
          const signed = data.documents.filter((d: { status: string }) => d.status.toLowerCase() === 'signed').length
          setStats({ total, pending, signed })
        }
      } catch (error) {
        console.error("Failed to fetch stats", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [refreshKey])

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 sm:h-20 animate-pulse bg-muted/50 rounded-lg border border-border"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <div className="bg-card p-3 sm:p-4 rounded-lg border border-border shadow-sm flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-2 sm:gap-3 transition-all hover:shadow-md">
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Total</p>
          <p className="text-lg sm:text-xl font-bold text-foreground leading-none">{stats.total}</p>
        </div>
      </div>

      <div className="bg-card p-3 sm:p-4 rounded-lg border border-border shadow-sm flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-2 sm:gap-3 transition-all hover:shadow-md">
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Pending</p>
          <p className="text-lg sm:text-xl font-bold text-foreground leading-none">{stats.pending}</p>
        </div>
      </div>

      <div className="bg-card p-3 sm:p-4 rounded-lg border border-border shadow-sm flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-2 sm:gap-3 transition-all hover:shadow-md">
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Signed</p>
          <p className="text-lg sm:text-xl font-bold text-foreground leading-none">{stats.signed}</p>
        </div>
      </div>
    </div>
  )
}