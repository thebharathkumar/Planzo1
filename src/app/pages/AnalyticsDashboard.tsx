import React, { useState } from "react";
import { TrendingUp, Users, DollarSign, Star, Activity } from "lucide-react";
import { MOCK_ANALYTICS, CATEGORY_DATA, MOCK_CAMPAIGNS } from "../mock-data";
import {
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";

export function AnalyticsDashboard() {
    const [metric, setMetric] = useState<"revenue" | "ticketsSold" | "attendees">("revenue");

    const kpis = [
        { label: "Total Revenue", value: "$830K", change: "+23%", icon: DollarSign, color: "#f97316" },
        { label: "Tickets Sold", value: "17,050", change: "+18%", icon: TrendingUp, color: "#2563eb" },
        { label: "Total Attendees", value: "14,870", change: "+21%", icon: Users, color: "#7c3aed" },
        { label: "Avg. Rating", value: "4.82 ★", change: "+0.3", icon: Star, color: "#d97706" },
    ];

    const metricLabels: Record<typeof metric, string> = {
        revenue: "Revenue ($)",
        ticketsSold: "Tickets Sold",
        attendees: "Attendees",
    };

    const campaignStatusColor = (s: string) => {
        if (s === "active") return { bg: "rgba(74,222,128,0.1)", color: "#f97316" };
        if (s === "completed") return { bg: "rgba(96,165,250,0.1)", color: "#2563eb" };
        return { bg: "rgba(90,122,101,0.1)", color: "#78716c" };
    };

    return (
        <div style={{ paddingTop: 68, minHeight: "100vh", background: "var(--color-bg-base)" }}>
            <div className="px-6 md:px-12 py-8 max-w-[1200px] mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>Analytics Dashboard</h1>
                    <p className="text-sm" style={{ color: "#78716c" }}>Platform performance metrics and engagement insights</p>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {kpis.map(({ label, value, change, icon: Icon, color }) => (
                        <div key={label} className="p-5 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                                    <Icon size={16} style={{ color }} />
                                </div>
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.08)", color: "#f97316" }}>{change}</span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color, fontFamily: "'Outfit',sans-serif" }}>{value}</p>
                            <p className="text-xs mt-1" style={{ color: "#78716c" }}>{label}</p>
                        </div>
                    ))}
                </div>

                {/* Main Chart */}
                <div className="p-6 rounded-2xl mb-6" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-bold" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>
                            <Activity size={16} className="inline mr-2" style={{ color: "#f97316" }} />
                            Platform Growth (Sep – Mar)
                        </h2>
                        <div className="flex gap-2">
                            {(["revenue", "ticketsSold", "attendees"] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMetric(m)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                                    style={{
                                        background: metric === m ? "#f97316" : "rgba(249,115,22,0.06)",
                                        color: metric === m ? "#fff8f4" : "#92400e",
                                        border: `1px solid ${metric === m ? "#f97316" : "rgba(249,115,22,0.18)"}`,
                                    }}
                                >
                                    {m === "ticketsSold" ? "Tickets" : m.charAt(0).toUpperCase() + m.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={MOCK_ANALYTICS}>
                            <defs>
                                <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(249,115,22,0.06)" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#78716c" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: "#78716c" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 8, color: "#1a0a00" }} />
                            <Area type="monotone" dataKey={metric} stroke="#f97316" strokeWidth={2} fill="url(#metricGrad)" dot={{ fill: "#f97316", strokeWidth: 0, r: 4 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Category Breakdown */}
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
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                            {CATEGORY_DATA.map(({ name, value, fill }) => (
                                <div key={name} className="flex items-center gap-1 text-xs">
                                    <div className="w-2 h-2 rounded-full" style={{ background: fill }} />
                                    <span style={{ color: "#92400e" }}>{name} {value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* New Users vs Attendees */}
                    <div className="lg:col-span-2 p-6 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                        <h2 className="text-base font-bold mb-4" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>New Users vs Attendees</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={MOCK_ANALYTICS}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(249,115,22,0.06)" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 8, color: "#1a0a00" }} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Line type="monotone" dataKey="attendees" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Attendees" />
                                <Line type="monotone" dataKey="newUsers" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="New Users" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Campaign Performance */}
                <div className="mt-6 rounded-2xl overflow-hidden" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                    <div className="p-5 border-b" style={{ borderColor: "rgba(249,115,22,0.08)" }}>
                        <h2 className="text-base font-bold" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>Campaign Performance</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: "1px solid rgba(249,115,22,0.06)" }}>
                                    {["Campaign", "Type", "Sent", "Opened", "Clicks", "Revenue", "Status"].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: "#78716c" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_CAMPAIGNS.map((c) => {
                                    const sc = campaignStatusColor(c.status);
                                    return (
                                        <tr key={c.id} className="hover:bg-[rgba(249,115,22,0.02)] transition-colors" style={{ borderBottom: "1px solid rgba(249,115,22,0.04)" }}>
                                            <td className="px-4 py-3 font-medium text-sm" style={{ color: "#1a0a00" }}>{c.name}</td>
                                            <td className="px-4 py-3"><span className="capitalize text-xs px-2 py-0.5 rounded" style={{ background: "rgba(249,115,22,0.08)", color: "#f97316" }}>{c.type}</span></td>
                                            <td className="px-4 py-3 text-xs" style={{ color: "#92400e" }}>{c.sent.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-xs" style={{ color: "#92400e" }}>{c.opened.toLocaleString()} {c.sent > 0 ? `(${Math.round(c.opened / c.sent * 100)}%)` : ""}</td>
                                            <td className="px-4 py-3 text-xs" style={{ color: "#92400e" }}>{c.clicked.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-xs font-bold" style={{ color: "#f97316" }}>${c.revenue.toLocaleString()}</td>
                                            <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-xs font-medium capitalize" style={{ background: sc.bg, color: sc.color }}>{c.status}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
