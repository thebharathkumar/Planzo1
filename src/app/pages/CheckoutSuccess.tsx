import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useAuth, useCart, useEvents, useTickets } from "../store";
import { buildTicketPayload, IssuedTicket, newId, renderQrDataUrl } from "../lib/tickets";
import { apiFetch } from "../lib/api";
import { PENDING_CHECKOUT_KEY } from "./Checkout";

interface PendingCheckout {
    items: Array<{
        eventId: string;
        eventTitle: string;
        tierId: string;
        tierName: string;
        price: number;
        quantity: number;
    }>;
    user: { id: string; name: string } | null;
    createdAt: number;
}

export function CheckoutSuccess() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { clearCart } = useCart();
    const { currentUser } = useAuth();
    const { events } = useEvents();
    const { addTickets } = useTickets();
    const sessionId = params.get("session_id");

    const [issued, setIssued] = useState<IssuedTicket[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            const raw = window.localStorage.getItem(PENDING_CHECKOUT_KEY);
            if (!raw) {
                setError("No pending order found in this browser. If you've already viewed this page, your tickets are saved under My Tickets.");
                setLoading(false);
                return;
            }
            let pending: PendingCheckout;
            try {
                pending = JSON.parse(raw);
            } catch {
                setError("Could not read your pending order.");
                setLoading(false);
                return;
            }

            const userId = pending.user?.id || currentUser?.id || "guest";
            const userName = pending.user?.name || currentUser?.name || "Guest";
            const bookingId = newId("BK");
            const issuedAt = Date.now();

            const newTickets: IssuedTicket[] = [];
            for (const item of pending.items) {
                const event = events.find((e) => e.id === item.eventId);
                for (let i = 0; i < item.quantity; i++) {
                    const ticketId = newId("TK");
                    const payload = buildTicketPayload({
                        v: 1,
                        id: ticketId,
                        bookingId,
                        eventId: item.eventId,
                        userId,
                        issuedAt,
                    });
                    const qrDataUrl = await renderQrDataUrl(payload);
                    newTickets.push({
                        id: ticketId,
                        bookingId,
                        eventId: item.eventId,
                        eventTitle: item.eventTitle,
                        eventDate: event?.date ?? "TBD",
                        eventVenue: event?.venue ?? "TBD",
                        tierId: item.tierId,
                        tierName: item.tierName,
                        price: item.price,
                        userId,
                        userName,
                        qrPayload: payload,
                        qrDataUrl,
                        status: "valid",
                        issuedAt: new Date(issuedAt).toISOString(),
                        stripeSessionId: sessionId ?? undefined,
                    });
                }
            }

            if (cancelled) return;
            addTickets(newTickets);
            setIssued(newTickets);

            // Persist booking to Redis so analytics can pick it up.
            // Group tickets by event so each booking record holds the full quantity.
            const byEvent = new Map<string, IssuedTicket[]>();
            for (const t of newTickets) {
                const list = byEvent.get(t.eventId) ?? [];
                list.push(t);
                byEvent.set(t.eventId, list);
            }
            await Promise.all(
                Array.from(byEvent.values()).map((group) => {
                    const head = group[0];
                    return apiFetch("/api/bookings/record", {
                        method: "POST",
                        user: currentUser,
                        body: JSON.stringify({
                            bookingId: head.bookingId,
                            eventId: head.eventId,
                            eventTitle: head.eventTitle,
                            eventDate: head.eventDate,
                            eventVenue: head.eventVenue,
                            tierId: head.tierId,
                            tierName: head.tierName,
                            quantity: group.length,
                            total: group.reduce((s, t) => s + t.price, 0),
                            stripeSessionId: head.stripeSessionId,
                        }),
                    }).catch(() => null);
                })
            );

            window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
            clearCart();
            setLoading(false);
        }
        run().catch((err) => {
            setError(err instanceof Error ? err.message : "Could not issue tickets");
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div style={{ paddingTop: 68, minHeight: "100vh", background: "var(--color-bg-base)" }} className="flex items-center justify-center px-6 py-10">
            <div className="text-center max-w-2xl w-full">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(249,115,22,0.18)", border: "2px solid #f97316" }}>
                    <CheckCircle size={36} style={{ color: "#f97316" }} />
                </div>
                <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Outfit',sans-serif", color: "#1a0a00" }}>Payment Successful!</h1>
                <p className="text-sm mb-6" style={{ color: "#78716c" }}>Your tickets have been issued. A receipt has been sent to your email by Stripe.</p>

                {loading && (
                    <div className="p-6 rounded-2xl mb-6 flex items-center justify-center gap-3" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.25)" }}>
                        <div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm" style={{ color: "#78716c" }}>Generating your QR tickets…</span>
                    </div>
                )}

                {error && !loading && (
                    <div className="p-4 rounded-2xl mb-6 flex items-start gap-3 text-left" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
                        <AlertCircle size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
                        <p className="text-xs" style={{ color: "#991b1b" }}>{error}</p>
                    </div>
                )}

                {!loading && issued.length > 0 && (
                    <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: issued.length > 1 ? "repeat(auto-fit, minmax(220px, 1fr))" : "1fr" }}>
                        {issued.map((t) => (
                            <div key={t.id} className="p-5 rounded-2xl text-left" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.25)" }}>
                                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#f97316" }}>QR Ticket</p>
                                <div className="rounded-xl mb-3 flex items-center justify-center p-2" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)" }}>
                                    <img src={t.qrDataUrl} alt="Ticket QR code" className="w-full max-w-[180px] h-auto" />
                                </div>
                                <p className="font-bold text-sm mb-1 line-clamp-1" style={{ color: "#1a0a00" }}>{t.eventTitle}</p>
                                <p className="text-xs mb-1" style={{ color: "#78716c" }}>{t.tierName} · {t.eventDate}</p>
                                <p className="text-[10px] font-mono break-all" style={{ color: "#92400e" }}>{t.id}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-3 justify-center">
                    <button onClick={() => navigate("/my-tickets")} className="px-6 py-3 rounded-xl font-bold text-sm" style={{ background: "linear-gradient(135deg,#f97316,#ef4444)", color: "#fff8f4" }}>
                        View My Tickets
                    </button>
                    <button onClick={() => navigate("/")} className="px-6 py-3 rounded-xl font-medium text-sm" style={{ background: "var(--color-bg-card)", border: "1px solid rgba(249,115,22,0.2)", color: "#92400e" }}>
                        Discover More
                    </button>
                </div>
            </div>
        </div>
    );
}
