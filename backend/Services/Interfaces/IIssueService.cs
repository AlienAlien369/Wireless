namespace RSSBWireless.API.Services.Interfaces;

using RSSBWireless.API.DTOs;

public interface IIssueService
{
    Task<IssueResponseDto> CreateIssueAsync(IssueCreateDto dto, string issuedBy, int? centerId, int? departmentId, CancellationToken cancellationToken = default);
    Task<IssueResponseDto> GetIssueByIdAsync(int id, int? centerId = null, int? departmentId = null, bool strictDepartment = false, CancellationToken cancellationToken = default);
    Task<List<IssueResponseDto>> GetIssuesByVisitAsync(int visitId, int? centerId = null, int? departmentId = null, bool strictDepartment = false, CancellationToken cancellationToken = default);
    Task ReturnIssueAsync(int issueId, List<int> returnedItemIds, bool sendSms = false, CancellationToken cancellationToken = default);
}
