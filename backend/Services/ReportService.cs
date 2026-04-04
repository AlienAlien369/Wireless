namespace RSSBWireless.API.Services;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.Kernel.Colors;
using RSSBWireless.API.Data;
using RSSBWireless.API.DTOs;

public class ReportService
{
    private readonly AppDbContext _db;
    public ReportService(AppDbContext db) => _db = db;

    public async Task<List<VisitWiseDashboardDto>> GetVisitWiseDashboardAsync()
    {
        var visits = await _db.Visits
            .Include(v => v.Issues)
            .OrderByDescending(v => v.VisitDate)
            .ToListAsync();

        var result = new List<VisitWiseDashboardDto>();
        foreach (var visit in visits)
        {
            var issues = visit.Issues;
            result.Add(new VisitWiseDashboardDto
            {
                VisitName = visit.Name,
                TotalIssued = issues.Count,
                TotalReturned = issues.Count(i => i.Status == "Returned"),
                CurrentlyIssued = issues.Count(i => i.Status == "Issued"),
                PartiallyReturned = issues.Count(i => i.Status == "Partial")
            });
        }

        return result;
    }

    public async Task<byte[]> GenerateVisitExcelReportAsync(int visitId)
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        var visit = await _db.Visits.FindAsync(visitId) ?? throw new KeyNotFoundException();
        var issues = await _db.Issues
            .Include(i => i.Incharge).Include(i => i.Items).ThenInclude(ii => ii.WirelessSet)
            .Include(i => i.Items).ThenInclude(ii => ii.Charger)
            .Where(i => i.VisitId == visitId)
            .ToListAsync();

        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("Issuance Report");

        // Header
        ws.Cells[1, 1].Value = $"Visit: {visit.Name} — Issuance Report";
        ws.Cells[1, 1, 1, 8].Merge = true;
        ws.Cells[1, 1].Style.Font.Bold = true;
        ws.Cells[1, 1].Style.Font.Size = 14;

        var headers = new[] { "Sr.", "Incharge", "Badge", "Mobile", "Items", "Status", "Issued At", "Returned At" };
        for (int c = 0; c < headers.Length; c++)
        {
            ws.Cells[3, c + 1].Value = headers[c];
            ws.Cells[3, c + 1].Style.Font.Bold = true;
            ws.Cells[3, c + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
            ws.Cells[3, c + 1].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.SteelBlue);
            ws.Cells[3, c + 1].Style.Font.Color.SetColor(System.Drawing.Color.White);
        }

        int row = 4;
        int sr = 1;
        foreach (var issue in issues)
        {
            var items = string.Join(", ", issue.Items.Select(ii => ii.WirelessSet?.ItemNumber ?? ii.Charger?.ItemNumber ?? "Kit"));
            ws.Cells[row, 1].Value = sr++;
            ws.Cells[row, 2].Value = issue.Incharge?.Name;
            ws.Cells[row, 3].Value = issue.Incharge?.BadgeNumber;
            ws.Cells[row, 4].Value = issue.Incharge?.MobileNumber;
            ws.Cells[row, 5].Value = issue.IsGroupIssue ? $"Group ({issue.GroupSetCount} sets)" : items;
            ws.Cells[row, 6].Value = issue.Status;
            ws.Cells[row, 7].Value = issue.IssuedAt.ToString("dd/MM/yyyy HH:mm");
            ws.Cells[row, 8].Value = issue.ReturnedAt?.ToString("dd/MM/yyyy HH:mm") ?? "-";
            row++;
        }

        ws.Cells[ws.Dimension.Address].AutoFitColumns();
        return package.GetAsByteArray();
    }

    public async Task<byte[]> GenerateInventoryExcelReportAsync()
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
        var sets = await _db.WirelessSets.OrderBy(w => w.Brand).ThenBy(w => w.ItemNumber).ToListAsync();

        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add("Inventory");
        ws.Cells[1, 1].Value = "RSSB Wireless Inventory Report";
        ws.Cells[1, 1, 1, 5].Merge = true;
        ws.Cells[1, 1].Style.Font.Bold = true;

        var headers = new[] { "Sr.", "Item Number", "Brand", "Status", "Remarks" };
        for (int c = 0; c < headers.Length; c++)
        {
            ws.Cells[3, c + 1].Value = headers[c];
            ws.Cells[3, c + 1].Style.Font.Bold = true;
            ws.Cells[3, c + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
            ws.Cells[3, c + 1].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.SteelBlue);
            ws.Cells[3, c + 1].Style.Font.Color.SetColor(System.Drawing.Color.White);
        }

        int row = 4;
        for (int i = 0; i < sets.Count; i++)
        {
            ws.Cells[row, 1].Value = i + 1;
            ws.Cells[row, 2].Value = sets[i].ItemNumber;
            ws.Cells[row, 3].Value = sets[i].Brand;
            ws.Cells[row, 4].Value = sets[i].Status;
            ws.Cells[row, 5].Value = sets[i].Remarks;
            // Color code by status
            var color = sets[i].Status switch
            {
                "Issued" => System.Drawing.Color.LightYellow,
                "Broken" => System.Drawing.Color.LightCoral,
                _ => System.Drawing.Color.LightGreen
            };
            ws.Cells[row, 1, row, 5].Style.Fill.PatternType = ExcelFillStyle.Solid;
            ws.Cells[row, 1, row, 5].Style.Fill.BackgroundColor.SetColor(color);
            row++;
        }
        ws.Cells[ws.Dimension.Address].AutoFitColumns();
        return package.GetAsByteArray();
    }

    public async Task<byte[]> GenerateBreakagePdfReportAsync(int? visitId = null)
    {
        var query = _db.Breakages.Include(b => b.Visit).AsQueryable();
        if (visitId.HasValue) query = query.Where(b => b.VisitId == visitId);
        var breakages = await query.OrderByDescending(b => b.ReportedAt).ToListAsync();

        using var ms = new MemoryStream();
        var writer = new PdfWriter(ms);
        var pdf = new PdfDocument(writer);
        var doc = new Document(pdf);

        doc.Add(new Paragraph("RSSB Wireless — Breakage Report")
            .SetFontSize(18).SimulateBold()
            .SetFontColor(ColorConstants.DARK_GRAY));
        doc.Add(new Paragraph($"Generated: {DateTime.UtcNow:dd/MM/yyyy HH:mm}").SetFontSize(10));
        doc.Add(new Paragraph("\n"));

        var table = new Table(new float[] { 1, 2, 2, 3, 2, 2 });
        table.SetWidth(iText.Layout.Properties.UnitValue.CreatePercentValue(100));

        foreach (var h in new[] { "Sr.", "Visit", "Item#", "Reason", "Reported By", "Date" })
        {
            table.AddHeaderCell(new Cell().Add(new Paragraph(h).SimulateBold())
                .SetBackgroundColor(ColorConstants.LIGHT_GRAY));
        }

        int sr = 1;
        foreach (var b in breakages)
        {
            table.AddCell(new Cell().Add(new Paragraph(sr++.ToString())));
            table.AddCell(new Cell().Add(new Paragraph(b.Visit?.Name ?? "")));
            table.AddCell(new Cell().Add(new Paragraph(b.ItemNumber)));
            table.AddCell(new Cell().Add(new Paragraph(b.BreakageReason)));
            table.AddCell(new Cell().Add(new Paragraph(b.ReportedBy)));
            table.AddCell(new Cell().Add(new Paragraph(b.ReportedAt.ToString("dd/MM/yyyy"))));
        }

        doc.Add(table);
        doc.Close();
        return ms.ToArray();
    }
}
