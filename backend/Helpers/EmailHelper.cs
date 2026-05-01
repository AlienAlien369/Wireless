namespace RSSBWireless.API.Helpers;

using System.Net;
using System.Net.Mail;

public class EmailHelper
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailHelper> _logger;

    public EmailHelper(IConfiguration config, ILogger<EmailHelper> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<(bool Success, string? Error)> SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            var host = _config["Smtp:Host"] ?? "";
            var portStr = _config["Smtp:Port"] ?? "";
            var username = _config["Smtp:Username"] ?? "";
            var password = _config["Smtp:Password"] ?? "";
            var from = _config["Smtp:From"] ?? username;

            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
                return (false, "SMTP not configured");

            var port = 587;
            if (!string.IsNullOrWhiteSpace(portStr) && int.TryParse(portStr, out var p)) port = p;

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = true,
                Credentials = string.IsNullOrWhiteSpace(username) ? CredentialCache.DefaultNetworkCredentials : new NetworkCredential(username, password),
            };

            using var message = new MailMessage(from, to, subject, body);
            await client.SendMailAsync(message);
            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Email sending failed");
            return (false, ex.Message);
        }
    }
}

