import React, { useMemo, useState } from "react";
import { DollarSign, TrendingUp, ArrowUpRight, Download, FileText, AlertCircle, Loader2 } from "lucide-react";
import { useAuth, useEvents } from "../store";
import { apiFetch } from "../lib/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ReportRow {
    key: string;
    label: string;
    bookingCount: number;
    gross: number;
    refunds: number;
    commission: number;
    net: number;
}

interface FinancialReport {
    id: string;
    startDate: string;
    endDate: string;
    dimension: "event" | "organizer" | "category";
    rows: ReportRow[];
    totals: { bookingCount: number; gross: number; refunds: number; commission: number; net: number };
    formatted: { gross: string; refunds: string; commission: string; net: string };
    generatedBy: string;
    generatedAt: string;
}

function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgo(): string {
    return new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
}

function fmtCurrency(n: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function encodeUserHeader(user: { id: string; name: string; role: string } | null): string | null {
    if (!user) return null;
    const payload = JSON.stringify({ id: user.id, name: user.name, role: user.role });
    if (typeof window !== "undefined" && typeof window.btoa === "function") {
        return window.btoa(unescape(encodeURIComponent(payload)));
    }
    return null;
}

export function AdminFinanceDashboard() {
    const { currentUser } = useAuth();
    const { events } = useEvents();

    const [startDate, setStartDate] = useState<string>(thirtyDaysAgo());
    const [endDate, setEndDate] = useState<string>(todayDate());
    const [dimension, setDimension] = useState<"event" | "organizer" | "category">("event");
    const [eventIds, setEventIds] = useState<string[]>([]);
    const [generating, setGenerating] = useState(false);
    const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
    const [report, setReport] = useState<FinancialReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [exportNotice, setExportNotice] = useState<string | null>(null);

    const role = currentUser?.role;
    const canExport = role === "finance" || role === "accountant" || role === "admin";

    const handleGenerate = async () => {
        setGenerating(true);
        setError(null);
        setReport(null);
        const result = await apiFetch<FinancialReport>("/api/reports/financial", {
            method: "POST",
            user: currentUser,
            body: JSON.stringify({ startDate, endDate, dimension, eventIds: eventIds.length > 0 ? eventIds : undefined }),
        });
        setGenerating(false);
        if (!result.ok || !result.data) {
            setError(result.error || "Could not generate report");
            return;
        }
        setReport(result.data);
    };

    const handleExport = async (format: "csv" | "pdf") => {
        if (!report) return;
        setExporting(format);
        setExportNotice(null);
        const headerValue = encodeUserHeader(currentUser as any);
        try {
            const res = await fetch(`/api/reports/financial/export?id=${encodeURIComponent(report.id)}&format=${format}`, {
                headers: headerValue ? { "x-planzo-user": headerValue } : undefined,
            });
            if (res.status === 202) {
                const data = await res.json();
                setExportNotice(`Export queued — retry token ${data.retryToken}`);
                return;
            }
            if (!res.ok) {
                let msg = `Export failed (${res.status})`;
                try {
                    const data = await res.json();
                    msg = data.error || msg;
                } catch { /* binary */ }
                setError(msg);
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `planzo-financial-${report.id}.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Export failed");
        } finally {
            setExporting(null);
        }
    };

    const trendData = useMemo(() => {
        if (!report) return [];
        return report.rows.slice(0, 8).map((r) => ({ label: r.label.length > 14 ? r.label.slice(0, 14) + "…" : r.label, gross: r.gross, net: r.net }));
    }, [report]);

    return (
        <div style={{ paddingTop: 68, minHeight: "100vh", background: "var(--color-bg-base)" }}>
            <div className="px-6 md:px-12 py-8 max-w-[1200px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>Finance Dashboard</h1>
                    <p className="text-sm" style={{ color: "#78716c" }}>Generate financial reports across bookings, refunds, and payouts.</p>
                </div>

                {!canExport && currentUser && (
                    <div className="mb-6 p-3 rounded-xl text-xs flex items-center gap-2" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", color: "#92400e" }}>
                        <AlertCircle size={14} /> You can preview reports but only Finance, Accountant, or Admin roles can export. Current role: <strong>{role}</strong>.
                    </div>
                )}

                <div className="p-6 rounded-2xl mb-8" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                    <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>
                        <FileText size={16} style={{ color: "#f97316" }} /> Generate Financial Report
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>End Date</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Dimension</label>
                            <select value={dimension} onChange={(e) => setDimension(e.target.value as typeof dimension)} className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }}>
                                <option value="event">By Event</option>
                                <option value="organizer">By Organizer</option>
                                <option value="category">By Category</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button onClick={handleGenerate} disabled={generating || !startDate || !endDate} className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff8f4" }}>
                                {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                                Generate
                            </button>
                        </div>
                    </div>
                    <details className="mt-3">
                        <summary className="text-xs cursor-pointer" style={{ color: "#92400e" }}>Filter by specific events ({eventIds.length || "all"})</summary>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                            {events.map((e) => {
                                const checked = eventIds.includes(e.id);
                                return (
                                    <label key={e.id} className="flex items-center gap-2 text-xs" style={{ color: "#1a0a00" }}>
                                        <input type="checkbox" checked={checked} onChange={() => setEventIds((prev) => checked ? prev.filter((id) => id !== e.id) : [...prev, e.id])} />
                                        <span className="line-clamp-1">{e.title}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </details>
                    {error && (
                        <div className="mt-3 p-3 rounded-lg text-xs flex items-start gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#991b1b" }}>
                            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                        </div>
                    )}
                </div>

                {report && (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: "Gross Revenue", value: report.formatted.gross, color: "#f97316", icon: DollarSign },
                                { label: "Refunds", value: report.formatted.refunds, color: "#dc2626", icon: ArrowUpRight },
                                { label: "Commission (10%)", value: report.formatted.commission, color: "#2563eb", icon: ArrowUpRight },
                                { label: "Net Payout", value: report.formatted.net, color: "#16a34a", icon: TrendingUp },
                            ].map(({ label, value, color, icon: Icon }) => (
                                <div key={label} className="p-5 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#78716c" }}>{label}</p>
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}><Icon size={14} style={{ color }} /></div>
                                    </div>
                                    <p className="text-2xl font-bold" style={{ color, fontFamily: "'Outfit',sans-serif" }}>{value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                            <div className="p-5 border-b flex flex-wrap items-center justify-between gap-3" style={{ borderColor: "rgba(249,115,22,0.08)" }}>
                                <div>
                                    <h2 className="text-base font-bold" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>Report #{report.id.slice(0, 12)}</h2>
                                    <p className="text-xs" style={{ color: "#78716c" }}>{report.startDate} → {report.endDate} · {report.dimension} · {report.totals.bookingCount} bookings</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleExport("csv")} disabled={!canExport || !!exporting} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold" style={{ background: canExport ? "rgba(249,115,22,0.1)" : "rgba(0,0,0,0.04)", color: canExport ? "#f97316" : "#94a3b8", border: `1px solid ${canExport ? "rgba(249,115,22,0.25)" : "rgba(0,0,0,0.08)"}`, cursor: canExport ? "pointer" : "not-allowed" }}>
                                        {exporting === "csv" ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Export CSV
                                    </button>
                                    <button onClick={() => handleExport("pdf")} disabled={!canExport || !!exporting} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold" style={{ background: canExport ? "linear-gradient(135deg,#f97316,#ef4444)" : "rgba(0,0,0,0.04)", color: canExport ? "#fff" : "#94a3b8", cursor: canExport ? "pointer" : "not-allowed" }}>
                                        {exporting === "pdf" ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Export PDF
                                    </button>
                                </div>
                            </div>
                            {exportNotice && (
                                <div className="p-3 text-xs" style={{ background: "rgba(96,165,250,0.08)", color: "#1d4ed8" }}>{exportNotice}</div>
                            )}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid rgba(249,115,22,0.06)" }}>
                                            {[report.dimension === "organizer" ? "Organizer" : report.dimension === "category" ? "Category" : "Event", "Bookings", "Gross", "Refunds", "Commission", "Net"].map((h) => (
                                                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: "#78716c" }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.rows.map((r) => (
                                            <tr key={r.key} className="hover:bg-[rgba(249,115,22,0.02)] transition-colors" style={{ borderBottom: "1px solid rgba(249,115,22,0.04)" }}>
                                                <td className="px-4 py-3 font-medium text-sm" style={{ color: "#1a0a00" }}>{r.label}</td>
                                                <td className="px-4 py-3 text-xs" style={{ color: "#92400e" }}>{r.bookingCount.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-xs font-bold" style={{ color: "#f97316" }}>{fmtCurrency(r.gross)}</td>
                                                <td className="px-4 py-3 text-xs" style={{ color: "#dc2626" }}>{fmtCurrency(r.refunds)}</td>
                                                <td className="px-4 py-3 text-xs" style={{ color: "#2563eb" }}>{fmtCurrency(r.commission)}</td>
                                                <td className="px-4 py-3 text-xs font-bold" style={{ color: "#16a34a" }}>{fmtCurrency(r.net)}</td>
                                            </tr>
                                        ))}
                                        {report.rows.length === 0 && (
                                            <tr><td colSpan={6} className="px-4 py-8 text-center text-xs" style={{ color: "#78716c" }}>No transactions in this date range.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {trendData.length > 1 && (
                            <div className="p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                                <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>
                                    <TrendingUp size={16} style={{ color: "#f97316" }} /> Top {trendData.length} by gross
                                </h2>
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(249,115,22,0.06)" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 8, color: "#1a0a00" }} formatter={(v: number) => [fmtCurrency(v), ""]} />
                                        <Area type="monotone" dataKey="gross" stroke="#f97316" strokeWidth={2} fill="url(#grossGrad)" name="Gross" dot={{ r: 3, fill: "#f97316" }} />
                                        <Area type="monotone" dataKey="net" stroke="#16a34a" strokeWidth={2} name="Net" dot={{ r: 3, fill: "#16a34a" }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </>
                )}

                {!report && !generating && (
                    <div className="p-10 rounded-2xl text-center" style={{ background: "var(--color-bg-card)", border: "1px dashed rgba(249,115,22,0.25)" }}>
                        <FileText size={28} style={{ color: "#f97316" }} className="mx-auto mb-3" />
                        <p className="text-sm font-medium mb-1" style={{ color: "#1a0a00" }}>No report generated yet</p>
                        <p className="text-xs" style={{ color: "#78716c" }}>Choose a date range and dimension above, then click Generate.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
