"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, FileSignature, Loader2, KeyRound, ArrowLeft } from "lucide-react"

export function AuthForm() {
  const router = useRouter()
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("sign-in")
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token=") && !hash.includes("type=recovery")) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("access_token");
      
      if (token) {
        localStorage.setItem("token", token);
        router.push("/dashboard");
      }
    }
  }, [router]);

  // Handler for sending the reset link
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")

    try {
      const response = await fetch("https://signflow-backend-0f8n.onrender.com/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset link")
      }

      setResetEmailSent(true)
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")

    try {
      const endpoint = activeTab === "sign-in" ? "/api/auth/login" : "/api/auth/register"
      const payload = activeTab === "sign-in" ? { email, password } : { name, email, password }

      const response = await fetch(`https://signflow-backend-0f8n.onrender.com${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed")
      }

      const validToken = data.token || data.access_token || data.accessToken || data.session?.access_token;

      if (validToken) {
        localStorage.setItem("token", validToken);
        router.push("/dashboard");
      } else if (activeTab === "create-account") {
        setActiveTab("sign-in");
        setErrorMsg("Account created successfully! Please sign in.");
      } else {
        throw new Error("No token received from server");
      }

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

  const handleGoogleLogin = () => {
    const SUPABASE_URL = "https://dcxepnbsivelnmalabpw.supabase.co" 
    const REDIRECT_URL = "http://localhost:3000/" 
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${REDIRECT_URL}`
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-12">
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

        <div className="rounded-2xl border border-border/60 bg-card shadow-xl shadow-primary/5 backdrop-blur-xl overflow-hidden">
          {isForgotPassword ? (
            <div className="p-6 pt-8 animate-in fade-in slide-in-from-right-4">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Reset Password</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
              </div>

              {resetEmailSent ? (
                <div className="rounded-lg bg-green-50 p-4 text-center border border-green-200 mb-6">
                  <p className="text-sm font-medium text-green-800">Check your inbox!</p>
                  <p className="text-xs text-green-600 mt-1">We&apos;ve sent a secure recovery link to {email}</p>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="flex flex-col gap-5 mb-6">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="reset-email" className="text-sm font-medium text-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="h-11 rounded-lg border-border/80 bg-background pl-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20" />
                    </div>
                  </div>
                  <Button type="submit" size="lg" disabled={isLoading || !email} className="mt-1 h-11 w-full rounded-lg bg-primary font-medium text-primary-foreground shadow-md transition-all hover:bg-primary/90">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Reset Link"}
                  </Button>
                </form>
              )}

              <Button variant="ghost" onClick={() => { setIsForgotPassword(false); setResetEmailSent(false); setErrorMsg(""); }} className="w-full text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0">
              <div className="px-6 pt-6">
                <TabsList className="grid h-11 w-full grid-cols-2 rounded-lg bg-muted/80 p-1">
                  <TabsTrigger value="sign-in" className="rounded-md text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="create-account" className="rounded-md text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                    Create Account
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Sign In Form */}
              <TabsContent value="sign-in" className="p-6 pt-5">
                <form onSubmit={handleAuth} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sign-in-email" className="text-sm font-medium text-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="sign-in-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="h-11 rounded-lg border-border/80 bg-background pl-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sign-in-password" className="text-sm font-medium text-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="sign-in-password" type={showSignInPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="h-11 rounded-lg border-border/80 bg-background pl-10 pr-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20" />
                      <button type="button" onClick={() => setShowSignInPassword(!showSignInPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" size="lg" disabled={isLoading} className="mt-1 h-11 w-full rounded-lg bg-primary font-medium text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                    {!isLoading && <ArrowRight className="ml-1 h-4 w-4" />}
                  </Button>
                </form>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground">OR</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Button onClick={handleGoogleLogin} type="button" variant="outline" className="h-11 w-full rounded-lg border-border/80 bg-background font-medium text-foreground shadow-sm hover:bg-muted/50">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Forgot credentials?{" "}
                  <button type="button" onClick={() => setIsForgotPassword(true)} className="font-semibold text-primary hover:text-primary/80 transition-colors hover:underline underline-offset-4">
                    Reset password
                  </button>
                </div>
              </TabsContent>

              {/* Create Account Form */}
              <TabsContent value="create-account" className="p-6 pt-5">
                <form onSubmit={handleAuth} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sign-up-name" className="text-sm font-medium text-foreground">Full Name</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="sign-up-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="h-11 rounded-lg border-border/80 bg-background pl-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sign-up-email" className="text-sm font-medium text-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="sign-up-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="h-11 rounded-lg border-border/80 bg-background pl-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sign-up-password" className="text-sm font-medium text-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="sign-up-password" type={showSignUpPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" className="h-11 rounded-lg border-border/80 bg-background pl-10 pr-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/20" />
                      <button type="button" onClick={() => setShowSignUpPassword(!showSignUpPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                  </div>

                  <Button type="submit" size="lg" disabled={isLoading} className="mt-1 h-11 w-full rounded-lg bg-primary font-medium text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
                    {!isLoading && <ArrowRight className="ml-1 h-4 w-4" />}
                  </Button>
                </form>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground">OR</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Button onClick={handleGoogleLogin} type="button" variant="outline" className="h-11 w-full rounded-lg border-border/80 bg-background font-medium text-foreground shadow-sm hover:bg-muted/50">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          {"By continuing, you agree to our "}
          <a href="#" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">Terms of Service</a>
          {" and "}
          <a href="#" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}