import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { LogIn, Eye, EyeOff, Zap } from "lucide-react";
import { useAuth } from "../store";
import { MOCK_USERS } from "../mock-data";

export function AuthLogin() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setTimeout(() => {
            const ok = login(email, password);
            if (ok) navigate("/");
            else setError("Invalid email or password. Try a demo account below.");
            setLoading(false);
        }, 800);
    };

    return (
        <div style={{ minHeight: "100vh", background: "var(--color-bg-base)" }} className="flex items-center justify-center px-6">
            <div className="w-full max-w-[420px]">
                {/* Logo */}
                <div className="flex items-center gap-2 justify-center mb-8">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}>
                        <Zap size={20} color="#fff8f4" strokeWidth={2.5} />
                    </div>
                    <span className="text-2xl font-bold" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>
                        Plan<span style={{ color: "#f97316" }}>zo</span>
                    </span>
                </div>

                <div className="p-8 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.2)" }}>
                    <h1 className="text-xl font-bold mb-1" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>Welcome back</h1>
                    <p className="text-sm mb-6" style={{ color: "#78716c" }}>Sign in to your Planzo account</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Email Address</label>
                            <input type="email" placeholder="alex@planzo.io" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Password</label>
                            <div className="relative">
                                <input type={show ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShow(!show)} style={{ color: "#78716c" }}>
                                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(248,113,113,0.1)", color: "#dc2626", border: "1px solid rgba(248,113,113,0.2)" }}>{error}</p>}

                        <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff8f4" }}>
                            {loading ? <div className="w-4 h-4 border-2 border-[#fff8f4] border-t-transparent rounded-full animate-spin" /> : <><LogIn size={14} /> Sign In</>}
                        </button>
                    </form>

                    {/* Demo Accounts */}
                    <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(249,115,22,0.04)", border: "1px solid rgba(74,222,128,0.1)" }}>
                        <p className="text-xs font-medium mb-2" style={{ color: "#f97316" }}>Demo Accounts (any password)</p>
                        <div className="space-y-1">
                            {MOCK_USERS.map((u) => (
                                <button key={u.id} onClick={() => setEmail(u.email)} className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all hover:bg-[rgba(249,115,22,0.08)]" style={{ color: "#92400e" }}>
                                    <span>{u.email}</span>
                                    <span className="px-2 py-0.5 rounded capitalize text-xs" style={{ background: "rgba(74,222,128,0.1)", color: "#f97316" }}>{u.role}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <p className="text-center text-sm mt-5" style={{ color: "#78716c" }}>
                        Don't have an account?{" "}
                        <Link to="/register" style={{ color: "#f97316", textDecoration: "none" }}>Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
