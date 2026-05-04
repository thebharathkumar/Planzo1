import React, { useMemo, useState } from "react";
import { Link } from "react-router";
import { Ticket, Clock, MapPin, Star, QrCode, X, Check, Download, RefreshCw, AlertCircle } from "lucide-react";
import { MOCK_BOOKINGS, Booking } from "../mock-data";
import { useAuth, useTickets } from "../store";
import type { IssuedTicket } from "../lib/tickets";
import { apiFetch } from "../lib/api";

type ModalType = "cancel" | "rate" | "refund" | "qr" | null;

export function MyTickets() {
    const { tickets } = useTickets();
    const { currentUser } = useAuth();
    const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
    const [cancelled, setCancelled] = useState<string[]>([]);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<IssuedTicket | null>(null);

    const issuedBookings: Booking[] = useMemo(() => {
        const groups = new Map<string, IssuedTicket[]>();
        for (const t of tickets) {
            const list = groups.get(t.bookingId) ?? [];
            list.push(t);
            groups.set(t.bookingId, list);
        }
        return Array.from(groups.values()).map((group) => {
            const head = group[0];
            const status: Booking["status"] = group.every((t) => t.status === "cancelled")
                ? "cancelled"
                : group.some((t) => t.status === "checked_in")
                  ? "confirmed"
                  : "confirmed";
            return {
                id: head.bookingId,
                eventId: head.eventId,
                eventTitle: head.eventTitle,
                eventDate: head.eventDate,
                eventVenue: head.eventVenue,
                userId: head.userId,
                tierName: head.tierName,
                quantity: group.length,
                total: group.reduce((s, t) => s + t.price, 0),
                status,
                bookedAt: head.issuedAt.slice(0, 10),
                qrCode: head.id,
            };
        });
    }, [tickets]);

    const ticketByBookingId = useMemo(() => {
        const m = new Map<string, IssuedTicket>();
        for (const t of tickets) {
            if (!m.has(t.bookingId)) m.set(t.bookingId, t);
        }
        return m;
    }, [tickets]);

    const allBookings = useMemo(() => [...issuedBookings, ...MOCK_BOOKINGS], [issuedBookings]);

    // Rate Event
    const [rating, setRating] = useState(0);
    const [ratingHover, setRatingHover] = useState(0);
    const [review, setReview] = useState("");
    const [ratingSubmitted, setRatingSubmitted] = useState<string[]>([]);
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [ratingError, setRatingError] = useState<string | null>(null);

    // Refund
    const [refundReason, setRefundReason] = useState("Unable to attend");
    const [refundNote, setRefundNote] = useState("");
    const [refundSubmitted, setRefundSubmitted] = useState<string[]>([]);
    const [refundLoading, setRefundLoading] = useState(false);

    const upcoming = allBookings.filter((b) => b.status !== "cancelled" && !cancelled.includes(b.id));
    const past = allBookings.filter((b) => !upcoming.includes(b));
    const visibleBookings = tab === "upcoming" ? upcoming : past;

    const openModal = (type: ModalType, booking: Booking) => {
        setSelectedBooking(booking);
        setSelectedTicket(ticketByBookingId.get(booking.id) ?? null);
        setActiveModal(type);
        setRating(0);
        setReview("");
        setRefundNote("");
        setRefundReason("Unable to attend");
        setRatingError(null);
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedBooking(null);
        setSelectedTicket(null);
    };

    const handleCancel = (id: string) => {
        setCancellingId(id);
        setTimeout(() => {
            setCancelled((prev) => [...prev, id]);
            setCancellingId(null);
            closeModal();
        }, 800);
    };

    const handleRatingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBooking) return;
        setRatingError(null);
        setRatingSubmitting(true);
        const result = await apiFetch("/api/reviews", {
            method: "POST",
            user: currentUser,
            body: JSON.stringify({
                bookingId: selectedBooking.id,
                rating,
                text: review,
            }),
        });
        setRatingSubmitting(false);
        if (!result.ok) {
            setRatingError(result.error || "Could not submit review");
            return;
        }
        setRatingSubmitted(prev => [...prev, selectedBooking.id]);
        setTimeout(closeModal, 1000);
    };

    const handleRefundSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setRefundLoading(true);
        setTimeout(() => {
            if (selectedBooking) setRefundSubmitted(prev => [...prev, selectedBooking.id]);
            setRefundLoading(false);
            setTimeout(closeModal, 1000);
        }, 1200);
    };

    const statusColor = (status: string) => {
        if (status === "confirmed") return { bg: "rgba(74,222,128,0.1)", color: "#f97316", label: "Confirmed" };
        if (status === "pending") return { bg: "rgba(251,191,36,0.1)", color: "#d97706", label: "Pending" };
        return { bg: "rgba(248,113,113,0.1)", color: "#dc2626", label: "Cancelled" };
    };

    return (
        <div style={{ paddingTop: 68, minHeight: "100vh", background: "var(--color-bg-base)" }}>
            <div className="px-6 md:px-12 py-8 max-w-[900px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>My Tickets</h1>
                    <p className="text-sm" style={{ color: "#78716c" }}>Manage your bookings and access your event tickets</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: "Total Bookings", value: allBookings.length, color: "#f97316" },
                        { label: "Confirmed", value: allBookings.filter(b => b.status === "confirmed").length, color: "#f97316" },
                        { label: "Total Spent", value: `$${allBookings.reduce((s, b) => s + b.total, 0)}`, color: "#f97316" },
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
                        <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-full text-sm font-medium capitalize transition-all"
                            style={{ background: tab === t ? "#f97316" : "rgba(249,115,22,0.06)", color: tab === t ? "#fff8f4" : "#92400e", border: `1px solid ${tab === t ? "#f97316" : "rgba(249,115,22,0.18)"}` }}>
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
                            const isRated = ratingSubmitted.includes(booking.id);
                            const isRefunded = refundSubmitted.includes(booking.id);
                            const realTicket = ticketByBookingId.get(booking.id);
                            return (
                                <div key={booking.id} className="p-5 rounded-2xl" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(74,222,128,0.1)" }}>
                                    <div className="flex flex-col md:flex-row gap-5">
                                        {/* QR Code - clickable */}
                                        <button onClick={() => openModal("qr", booking)} className="w-24 h-24 rounded-xl flex-shrink-0 flex items-center justify-center transition-all hover:scale-105 overflow-hidden"
                                            style={{ background: realTicket ? "#ffffff" : "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.25)", backgroundImage: realTicket ? undefined : `repeating-linear-gradient(0deg,rgba(249,115,22,0.08) 0,rgba(249,115,22,0.08) 2px,transparent 0,transparent 6px),repeating-linear-gradient(90deg,rgba(249,115,22,0.08) 0,rgba(249,115,22,0.08) 2px,transparent 0,transparent 6px)` }}>
                                            {realTicket ? (
                                                <img src={realTicket.qrDataUrl} alt="Ticket QR" className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <QrCode size={32} style={{ color: "#f97316" }} />
                                            )}
                                        </button>

                                        {/* Details */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <h3 className="font-bold text-sm" style={{ color: "#1a0a00", fontFamily: "'Outfit',sans-serif" }}>{booking.eventTitle}</h3>
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
                                                <span className="flex items-center gap-1" style={{ color: "#78716c" }}><Clock size={10} /> {booking.eventDate}</span>
                                                <span className="flex items-center gap-1" style={{ color: "#78716c" }}><MapPin size={10} /> {booking.eventVenue}</span>
                                                <span className="flex items-center gap-1" style={{ color: "#78716c" }}><Ticket size={10} /> {booking.tierName} × {booking.quantity}</span>
                                                <span className="font-bold" style={{ color: "#f97316" }}>${booking.total}</span>
                                            </div>
                                            <p className="text-xs font-mono mb-3" style={{ color: "#2a3d32" }}>{booking.qrCode}</p>

                                            <div className="flex flex-wrap gap-2">
                                                <button onClick={() => openModal("qr", booking)} className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                                                    style={{ background: "rgba(74,222,128,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)" }}>
                                                    <Download size={10} /> Download Ticket
                                                </button>
                                                <button
                                                    onClick={() => openModal("rate", booking)}
                                                    disabled={isRated}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                                                    style={{ background: isRated ? "rgba(22,163,74,0.1)" : "rgba(74,222,128,0.1)", color: isRated ? "#16a34a" : "#f97316", border: `1px solid ${isRated ? "rgba(22,163,74,0.25)" : "rgba(249,115,22,0.25)"}` }}>
                                                    {isRated ? <><Check size={10} /> Rated</> : <><Star size={10} /> Rate Event</>}
                                                </button>
                                                {!isRefunded ? (
                                                    <button onClick={() => openModal("refund", booking)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                                                        style={{ background: "rgba(96,165,250,0.1)", color: "#2563eb", border: "1px solid rgba(96,165,250,0.2)" }}>
                                                        <RefreshCw size={10} /> Refund Request
                                                    </button>
                                                ) : (
                                                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#d97706", background: "rgba(251,191,36,0.1)" }}>
                                                        <Check size={10} /> Refund Requested
                                                    </span>
                                                )}
                                                <button onClick={() => openModal("cancel", booking)} disabled={cancellingId === booking.id}
                                                    className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                                    style={{ background: "rgba(248,113,113,0.06)", color: "#dc2626", border: "1px solid rgba(248,113,113,0.15)" }}>
                                                    {cancellingId === booking.id ? <div className="w-3 h-3 border border-[#dc2626] border-t-transparent rounded-full animate-spin" /> : <><X size={10} /> Cancel</>}
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

            {/* Backdrop for all modals */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}
                    onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>

                    {/* QR / Download Ticket Modal */}
                    {activeModal === "qr" && selectedBooking && (
                        <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: "var(--color-bg-panel)", border: "1px solid rgba(249,115,22,0.25)" }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold" style={{ color: "#1a0a00" }}>Your Digital Ticket</h2>
                                <button onClick={closeModal}><X size={18} style={{ color: "#78716c" }} /></button>
                            </div>
                            {selectedTicket ? (
                                <div className="w-44 h-44 mx-auto rounded-2xl mb-4 flex items-center justify-center p-2 overflow-hidden"
                                    style={{ background: "#ffffff", border: "2px solid rgba(249,115,22,0.3)" }}>
                                    <img src={selectedTicket.qrDataUrl} alt="Ticket QR code" className="w-full h-full object-contain" />
                                </div>
                            ) : (
                                <div className="w-36 h-36 mx-auto rounded-2xl mb-4 flex items-center justify-center"
                                    style={{ background: "rgba(249,115,22,0.06)", border: "2px solid rgba(249,115,22,0.3)", backgroundImage: `repeating-linear-gradient(0deg,rgba(249,115,22,0.12) 0,rgba(249,115,22,0.12) 2px,transparent 0,transparent 8px),repeating-linear-gradient(90deg,rgba(249,115,22,0.12) 0,rgba(249,115,22,0.12) 2px,transparent 0,transparent 8px)` }}>
                                    <QrCode size={64} style={{ color: "#f97316" }} />
                                </div>
                            )}
                            <p className="font-bold text-sm mb-1" style={{ color: "#1a0a00" }}>{selectedBooking.eventTitle}</p>
                            <p className="text-xs mb-1" style={{ color: "#78716c" }}>{selectedBooking.tierName} × {selectedBooking.quantity} · {selectedBooking.eventDate}</p>
                            <p className="text-xs font-mono mb-4 px-4 py-2 rounded-lg" style={{ background: "rgba(249,115,22,0.06)", color: "#92400e" }}>{selectedBooking.qrCode}</p>
                            <p className="text-xs mb-4" style={{ color: "#78716c" }}>Show this QR code at the venue entrance for scanning.</p>
                            <button
                                onClick={() => {
                                    if (selectedTicket) {
                                        const a = document.createElement("a");
                                        a.href = selectedTicket.qrDataUrl;
                                        a.download = `planzo-ticket-${selectedTicket.id}.png`;
                                        a.click();
                                    } else {
                                        closeModal();
                                    }
                                }}
                                className="w-full py-3 rounded-xl font-bold text-sm"
                                style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff" }}>
                                <Download size={14} className="inline mr-2" />{selectedTicket ? "Download QR" : "Download PDF"}
                            </button>
                        </div>
                    )}

                    {/* Cancel Confirmation Modal */}
                    {activeModal === "cancel" && selectedBooking && (
                        <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--color-bg-panel)", border: "1px solid rgba(248,113,113,0.3)" }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold" style={{ color: "#1a0a00" }}>Cancel Booking</h2>
                                <button onClick={closeModal}><X size={18} style={{ color: "#78716c" }} /></button>
                            </div>
                            <p className="text-sm mb-2" style={{ color: "#78716c" }}>Are you sure you want to cancel your booking for:</p>
                            <p className="text-sm font-bold mb-4" style={{ color: "#1a0a00" }}>{selectedBooking.eventTitle}</p>
                            <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)" }}>
                                <p className="text-xs" style={{ color: "#dc2626" }}>⚠️ Tickets are generally non-refundable. Please submit a refund request separately if eligible.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={closeModal} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }}>Keep Booking</button>
                                <button onClick={() => handleCancel(selectedBooking.id)} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: "rgba(220,38,38,0.9)", color: "#fff" }}>Yes, Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* Rate Event Modal */}
                    {activeModal === "rate" && selectedBooking && (
                        <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--color-bg-panel)", border: "1px solid rgba(249,115,22,0.25)" }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold" style={{ color: "#1a0a00" }}>Rate This Event</h2>
                                <button onClick={closeModal}><X size={18} style={{ color: "#78716c" }} /></button>
                            </div>
                            <p className="text-sm mb-4 font-medium" style={{ color: "#1a0a00" }}>{selectedBooking.eventTitle}</p>
                            <form onSubmit={handleRatingSubmit} className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium mb-2" style={{ color: "#92400e" }}>Your Rating</p>
                                    <div className="flex gap-2 mb-1">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <button key={n} type="button"
                                                onMouseEnter={() => setRatingHover(n)}
                                                onMouseLeave={() => setRatingHover(0)}
                                                onClick={() => setRating(n)}
                                                className="text-2xl transition-transform hover:scale-125"
                                                style={{ color: n <= (ratingHover || rating) ? "#f97316" : "#e5e7eb", background: "none", border: "none", cursor: "pointer" }}>
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs" style={{ color: "#78716c" }}>{rating === 0 ? "Select a rating" : ["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Your Review</label>
                                    <textarea rows={3} required maxLength={1000} value={review} onChange={(e) => setReview(e.target.value)} placeholder="Tell us about your experience..."
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                                        style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                                    <p className="text-[10px] mt-1" style={{ color: review.length > 950 ? "#dc2626" : "#78716c" }}>{review.length}/1000</p>
                                </div>
                                {ratingError && (
                                    <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
                                        <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
                                        <p className="text-xs" style={{ color: "#991b1b" }}>{ratingError}</p>
                                    </div>
                                )}
                                <button type="submit" disabled={rating === 0 || ratingSubmitting || !review.trim()} className="w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                                    style={{ background: rating > 0 && review.trim() ? "linear-gradient(135deg,#f97316,#ef4444)" : "rgba(249,115,22,0.2)", color: "#fff", opacity: rating === 0 || !review.trim() ? 0.6 : 1 }}>
                                    {ratingSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Star size={14} /> Submit Rating</>}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Refund Request Modal */}
                    {activeModal === "refund" && selectedBooking && (
                        <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--color-bg-panel)", border: "1px solid rgba(96,165,250,0.3)" }}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-bold" style={{ color: "#1a0a00" }}>Request Refund</h2>
                                <button onClick={closeModal}><X size={18} style={{ color: "#78716c" }} /></button>
                            </div>
                            <p className="text-sm mb-1 font-medium" style={{ color: "#1a0a00" }}>{selectedBooking.eventTitle}</p>
                            <p className="text-xs mb-4" style={{ color: "#78716c" }}>{selectedBooking.tierName} × {selectedBooking.quantity} · <span style={{ color: "#f97316", fontWeight: 700 }}>${selectedBooking.total}</span></p>
                            <form onSubmit={handleRefundSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Reason for Refund</label>
                                    <select value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                        style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }}>
                                        <option>Unable to attend</option>
                                        <option>Event cancelled by organizer</option>
                                        <option>Medical emergency</option>
                                        <option>Duplicate purchase</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "#92400e" }}>Additional Notes (optional)</label>
                                    <textarea rows={3} value={refundNote} onChange={(e) => setRefundNote(e.target.value)} placeholder="Provide any additional details..."
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                                        style={{ background: "var(--color-bg-raised)", border: "1px solid rgba(249,115,22,0.2)", color: "#1a0a00" }} />
                                </div>
                                <button type="submit" disabled={refundLoading} className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                    style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff" }}>
                                    {refundLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><RefreshCw size={14} /> Submit Refund Request</>}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
