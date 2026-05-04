import type { VercelRequest, VercelResponse } from "@vercel/node";
import Papa from "papaparse";
import PDFDocument from "pdfkit";
import { getRedis } from "../_lib/redis";
import { handle, bad } from "../_lib/respond";
import { requireRole } from "../_lib/auth";
import { ensureSeed } from "../_lib/seed";

interface StoredEvent {
    id: string;
    title: string;
    organizer: string;
    organizerId: string;
    category: string;
}

interface StoredBooking {
    id: string;
    eventId: string;
    total: number;
    status: "confirmed" | "cancelled" | "pending";
    bookedAt: string;
}

interface ReportRow {
    key: string;
    label: string;
    bookingCount: number;
    gross: number;
    refunds: number;
    commission: number;
    net: number;
}

interface ReportTotals {
    bookingCount: number;
    gross: number;
    refunds: number;
    commission: number;
    net: number;
}

interface ReportRequest {
    startDate?: string;
    endDate?: string;
    eventIds?: string[];
    dimension?: "event" | "organizer" | "category";
}

interface FinancialReport {
    id: string;
    startDate: string;
    endDate: string;
    dimension: "event" | "organizer" | "category";
    rows: ReportRow[];
    totals: ReportTotals;
    formatted: { gross: string; refunds: string; commission: string; net: string };
    generatedBy: string;
    generatedAt: string;
}

const COMMISSION_RATE = 0.10;
const FINANCE_ROLES: ("finance" | "accountant" | "admin")[] = ["finance", "accountant", "admin"];

function err(status: number, code: string, message: string): never {
    const e = new Error(message) as Error & { status: number; code: string };
    e.status = status;
    e.code = code;
    throw e;
}

