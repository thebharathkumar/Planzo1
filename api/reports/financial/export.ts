import type { VercelRequest, VercelResponse } from "@vercel/node";
import Papa from "papaparse";
import PDFDocument from "pdfkit";
import { getRedis } from "../../_lib/redis";
import { bad } from "../../_lib/respond";
import { requireRole } from "../../_lib/auth";

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
    generatedAt: string;
}

const FINANCE_ROLES: ("finance" | "accountant" | "admin")[] = ["finance", "accountant", "admin"];

function fmt(n: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return bad(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
    }

    let user;
    try {
        user = requireRole(req, FINANCE_ROLES);
    } catch (err) {
        const e = err as Error & { status?: number; code?: string };
        return bad(res, e.status ?? 403, e.code ?? "FORBIDDEN", e.message);
    }

    const id = (req.query.id as string) || "";
    const format = ((req.query.format as string) || "csv").toLowerCase();
    if (!id) return bad(res, 400, "INVALID_ID", "id is required");
    if (format !== "csv" && format !== "pdf") return bad(res, 400, "INVALID_FORMAT", "format must be csv or pdf");

    const redis = getRedis();
    const report = await redis.get<FinancialReport>(`report:${id}`);
    if (!report) return bad(res, 404, "NOT_FOUND", "Report not found or expired");

    // DF-Out: data governance — exports include only IDs/labels, not user PII
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
        return res.status(200).send(csv);
    }

    // PDF
    try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];
        doc.on("data", (c) => chunks.push(c as Buffer));
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
        return res.status(200).send(buffer);
    } catch (pdfErr) {
        // CN: queue retry on PDF failure
        const retryToken = `retry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        await redis.lpush("export:retry", { reportId: id, format: "pdf", retryToken, requestedBy: user.id, at: new Date().toISOString() });
        return res.status(202).json({ status: "queued", retryToken, message: "Export service unavailable, retry queued" });
    }
}
