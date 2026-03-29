import { useState } from "react";
import { GraduationCap, Mail, Lock, User, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type AuthStep = "form" | "verify";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>("form");
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Welcome back!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Verification code sent to your email!");
        setStep("verify");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });
      if (error) throw error;
      toast.success("Email verified! Welcome aboard!");
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      toast.success("New verification code sent!");
    } catch (err) {
      toast.error("Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-accent border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="inline-flex p-3 rounded-xl gradient-gold shadow-gold mb-4">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl text-foreground">ResearchLens</h1>
          <p className="text-muted-foreground mt-1">
            {step === "verify"
              ? "Enter the verification code sent to your email"
              : isLogin
              ? "Sign in to your account"
              : "Create a new account"}
          </p>
        </div>

        {step === "verify" ? (
          <form onSubmit={handleVerifyOtp} className="glass-card rounded-xl p-6 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
            </p>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit code"
                className={inputClass}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full gradient-gold text-primary-foreground font-semibold shadow-gold hover:opacity-90 transition-opacity"
              size="lg"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Create Account"}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="text-primary hover:underline font-medium"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => { setStep("form"); setOtp(""); }}
                className="text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className={inputClass}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className={inputClass}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={inputClass}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-gold text-primary-foreground font-semibold shadow-gold hover:opacity-90 transition-opacity"
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>

            {isLogin && (
              <p className="text-center">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs text-muted-foreground hover:text-primary hover:underline"
                >
                  Forgot your password?
                </button>
              </p>
            )}

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
