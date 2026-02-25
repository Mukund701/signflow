"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Lock, Eye, EyeOff, FileSignature, Loader2, CheckCircle2 } from "lucide-react"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [success, setSuccess] = useState(false)
  
  // This state holds the secure token we grab from the URL
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null)

  useEffect(() => {
    // Grab the hash from the URL (Supabase passes the token here for security)
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("access_token");
      if (token) {
        setRecoveryToken(token);
      } else {
        setErrorMsg("Invalid recovery link. Please request a new password reset.");
      }
    } else {
      setErrorMsg("No recovery token found. Please request a new password reset.");
    }
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recoveryToken) return

    setIsLoading(true)
    setErrorMsg("")

    try {
      const response = await fetch("https://signflow-backend-0f8n.onrender.com/api/auth/update-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${recoveryToken}`
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update password")
      }

      setSuccess(true)
      
      // Automatically redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/")
      }, 3000)

    } catch (error) {
      if (error instanceof Error) {
        setErrorMsg(error.message)
      } else {
        setErrorMsg("An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <FileSignature className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">SignFlow</h1>
            <p className="mt-1 text-sm text-muted-foreground">Secure document signatures, simplified</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-200 text-center">
            {errorMsg}
          </div>
        )}

        <div className="rounded-2xl border border-border/60 bg-card shadow-xl shadow-primary/5 backdrop-blur-xl p-6 pt-8">
          {success ? (
            <div className="text-center py-6 animate-in zoom-in-95">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Password Updated!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your password has been changed successfully. Redirecting you to sign in...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-semibold">Set New Password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please enter a strong new password below.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-password" className="text-sm font-medium text-foreground">New Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="new-password" type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" disabled={!recoveryToken} className="h-11 rounded-lg border-border/80 bg-background pl-10 pr-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                </div>

                <Button type="submit" size="lg" disabled={isLoading || !password || !recoveryToken} className="mt-1 h-11 w-full rounded-lg bg-primary font-medium text-primary-foreground shadow-md transition-all hover:bg-primary/90">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  )
}