namespace RSSBWireless.API.Services.Interfaces;

using RSSBWireless.API.DTOs;

public interface IReportService
{
    Task<List<VisitWiseDashboardDto>> GetVisitWiseDashboardAsync(CancellationToken cancellationToken = default);
    Task<byte[]> GenerateVisitExcelReportAsync(int visitId, CancellationToken cancellationToken = default);
    Task<byte[]> GenerateInventoryExcelReportAsync(CancellationToken cancellationToken = default);
    Task<byte[]> GenerateBreakagePdfReportAsync(int? visitId = null, CancellationToken cancellationToken = default);
}
