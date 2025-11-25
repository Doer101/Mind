"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../supabase/client";
import { Button } from "@/components/ui/button";

// Password reset page - waits for session after PKCE auth callback

export default function PublicResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      // Initialize client only in browser
      const supabase = createClient();
      
      // Small delay to ensure cookies from auth callback are available
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      if (error || !session) {
        setError("Invalid or missing reset token. Please request a new password reset link.");
      }
      setTokenChecked(true);
    };
    
    checkSession();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess(
      "Password updated successfully! You can now sign in with your new password."
    );
    setPassword("");
    setConfirm("");
  };

  if (!tokenChecked) {
    return (
      <div className="min-h-screen p-8 text-center bg-black text-white">
        Checking token...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-black/70 rounded border border-white/20 shadow-none text-center text-white">
        <h1 className="text-2xl font-bold mb-4 text-white">Reset Password</h1>
        <p className="text-red-400 mb-4">{error}</p>
        <Button
          onClick={() => router.push("/sign-in")}
          className="border border-white text-white hover:bg-white hover:text-black"
        >
          Go to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-black text-white py-20 px-4">
      <div className="w-full max-w-md p-8 bg-black/70 rounded border border-white/20 shadow-none">
        <h1 className="text-2xl font-bold mb-4 text-white">Reset Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium text-white">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-white text-black placeholder-black/60"
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-medium text-white">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-white text-black placeholder-black/60"
              minLength={8}
              required
            />
          </div>
          {success && <p className="text-green-400 text-sm">{success}</p>}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full mt-4 border border-white text-white hover:bg-white hover:text-black"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
