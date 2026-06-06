"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Utensils, Sparkles, ChefHat, LogIn, Lock } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("demo@cooking.com");

  const handleGoogleLogin = async () => {
    setLoading("google");
    await signIn("google", { callbackUrl: "/" });
  };

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("demo");
    await signIn("credentials", {
      email,
      password: "demo-password",
      callbackUrl: "/",
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-hidden relative">
      {/* Decorative gradient glowing orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-60 h-60 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-2xl glass-panel relative z-10 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 animate-pulse">
            <ChefHat className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="gradient-text">AI Cooking To-Do</span>
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Personalized meal plans, grocery checklists, and budget analytics powered by AI.
          </p>
        </div>

        {/* OAuth Sign In */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading !== null}
          className="w-full h-12 rounded-xl bg-white text-slate-900 font-semibold flex items-center justify-center gap-3 transition-all hover:bg-slate-100 disabled:opacity-50 cursor-pointer shadow-lg hover:scale-[1.01]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-1.14 2.77-2.4 3.61v3h3.84c2.24-2.07 3.53-5.11 3.53-8.68Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.84-3c-1.07.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01H1.31v3.1c1.97 3.92 6.02 6.55 10.69 6.55Z"
            />
            <path
              fill="#FBBC05"
              d="M5.24 14.24a7.14 7.14 0 0 1 0-4.48V6.66H1.31a11.96 11.96 0 0 0 0 10.68l3.93-3.1Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.28 2.63 1.31 6.55L5.24 9.66c.95-2.88 3.61-4.91 6.76-4.91Z"
            />
          </svg>
          {loading === "google" ? "Connecting..." : "Continue with Google"}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-950 px-3 text-slate-500">Or use demo mode</span>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleDemoLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@cooking.com"
                className="w-full h-11 px-4 bg-slate-900/50 border border-slate-800 rounded-xl focus:border-emerald-500 focus:outline-none text-slate-100 text-sm"
              />
              <Lock className="absolute right-4 top-3.5 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading !== null}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer hover:shadow-emerald-500/10 shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            {loading === "demo" ? "Logging in..." : "Developer Demo Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          <p>NextAuth.js Secure Session Storage. Protected by CSRF tokens.</p>
        </div>
      </div>
    </div>
  );
}
