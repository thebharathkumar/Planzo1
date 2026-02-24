import React, { useState } from "react";
import { Link } from "react-router";
import { Ticket, Clock, MapPin, X, Star, QrCode } from "lucide-react";
import { MOCK_BOOKINGS } from "../mock-data";

export function MyTickets() {
    const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [cancelled, setCancelled] = useState<string[]>([]);

    const upcoming = MOCK_BOOKINGS.filter((b) => b.status !== "cancelled" && !cancelled.includes(b.id));
    const past: typeof MOCK_BOOKINGS = [];

    const visibleBookings = tab === "upcoming" ? upcoming : past;

    const handleCancel = (id: string) => {
        setCancellingId(id);
        setTimeout(() => {
            setCancelled((prev) => [...prev, id]);
            setCancellingId(null);
        }, 800);
    };

    const statusColor = (status: string) => {
        if (status === "confirmed") return { bg: "rgba(74,222,128,0.1)", color: "#f97316", label: "Confirmed" };
        if (status === "pending") return { bg: "rgba(251,191,36,0.1)", color: "#d97706", label: "Pending" };
        return { bg: "rgba(248,113,113,0.1)", color: "#dc2626", label: "Cancelled" };
    };

    return (
        <div style={{ paddingTop: 68, minHeight: "100vh", background: "var(--color-bg-base)" }}>
            <div className="px-6 md:px-12 py-8 max-w-[900px] mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>My Tickets</h1>
                    <p className="text-sm" style={{ color: "#78716c" }}>Manage your bookings and access your event tickets</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: "Total Bookings", value: MOCK_BOOKINGS.length, color: "#f97316" },
                        { label: "Confirmed", value: MOCK_BOOKINGS.filter(b => b.status === "confirmed").length, color: "#f97316" },
                        { label: "Total Spent", value: `$${MOCK_BOOKINGS.reduce((s, b) => s + b.total, 0)}`, color: "#f97316" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="p-4 rounded-xl text-center" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.08)" }}>
                            <p className="text-xl font-bold" style={{ color }}>{value}</p>
                            <p className="text-xs mt-1" style={{ color: "#78716c" }}>{label}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {(["upcoming", "past"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-all"
                            style={{
                                background: tab === t ? "#f97316" : "rgba(249,115,22,0.06)",
                                color: tab === t ? "#fff8f4" : "#92400e",
                                border: `1px solid ${tab === t ? "#f97316" : "rgba(249,115,22,0.18)"}`,
                            }}
                        >
                            {t} ({t === "upcoming" ? upcoming.length : past.length})
                        </button>
                    ))}
                </div>

                {/* Ticket List */}
                {visibleBookings.length === 0 ? (
                    <div className="text-center py-16">
                        <Ticket size={48} className="mx-auto mb-4" style={{ color: "#2a3d32" }} />
                        <p className="text-base font-medium mb-2" style={{ color: "#78716c" }}>No {tab} tickets</p>
                        <Link to="/" className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: "#f97316", color: "#fff8f4", textDecoration: "none" }}>
                            Find Events
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {visibleBookings.map((booking) => {
                            const sc = statusColor(booking.status);
                            return (
                                <div key={booking.id} className="p-5 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(74,222,128,0.1)" }}>
                                    <div className="flex flex-col md:flex-row gap-5">
                                        {/* QR Code */}
                                        <div
                                            className="w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center"
                                            style={{
                                                background: "rgba(249,115,22,0.06)",
                                                border: "1px solid rgba(249,115,22,0.25)",
                                                backgroundImage: `repeating-linear-gradient(0deg,rgba(249,115,22,0.08) 0,rgba(249,115,22,0.08) 2px,transparent 0,transparent 6px),repeating-linear-gradient(90deg,rgba(249,115,22,0.08) 0,rgba(249,115,22,0.08) 2px,transparent 0,transparent 6px)`,
                                            }}
                                        >
                                            <QrCode size={32} style={{ color: "#f97316" }} />
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <h3 className="font-bold text-sm" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>{booking.eventTitle}</h3>
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0" style={{ background: sc.bg, color: sc.color }}>
                                                    {sc.label}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
                                                <span className="flex items-center gap-1" style={{ color: "#78716c" }}><Clock size={10} /> {booking.eventDate}</span>
                                                <span className="flex items-center gap-1" style={{ color: "#78716c" }}><MapPin size={10} /> {booking.eventVenue}</span>
                                                <span className="flex items-center gap-1" style={{ color: "#78716c" }}><Ticket size={10} /> {booking.tierName} × {booking.quantity}</span>
                                                <span className="font-bold" style={{ color: "#f97316" }}>${booking.total}</span>
                                            </div>

                                            <p className="text-xs font-mono mb-3" style={{ color: "#2a3d32" }}>{booking.qrCode}</p>

                                            <div className="flex gap-2">
                                                <button className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(74,222,128,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)" }}>
                                                    Download Ticket
                                                </button>
                                                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(74,222,128,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)" }}>
                                                    <Star size={10} /> Rate Event
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(booking.id)}
                                                    disabled={cancellingId === booking.id}
                                                    className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                                    style={{ background: "rgba(248,113,113,0.06)", color: "#dc2626", border: "1px solid rgba(248,113,113,0.15)" }}
                                                >
                                                    {cancellingId === booking.id ? (
                                                        <div className="w-3 h-3 border border-[#dc2626] border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <><X size={10} /> Cancel</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