function fmt(n: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

async function generateReport(req: VercelRequest): Promise<FinancialReport> {
    const user = requireRole(req, FINANCE_ROLES);
    const body = (req.body ?? {}) as ReportRequest;
    const startDate = body.startDate || "2025-01-01";
    const endDate = body.endDate || new Date().toISOString().slice(0, 10);
    const dimension = body.dimension ?? "event";
    if (endDate < startDate) err(400, "INVALID_DATE_RANGE", "End date must not be before start date");

    const redis = getRedis();
    const eventIds = body.eventIds && body.eventIds.length > 0
        ? body.eventIds
        : ((await redis.smembers("events:all")) ?? []);

    const grouped: Record<string, ReportRow> = {};
    let totalGross = 0;
    let totalRefunds = 0;
    let totalBookings = 0;

    for (const eid of eventIds) {
        const event = await redis.get<StoredEvent>(`event:${eid}`);
        if (!event) continue;
        const bookingIds = (await redis.smembers(`bookings:byEvent:${eid}`)) ?? [];
        let eventGross = 0;
        let eventRefunds = Number((await redis.get(`event:${eid}:refunds`)) ?? 0);
        let eventBookings = 0;

        for (const bid of bookingIds) {
            const b = await redis.get<StoredBooking>(`booking:${bid}`);
            if (!b) continue;
            if (b.bookedAt < startDate || b.bookedAt > endDate) continue;
            if (b.status === "confirmed") {
                eventGross += b.total;
                eventBookings += 1;
            }
            if (b.status === "cancelled") {
                eventRefunds += b.total;
            }
        }

        if (eventBookings === 0) {
            const fallback = Number((await redis.get(`event:${eid}:revenue`)) ?? 0);
            if (fallback > 0) {
                eventGross = fallback;
                eventBookings = Number((await redis.get(`event:${eid}:ticketsSold`)) ?? 0);
            }
        }

        const key = dimension === "organizer" ? event.organizerId : dimension === "category" ? event.category : event.id;
        const label = dimension === "organizer" ? event.organizer : dimension === "category" ? event.category : event.title;
        if (!grouped[key]) {
            grouped[key] = { key, label, bookingCount: 0, gross: 0, refunds: 0, commission: 0, net: 0 };
        }
        grouped[key].bookingCount += eventBookings;
        grouped[key].gross += eventGross;
        grouped[key].refunds += eventRefunds;
        totalGross += eventGross;
        totalRefunds += eventRefunds;
        totalBookings += eventBookings;
    }

    const rows = Object.values(grouped)
        .map((row) => {
            const commission = Math.round(row.gross * COMMISSION_RATE * 100) / 100;
            const net = Math.round((row.gross - commission - row.refunds) * 100) / 100;
            return { ...row, gross: Math.round(row.gross * 100) / 100, refunds: Math.round(row.refunds * 100) / 100, commission, net };
        })
        .sort((a, b) => b.gross - a.gross);

    const totalCommission = Math.round(totalGross * COMMISSION_RATE * 100) / 100;
    const totalNet = Math.round((totalGross - totalCommission - totalRefunds) * 100) / 100;
    totalGross = Math.round(totalGross * 100) / 100;
    totalRefunds = Math.round(totalRefunds * 100) / 100;
    const totals: ReportTotals = { bookingCount: totalBookings, gross: totalGross, refunds: totalRefunds, commission: totalCommission, net: totalNet };

    const id = `rep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const report: FinancialReport = {
        id,
        startDate,
        endDate,
        dimension,
        rows,
        totals,
        formatted: { gross: fmt(totalGross), refunds: fmt(totalRefunds), commission: fmt(totalCommission), net: fmt(totalNet) },
        generatedBy: user.id,
        generatedAt: new Date().toISOString(),
    };

    await redis.set(`report:${id}`, report, { ex: 60 * 60 * 24 });
    return report;
}

async function exportReport(req: VercelRequest, res: VercelResponse): Promise<void> {
    let user;
    try {
        user = requireRole(req, FINANCE_ROLES);
    } catch (e) {
        const errObj = e as Error & { status?: number; code?: string };
        bad(res, errObj.status ?? 403, errObj.code ?? "FORBIDDEN", errObj.message);
        return;
    }

    const id = (req.query.id as string) || "";
    const format = ((req.query.format as string) || "csv").toLowerCase();
    if (!id) { bad(res, 400, "INVALID_ID", "id is required"); return; }
    if (format !== "csv" && format !== "pdf") { bad(res, 400, "INVALID_FORMAT", "format must be csv or pdf"); return; }

    const redis = getRedis();
    const report = await redis.get<FinancialReport>(`report:${id}`);
    if (!report) { bad(res, 404, "NOT_FOUND", "Report not found or expired"); return; }

    const safeRows = report.rows.map((r) => ({
        key: r.key,
        label: r.label,
        bookings: r.bookingCount,
        gross: r.gross,
        refunds: r.refunds,
        commission: r.commission,
        net: r.net,
    }));

    if (format === "csv") {
        const csv = Papa.unparse(safeRows, { header: true });
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="planzo-financial-${id}.csv"`);
        res.status(200).send(csv);
        return;
    }

    try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];
        doc.on("data", (c: Buffer) => chunks.push(c));
        const done = new Promise<void>((resolve, reject) => {
            doc.on("end", () => resolve());
            doc.on("error", reject);
        });

        doc.fontSize(20).text("Planzo Financial Report", { underline: true });
        doc.moveDown();
        doc.fontSize(10).text(`Report ID: ${report.id}`);
        doc.text(`Period: ${report.startDate} → ${report.endDate}`);
        doc.text(`Dimension: ${report.dimension}`);
        doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString("en-US")}`);
        doc.text(`Exported by: ${user.role.toUpperCase()}`);
        doc.moveDown();

        doc.fontSize(12).text("Totals", { underline: true });
        doc.fontSize(10);
        doc.text(`Bookings: ${report.totals.bookingCount}`);
        doc.text(`Gross: ${fmt(report.totals.gross)}`);
        doc.text(`Refunds: ${fmt(report.totals.refunds)}`);
        doc.text(`Commission (10%): ${fmt(report.totals.commission)}`);
        doc.text(`Net: ${fmt(report.totals.net)}`);
        doc.moveDown();

        doc.fontSize(12).text("Breakdown", { underline: true });
        doc.fontSize(9);
        for (const r of safeRows) {
            doc.text(`${r.label} — gross ${fmt(r.gross)}, refunds ${fmt(r.refunds)}, commission ${fmt(r.commission)}, net ${fmt(r.net)} (${r.bookings} bookings)`);
        }

        doc.end();
        await done;
        const buffer = Buffer.concat(chunks);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="planzo-financial-${id}.pdf"`);
        res.status(200).send(buffer);
    } catch {
        const retryToken = `retry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        await redis.lpush("export:retry", { reportId: id, format: "pdf", retryToken, requestedBy: user.id, at: new Date().toISOString() });
        res.status(202).json({ status: "queued", retryToken, message: "Export service unavailable, retry queued" });
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await ensureSeed();
    if (req.method === "POST") {
        return handle(res, () => generateReport(req));
    }
    if (req.method === "GET") {
        return exportReport(req, res);
    }
    res.setHeader("Allow", "GET, POST");
    return bad(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
}
