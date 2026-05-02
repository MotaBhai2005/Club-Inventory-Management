"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Boxes, Eye, EyeOff, Moon, Sun, AlertCircle, X } from "lucide-react";
import * as api from "@/services/api";
import { useTheme } from "@/components/ThemeProvider";

function getOAuthErrorMessage(errorCode: string | null) {
  switch (errorCode) {
    case "oauth_unreachable":
      return "Single Sign-On is temporarily unavailable. Backend API could not be reached.";
    case "oauth_backend":
      return "Single Sign-On failed due to a backend validation error.";
    case "oauth_missing_email":
      return "Your OAuth provider did not return an email address.";
    case "oauth_session_missing":
      return "Single Sign-On completed, but app access could not be initialized. Please sign in again.";
    default:
      return "";
  }
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isToastExiting, setIsToastExiting] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";

  // Auto-dismiss toast after 5s
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        handleCloseToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleCloseToast = () => {
    setIsToastExiting(true);
    setTimeout(() => {
      setError("");
      setIsToastExiting(false);
    }, 300);
  };

  useEffect(() => {
    const errorCode = searchParams.get("error");
    setError(getOAuthErrorMessage(errorCode));

    // Remove stale OAuth error params so they don't reappear on every page load.
    if (errorCode) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("error");
      const nextQuery = params.toString();
      router.replace(nextQuery ? `/?${nextQuery}` : "/");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (status === "authenticated" && session) {
      const accessToken = (session as any).accessToken;
      const role = (session as any).role || "MEMBER";
      if (accessToken) {
        localStorage.setItem("token", accessToken);
        localStorage.setItem("role", role);
        if (role === "ADMIN") {
          router.push("/admin");
        } else if (role === "INVENTORY_MANAGER") {
          router.push("/manager");
        } else {
          router.push("/member");
        }
      } else {
        const oauthError = (session as any).oauthError as string | undefined;
        setError(getOAuthErrorMessage(oauthError || "oauth_session_missing"));
      }
    }
  }, [session, status, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.login({ username, password });
      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.role);

      if (res.role === "ADMIN") {
        router.push("/admin");
      } else if (res.role === "INVENTORY_MANAGER") {
        router.push("/manager");
      } else {
        router.push("/member");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <main className="signin-layout">
      {/* ─── Left side: Artistic panel ─── */}
      <section className="signin-art-panel">
        {/* Neon blobs */}
        <div className="neon-blur neon-blur--pink" />
        <div className="neon-blur neon-blur--blue" />
        <div className="neon-blur neon-blur--magenta" />

        <div className="signin-art-content">
          <h1 className="signin-art-heading">
            Manage&nbsp;Everything,<br />Effortlessly
          </h1>
          <p className="signin-art-quote">
            &ldquo;The first rule of any technology used in a business is that
            automation applied to an efficient operation will magnify the
            efficiency.&rdquo;
          </p>
          <div className="signin-art-tag">
            <span>Inventory Suite</span>
          </div>
        </div>

        {/* Grain texture overlay */}
        <div className="signin-art-grain" />
      </section>

      {/* ─── Right side: Sign-in form ─── */}
      <section className="signin-form-panel">
        
        {/* Theme Toggle Placeholder */}
        <button 
          onClick={toggleTheme}
          style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'color-mix(in srgb, var(--foreground) 50%, transparent)' }}
          className="hover:scale-[1.05] transition-all"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="signin-form-wrapper">
          {/* Header */}
          <div className="animate-slide-up" style={{ marginBottom: "2.5rem" }}>
            <div style={{ display: "inline-flex", padding: "0.75rem", backgroundColor: "color-mix(in srgb, var(--foreground) 5%, transparent)", borderRadius: "1rem", marginTop: "1rem", marginBottom: "1.5rem" }}>
              <Boxes size={32} style={{ color: "var(--foreground)" }} />
            </div>
            <h2 className="signin-heading">Welcome Back</h2>
            <p className="signin-subtitle">
              Enter your credentials to access the Inventory Dashboard
            </p>
          </div>

          {/* Animated Toast Error */}
          {error && (
            <div className={`toast-container ${isToastExiting ? 'toast-exit' : 'toast-enter'}`}>
              <AlertCircle size={20} color="#dc2626" />
              <span style={{ flex: 1 }}>{error}</span>
              <button 
                onClick={handleCloseToast} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'color-mix(in srgb, var(--background) 50%, transparent)', display: 'flex', alignItems: 'center' }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Credential form */}
          <form onSubmit={handleLogin} className="signin-form">
            <div className="signin-field-group animate-slide-up delay-100">
              <input
                required
                id="signin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="signin-input signin-input-peer"
                placeholder=" "
                autoComplete="username"
              />
              <label htmlFor="signin-username" className="signin-floating-label">
                Username or email
              </label>
            </div>

            <div className="signin-field-group animate-slide-up delay-200">
              <div className="signin-input-wrapper">
                <input
                  required
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="signin-input signin-input-peer"
                  placeholder=" "
                  autoComplete="current-password"
                />
                <label htmlFor="signin-password" className="signin-floating-label">
                  Password
                </label>
                <button
                  type="button"
                  tabIndex={-1}
                  className="signin-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="animate-slide-up delay-300" style={{ paddingTop: "0.5rem" }}>
              <button type="submit" className="signin-submit" disabled={isLoading}>
                {isLoading ? <div className="signin-spinner" /> : "Sign In"}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="signin-divider animate-slide-up delay-400" style={{ margin: "1.5rem 0" }}>
            <span>OR</span>
          </div>

          {/* OAuth buttons */}
          <div className="signin-oauth-group animate-slide-up delay-400">
            <button
              type="button"
              onClick={() => signIn("google")}
              className="signin-oauth-btn hover:scale-[1.02]"
            >
              <svg viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign In with Google
            </button>

            <button
              type="button"
              onClick={() => signIn("github")}
              className="signin-oauth-btn signin-oauth-btn--github hover:scale-[1.02]"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              Sign In with GitHub
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="signin-footer">
        <div className="signin-footer-left">
          <p>© 2026 Robotics &amp; Software Club. All rights reserved.</p>
        </div>
        <div className="signin-footer-links">
          <button type="button" onClick={() => setActiveModal('privacy')} className="hover:text-[color:var(--foreground)] transition-colors" style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "color-mix(in srgb, var(--foreground) 60%, transparent)" }}>Privacy</button>
          <button type="button" onClick={() => setActiveModal('terms')} className="hover:text-[color:var(--foreground)] transition-colors" style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "color-mix(in srgb, var(--foreground) 60%, transparent)" }}>Terms</button>
          <a href="#" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "color-mix(in srgb, var(--foreground) 60%, transparent)", textDecoration: "none" }}>Contact</a>
        </div>
      </footer>

      {/* Privacy & Terms Modal Overlay */}
      {activeModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", padding: "2rem" }}>
          <div className="animate-slide-up" style={{ width: "100%", maxWidth: "600px", maxHeight: "80vh", backgroundColor: "var(--background)", color: "var(--foreground)", borderRadius: "1rem", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid color-mix(in srgb, var(--foreground) 10%, transparent)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: "'Noto Serif', Georgia, serif", fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
                {activeModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <button onClick={() => setActiveModal(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--foreground)" }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: "1.5rem", overflowY: "auto", fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", lineHeight: 1.6, color: "color-mix(in srgb, var(--foreground) 80%, transparent)" }}>
              {activeModal === 'privacy' ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <p><strong>1. Data Collection:</strong> Robotics & Software Club collects minimal data necessary to facilitate the Inventory Management System, primarily your authentication markers (email, username) and component check-out histories.</p>
                  <p><strong>2. Single Sign-On (SSO):</strong> When linking authentication providers like Google or GitHub, we only retrieve your primary public profile details for authorization mapping. No sensitive repository or drive data is requested.</p>
                  <p><strong>3. Token Security:</strong> Live session tokens are persistently stored via local web storage and explicitly govern API endpoint handshakes. We do not track cross-site tracking markers.</p>
                  <p><strong>4. Internal Sharing:</strong> Aggregated checkout metrics may be viewed by Inventory Managers and Admins to regulate supply limits. Your personal liability data is restricted to core admin personnel only.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <p><strong>1. Fair Use:</strong> You agree to check out hardware and inventory strictly for club, academic, or sanctioned hackathon pursuits. Commercial misuse of Robotics & Software Club property is strictly forbidden.</p>
                  <p><strong>2. Liability & Returns:</strong> Members assume full responsibility for the condition of checked-out assets. Items must be returned by their specified deadline to avoid dashboard delinquency locks.</p>
                  <p><strong>3. System Abuse:</strong> Reverse-engineering the Inventory Dashboard APIs, exploiting SSO vulnerabilities, or attempting privilege escalation into Admin/Manager routes will result in immediate club termination.</p>
                  <p><strong>4. Service Availability:</strong> While we guarantee 99% uptime during operational semesters, the Inventory System may be temporarily locked down during HackFest deployment phases or maintenance windows.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
