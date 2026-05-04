import React, { useState } from "react";
import { TrendingUp, Users, DollarSign, Star, Activity, Download, AlertTriangle } from "lucide-react";
import { CATEGORY_DATA, MOCK_ANALYTICS } from "../mock-data";
import { useApiWithStale } from "../lib/useApiWithStale";
import {
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

type Period = "daily" | "weekly" | "monthly";

interface TrendBucket {
    label: string;
    revenue: number;
    ticketsSold: number;
    bookings: number;
    growthRate: number;
    isPeak: boolean;
}

interface RevenueTrends {
    period: Period;
    series: TrendBucket[];
    byCategory: Record<string, number>;
    totals: { revenue: number; growthRate: number };
    fetchedAt: string;
}

interface DashboardKpis {
    scope: "platform" | "organizer";
    kpis: { sales: number; revenue: number; cancellations: number; engagement: number; commission: number; netPayout: number; avgRating: number; ratingCount: number };
    activeEvents: number;
    fetchedAt: string;
}

interface CampaignPerf {
    rows: Array<{ campaignId: string; name: string; eventTitle: string; impressions: number; opens: number; clicks: number; bookings: number; revenue: number; salesLift: number; ctr: number; conversionRate: number; openRate: number }>;
    meta: { adMediaStale: boolean };
    fetchedAt: string;
}

export function AnalyticsDashboard() {
    const [metric, setMetric] = useState<"revenue" | "ticketsSold" | "bookings">("revenue");
    const [period, setPeriod] = useState<Period>("monthly");

    const trendsApi = useApiWithStale<RevenueTrends>(`rev-trends:${period}`, `/api/analytics/revenue-trends?period=${period}`);
    const dashboardApi = useApiWithStale<DashboardKpis>("dashboard:platform", "/api/dashboard/organizer");
    const campaignsApi = useApiWithStale<CampaignPerf>("campaigns:performance:analytics", "/api/analytics/campaign-performance");

    const series = trendsApi.data?.series ?? [];
    const totalRevenue = trendsApi.data?.totals.revenue ?? 0;
    const overallGrowth = trendsApi.data?.totals.growthRate ?? 0;

    const formatCurrency = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
    const formatPercent = (n: number) => `${(n * 100).toFixed(1)}%`;

    const kpis = [
        { label: "Total Revenue", value: trendsApi.data ? formatCurrency(totalRevenue) : "—", change: trendsApi.data ? `${overallGrowth >= 0 ? "+" : ""}${formatPercent(overallGrowth)}` : "—", icon: DollarSign, color: "#f97316" },
        { label: "Tickets Sold", value: dashboardApi.data ? dashboardApi.data.kpis.sales.toLocaleString() : "—", change: "", icon: TrendingUp, color: "#2563eb" },
        { label: "Engagement", value: dashboardApi.data ? dashboardApi.data.kpis.engagement.toLocaleString() : "—", change: "", icon: Users, color: "#7c3aed" },
        { label: "Avg. Rating", value: dashboardApi.data && dashboardApi.data.kpis.ratingCount > 0 ? `${dashboardApi.data.kpis.avgRating.toFixed(1)} ★` : "—", change: "", icon: Star, color: "#d97706" },
    ];

    const exportCSV = () => {
        if (!trendsApi.data) return;
        const headers = ["Bucket", "Revenue", "Tickets Sold", "Bookings", "Growth %", "Peak?"];
        const rows = trendsApi.data.series.map((r) => [r.label, r.revenue, r.ticketsSold, r.bookings, (r.growthRate * 100).toFixed(2), r.isPeak ? "yes" : ""]);
        const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `planzo_analytics_${period}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const anyStale = trendsApi.isStale || dashboardApi.isStale || campaignsApi.isStale;
    const oldestStale = [trendsApi.lastLoadedAt, dashboardApi.lastLoadedAt, campaignsApi.lastLoadedAt].filter(Boolean).sort()[0];

    const series2 = series.length > 0 ? series : MOCK_ANALYTICS.map((m) => ({
        label: m.month, revenue: m.revenue, ticketsSold: m.ticketsSold, bookings: 0, growthRate: 0, isPeak: false,
    }));

    return (
        <div style={{ paddingTop: 68, minHeight: "100vh", background: "var(--color-bg-base)" }}>
            <div className="px-6 md:px-12 py-8 max-w-[1200px] mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>Analytics Dashboard</h1>
                        <p className="text-sm" style={{ color: "#78716c" }}>Platform performance metrics and engagement insights</p>
                    </div>
                    <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff" }}>
                        <Download size={14} /> Export Report
                    </button>
                </div>

                {anyStale && oldestStale && (
                    <div className="mb-4 px-3 py-2 rounded-lg text-xs flex items-center gap-2" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", color: "#92400e" }}>
                        <AlertTriangle size={12} /> Showing last-loaded analytics from {new Date(oldestStale).toLocaleString()} — refresh failed.
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {kpis.map(({ label, value, change, icon: Icon, color }) => (
                        <div key={label} className="p-5 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                                    <Icon size={16} style={{ color }} />
                                </div>
                                {change && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.08)", color: "#f97316" }}>{change}</span>
                                )}
                            </div>
                            <p className="text-2xl font-bold" style={{ color, fontFamily: "'Outfit',sans-serif" }}>{value}</p>
                            <p className="text-xs mt-1" style={{ color: "#78716c" }}>{label}</p>
                        </div>
                    ))}
                </div>

                <div className="p-6 rounded-2xl mb-6" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                        <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>
                            <Activity size={16} style={{ color: "#f97316" }} />
                            Revenue Trends
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                                {(["daily", "weekly", "monthly"] as const).map((p) => (
                                    <button key={p} onClick={() => setPeriod(p)} className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize" style={{ background: period === p ? "#f97316" : "rgba(249,115,22,0.06)", color: period === p ? "#fff8f4" : "#92400e", border: `1px solid ${period === p ? "#f97316" : "rgba(249,115,22,0.18)"}` }}>{p}</button>
                                ))}
                            </div>
                            <div className="flex gap-1">
                                {(["revenue", "ticketsSold", "bookings"] as const).map((m) => (
                                    <button key={m} onClick={() => setMetric(m)} className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize" style={{ background: metric === m ? "#2563eb" : "rgba(96,165,250,0.06)", color: metric === m ? "#fff" : "#2563eb", border: `1px solid ${metric === m ? "#2563eb" : "rgba(96,165,250,0.2)"}` }}>{m === "ticketsSold" ? "Tickets" : m}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                    {trendsApi.data && (
                        <div className="flex flex-wrap gap-3 mb-3 text-xs">
                            <span className="px-2.5 py-1 rounded-full" style={{ background: overallGrowth >= 0 ? "rgba(22,163,74,0.1)" : "rgba(239,68,68,0.1)", color: overallGrowth >= 0 ? "#16a34a" : "#dc2626" }}>
                                Period growth: {overallGrowth >= 0 ? "+" : ""}{formatPercent(overallGrowth)}
                            </span>
                            <span className="px-2.5 py-1 rounded-full" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>
                                Peaks: {series.filter((s) => s.isPeak).length}
                            </span>
                        </div>
                    )}
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={series2}>
                            <defs>
                                <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(249,115,22,0.06)" />
                            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#78716c" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: "#78716c" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 8, color: "#1a0a00" }} />
                            <Area type="monotone" dataKey={metric} stroke="#f97316" strokeWidth={2} fill="url(#metricGrad)" dot={{ fill: "#f97316", strokeWidth: 0, r: 3 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                    {series.length === 0 && trendsApi.error && (
                        <p className="text-xs text-center mt-3" style={{ color: "#78716c" }}>Live trends unavailable. Showing baseline data.</p>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                        <h2 className="text-base font-bold mb-4" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>Category Breakdown</h2>
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                    {CATEGORY_DATA.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 8, color: "#1a0a00" }} formatter={(v: number) => [`${v}%`, ""]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="lg:col-span-2 p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                        <h2 className="text-base font-bold mb-4" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>Bookings vs Revenue</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={series2}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(249,115,22,0.06)" />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 8, color: "#1a0a00" }} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Line type="monotone" dataKey="bookings" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} name="Bookings" />
                                <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                    <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "rgba(249,115,22,0.08)" }}>
                        <h2 className="text-base font-bold" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>Campaign Performance</h2>
                        {campaignsApi.data?.meta.adMediaStale && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(251,191,36,0.12)", color: "#92400e" }}>Ad-media offline</span>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(249,115,22,0.06)" }}>
                                    {["Campaign", "Impressions", "Opens", "Clicks", "CTR", "Conv. Rate", "Sales Lift", "Revenue"].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: "#78716c" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(campaignsApi.data?.rows ?? []).map((c) => (
                                    <tr key={c.campaignId} className="hover:bg-[rgba(249,115,22,0.02)] transition-colors" style={{ borderBottom: "1px solid rgba(249,115,22,0.04)" }}>
                                        <td className="px-4 py-3 font-medium text-sm" style={{ color: "#1a0a00" }}>{c.name}<p className="text-[10px] font-normal" style={{ color: "#78716c" }}>{c.eventTitle}</p></td>
                                        <td className="px-4 py-3 text-xs" style={{ color: "#92400e" }}>{c.impressions.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-xs" style={{ color: "#92400e" }}>{c.opens.toLocaleString()} ({formatPercent(c.openRate)})</td>
                                        <td className="px-4 py-3 text-xs" style={{ color: "#92400e" }}>{c.clicks.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-xs font-bold" style={{ color: "#f97316" }}>{formatPercent(c.ctr)}</td>
                                        <td className="px-4 py-3 text-xs font-bold" style={{ color: "#16a34a" }}>{formatPercent(c.conversionRate)}</td>
                                        <td className="px-4 py-3 text-xs font-bold" style={{ color: c.salesLift >= 0 ? "#16a34a" : "#dc2626" }}>{c.salesLift >= 0 ? "+" : ""}{formatCurrency(c.salesLift)}</td>
                                        <td className="px-4 py-3 text-xs font-bold" style={{ color: "#f97316" }}>{formatCurrency(c.revenue)}</td>
                                    </tr>
                                ))}
                                {(campaignsApi.data?.rows ?? []).length === 0 && (
                                    <tr><td colSpan={8} className="px-4 py-8 text-center text-xs" style={{ color: "#78716c" }}>No campaign data yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
