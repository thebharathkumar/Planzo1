import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { UserPlus, Eye, EyeOff, Zap, Check, X, Mail, Lock, User, ChevronRight } from "lucide-react";
import { useAuth } from "../store";
import type { Role } from "../mock-data";

const ROLES: { value: Role; label: string; desc: string; icon: string; color: string }[] = [
    { value: "attendee", label: "Attendee", desc: "Browse & book events", icon: "🎫", color: "#f97316" },
    { value: "organizer", label: "Organizer", desc: "Create & manage events", icon: "🎤", color: "#2563eb" },
    { value: "finance", label: "Finance", desc: "Revenue & payouts", icon: "💰", color: "#d97706" },
    { value: "marketing", label: "Marketing", desc: "Campaigns & promotions", icon: "📣", color: "#7c3aed" },
];

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (pw.length >= 12) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "#ef4444" };
    if (score === 2) return { score: 2, label: "Fair", color: "#f97316" };
    if (score === 3) return { score: 3, label: "Good", color: "#d97706" };
    if (score === 4) return { score: 4, label: "Strong", color: "#16a34a" };
    return { score: 5, label: "Very Strong", color: "#059669" };
}

export function AuthRegister() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<Role>("attendee");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const strength = useMemo(() => getPasswordStrength(password), [password]);
    const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
    const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

    const canProceedStep1 = role !== undefined;
    const canSubmit = name.trim().length > 0 && email.includes("@") && password.length >= 8 && passwordsMatch && agreed;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setLoading(true);
        setError("");
        setTimeout(() => {
            const result = register(name.trim(), email.trim(), password, role);
            if (result.success) {
                navigate("/");
            } else {
                setError(result.error || "Registration failed. Please try again.");
                setLoading(false);
            }
        }, 1200);
    };

    return (
        <div
            style={{ minHeight: "100vh", background: "var(--color-bg-base)" }}
            className="flex items-center justify-center px-6 py-12"
        >
            <div className="w-full max-w-[500px]">
                {/* Logo */}
                <div className="flex items-center gap-2 justify-center mb-6 anim-slide-down">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}
                    >
                        <Zap size={20} color="#fff8f4" strokeWidth={2.5} />
                    </div>
                    <span
                        className="text-2xl font-bold"
                        style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}
                    >
                        Plan<span style={{ color: "#f97316" }}>zo</span>
                    </span>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2 mb-6 anim-fade-in">
                    <div
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                        style={{
                            background: step >= 1 ? "rgba(249,115,22,0.12)" : "var(--color-bg-raised)",
                            color: step >= 1 ? "#f97316" : "#78716c",
                            border: `1px solid ${step >= 1 ? "rgba(249,115,22,0.3)" : "rgba(249,115,22,0.1)"}`,
                        }}
                    >
                        {step > 1 ? <Check size={10} /> : <span>1</span>}
                        <span>Role</span>
                    </div>
                    <div
                        className="w-6 h-[1px]"
                        style={{ background: step >= 2 ? "#f97316" : "rgba(249,115,22,0.2)" }}
                    />
                    <div
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                        style={{
                            background: step >= 2 ? "rgba(249,115,22,0.12)" : "var(--color-bg-raised)",
                            color: step >= 2 ? "#f97316" : "#78716c",
                            border: `1px solid ${step >= 2 ? "rgba(249,115,22,0.3)" : "rgba(249,115,22,0.1)"}`,
                        }}
                    >
                        <span>2</span>
                        <span>Details</span>
                    </div>
                </div>

                <div
                    className="p-8 rounded-2xl anim-scale-in"
                    style={{
                        background: "var(--color-bg-card)",
                        border: "1px solid rgba(249,115,22,0.2)",
                        boxShadow: "0 8px 32px rgba(249,115,22,0.08)",
                    }}
                >
                    <h1
                        className="text-xl font-bold mb-1"
                        style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}
                    >
                        {step === 1 ? "Join Planzo" : "Create your account"}
                    </h1>
                    <p className="text-sm mb-6" style={{ color: "#78716c" }}>
                        {step === 1
                            ? "Choose your role to get started"
                            : "Fill in your details — takes 30 seconds"}
                    </p>

                    {/* ─── Step 1: Role Selection ─── */}
                    {step === 1 && (
                        <div className="anim-fade-up">
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {ROLES.map((r) => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => setRole(r.value)}
                                        className="relative p-4 rounded-xl text-left transition-all duration-200 group"
                                        style={{
                                            background:
                                                role === r.value
                                                    ? `${r.color}12`
                                                    : "var(--color-bg-raised)",
                                            border: `1.5px solid ${role === r.value
                                                    ? r.color
                                                    : "rgba(249,115,22,0.1)"
                                                }`,
                                            transform: role === r.value ? "scale(1.02)" : "scale(1)",
                                        }}
                                    >
                                        {role === r.value && (
                                            <div
                                                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                                                style={{ background: r.color }}
                                            >
                                                <Check size={11} color="#fff" strokeWidth={3} />
                                            </div>
                                        )}
                                        <span className="text-lg mb-1 block">{r.icon}</span>
                                        <p
                                            className="text-sm font-bold mb-0.5"
                                            style={{
                                                color:
                                                    role === r.value ? r.color : "#1a0a00",
                                            }}
                                        >
                                            {r.label}
                                        </p>
                                        <p className="text-xs" style={{ color: "#78716c" }}>
                                            {r.desc}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                disabled={!canProceedStep1}
                                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
                                style={{
                                    background: "linear-gradient(135deg,#f97316,#ef4444)",
                                    color: "#fff8f4",
                                    opacity: canProceedStep1 ? 1 : 0.5,
                                }}
                            >
                                Continue <ChevronRight size={14} />
                            </button>
                        </div>
                    )}

                    {/* ─── Step 2: Account Details ─── */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-4 anim-fade-up">
                            {/* Name */}
                            <div>
                                <label
                                    className="flex items-center gap-1.5 text-xs font-medium mb-1.5"
                                    style={{ color: "#92400e" }}
                                >
                                    <User size={12} /> Full Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Alex Rivera"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[#f97316]/30"
                                    style={{
                                        background: "var(--color-bg-raised)",
                                        border: "1px solid rgba(249,115,22,0.2)",
                                        color: "#1a0a00",
                                    }}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label
                                    className="flex items-center gap-1.5 text-xs font-medium mb-1.5"
                                    style={{ color: "#92400e" }}
                                >
                                    <Mail size={12} /> Email Address
                                </label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[#f97316]/30"
                                    style={{
                                        background: "var(--color-bg-raised)",
                                        border: "1px solid rgba(249,115,22,0.2)",
                                        color: "#1a0a00",
                                    }}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label
                                    className="flex items-center gap-1.5 text-xs font-medium mb-1.5"
                                    style={{ color: "#92400e" }}
                                >
                                    <Lock size={12} /> Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPw ? "text" : "password"}
                                        placeholder="Min. 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10 transition-all focus:ring-2 focus:ring-[#f97316]/30"
                                        style={{
                                            background: "var(--color-bg-raised)",
                                            border: "1px solid rgba(249,115,22,0.2)",
                                            color: "#1a0a00",
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                        onClick={() => setShowPw(!showPw)}
                                        style={{ color: "#78716c" }}
                                    >
                                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {/* Strength bar */}
                                {password.length > 0 && (
                                    <div className="mt-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <div
                                                    key={n}
                                                    className="h-1 flex-1 rounded-full transition-all duration-300"
                                                    style={{
                                                        background:
                                                            n <= strength.score
                                                                ? strength.color
                                                                : "rgba(249,115,22,0.1)",
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <p
                                            className="text-xs mt-1 font-medium"
                                            style={{ color: strength.color }}
                                        >
                                            {strength.label}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label
                                    className="flex items-center gap-1.5 text-xs font-medium mb-1.5"
                                    style={{ color: "#92400e" }}
                                >
                                    <Lock size={12} /> Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirm ? "text" : "password"}
                                        placeholder="Re-enter your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10 transition-all focus:ring-2 focus:ring-[#f97316]/30"
                                        style={{
                                            background: "var(--color-bg-raised)",
                                            border: `1px solid ${passwordsMismatch
                                                    ? "rgba(239,68,68,0.5)"
                                                    : passwordsMatch
                                                        ? "rgba(22,163,74,0.5)"
                                                        : "rgba(249,115,22,0.2)"
                                                }`,
                                            color: "#1a0a00",
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        style={{ color: "#78716c" }}
                                    >
                                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {passwordsMismatch && (
                                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#ef4444" }}>
                                        <X size={11} /> Passwords do not match
                                    </p>
                                )}
                                {passwordsMatch && (
                                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#16a34a" }}>
                                        <Check size={11} /> Passwords match
                                    </p>
                                )}
                            </div>

                            {/* Terms */}
                            <label
                                className="flex items-start gap-2.5 cursor-pointer select-none mt-2"
                            >
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={() => setAgreed(!agreed)}
                                    className="mt-0.5 accent-[#f97316]"
                                />
                                <span className="text-xs leading-relaxed" style={{ color: "#78716c" }}>
                                    I agree to the{" "}
                                    <span style={{ color: "#f97316", cursor: "pointer" }}>Terms of Service</span> and{" "}
                                    <span style={{ color: "#f97316", cursor: "pointer" }}>Privacy Policy</span>
                                </span>
                            </label>

                            {/* Error */}
                            {error && (
                                <p
                                    className="text-xs px-3 py-2 rounded-lg flex items-center gap-2"
                                    style={{
                                        background: "rgba(248,113,113,0.1)",
                                        color: "#dc2626",
                                        border: "1px solid rgba(248,113,113,0.2)",
                                    }}
                                >
                                    <X size={12} /> {error}
                                </p>
                            )}

                            {/* Submit */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-orange-50"
                                    style={{
                                        background: "var(--color-bg-raised)",
                                        border: "1px solid rgba(249,115,22,0.2)",
                                        color: "#1a0a00",
                                    }}
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !canSubmit}
                                    className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5"
                                    style={{
                                        background: "linear-gradient(135deg,#f97316,#ef4444)",
                                        color: "#fff8f4",
                                        opacity: canSubmit && !loading ? 1 : 0.6,
                                        boxShadow: "0 4px 14px rgba(249,115,22,0.3)",
                                    }}
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-[#fff8f4] border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <UserPlus size={14} /> Create Account
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px" style={{ background: "rgba(249,115,22,0.15)" }} />
                        <span className="text-xs" style={{ color: "#78716c" }}>or continue with</span>
                        <div className="flex-1 h-px" style={{ background: "rgba(249,115,22,0.15)" }} />
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md"
                            style={{
                                background: "var(--color-bg-raised)",
                                border: "1px solid rgba(249,115,22,0.15)",
                                color: "#1a0a00",
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                        <button
                            type="button"
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md"
                            style={{
                                background: "var(--color-bg-raised)",
                                border: "1px solid rgba(249,115,22,0.15)",
                                color: "#1a0a00",
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1a0a00">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            GitHub
                        </button>
                    </div>

                    <p className="text-center text-sm mt-5" style={{ color: "#78716c" }}>
                        Already have an account?{" "}
                        <Link to="/login" style={{ color: "#f97316", textDecoration: "none", fontWeight: 600 }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
