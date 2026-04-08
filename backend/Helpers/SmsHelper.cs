using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace RSSBWireless.API.Helpers;

public class SmsHelper
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly string _mode;
    private readonly ILogger<SmsHelper> _logger;

    public SmsHelper(
        HttpClient httpClient, 
        IConfiguration config,
        ILogger<SmsHelper> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
        _mode = _config["SmsGateway:Mode"] ?? "Cloud";
        
        ConfigureHttpClient();
    }

    private void ConfigureHttpClient()
    {
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
        
        // Clear any default headers
        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        if (_mode == "Cloud")
        {
            var token = _config["SmsGateway:Cloud:Token"] ?? "";
            _logger.LogInformation("Configuring Traccar Cloud mode. Token length: {Length}", token.Length);
            
            if (!string.IsNullOrEmpty(token))
            {
                // Use TryAddWithoutValidation for tokens with special characters
                _httpClient.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);
            }
        }
        else
        {
            _logger.LogInformation("Configuring Traccar Local mode");
        }
    }

    public async Task<(bool Success, string? Error)> SendSmsAsync(string phoneNumber, string message)
    {
        try
        {
            var baseUrl = (_mode == "Cloud" 
                ? _config["SmsGateway:Cloud:BaseUrl"] 
                : _config["SmsGateway:Local:BaseUrl"])?.Trim() ?? "";

            if (string.IsNullOrEmpty(baseUrl))
            {
                return (false, "SMS Gateway URL not configured");
            }

            // Remove trailing slash
            baseUrl = baseUrl.TrimEnd('/');

            // Format phone number
            phoneNumber = FormatPhoneNumber(phoneNumber);
            
            _logger.LogInformation("Sending SMS to {Phone} via Traccar {Mode}. URL: {Url}", 
                phoneNumber, _mode, baseUrl);

            // Build request
            var (url, payload) = BuildRequest(baseUrl, phoneNumber, message);
            
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _logger.LogInformation("SMS Request - URL: {Url}, Body: {Body}", url, json);

            var response = await _httpClient.PostAsync(url, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("SMS Response - Status: {Status}, Body: {Body}", 
                (int)response.StatusCode, responseBody);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("SMS sent successfully to {PhoneNumber}", phoneNumber);
                return (true, null);
            }
            else
            {
                _logger.LogError("Traccar SMS failed: HTTP {StatusCode} - {Response}", 
                    (int)response.StatusCode, responseBody);
                
                var errorMsg = (int)response.StatusCode switch
                {
                    401 => "Invalid Traccar token - check your Cloud Token in the app",
                    403 => "Forbidden - token may be expired or invalid",
                    404 => "Traccar endpoint not found",
                    400 => $"Bad request: {responseBody}",
                    500 => $"Traccar server error: {responseBody}",
                    _ => $"HTTP {(int)response.StatusCode}: {responseBody}"
                };
                
                return (false, errorMsg);
            }
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
        {
            _logger.LogError("Traccar SMS request timed out");
            return (false, "Request timeout - check network connectivity");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Network error sending SMS via Traccar");
            return (false, $"Network error: {ex.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SMS sending failed via Traccar");
            return (false, ex.Message);
        }
    }

    private (string Url, object Payload) BuildRequest(string baseUrl, string phoneNumber, string message)
    {
        if (_mode == "Cloud")
        {
            // Cloud mode: Token in header, simple JSON payload
            var payload = new
            {
                to = phoneNumber,
                message = message
            };
            
            return (baseUrl, payload);
        }
        else
        {
            var apiKey = _config["SmsGateway:Local:ApiKey"] ?? "";
            
            // Local mode: API key in body
            var payload = new
            {
                to = phoneNumber,
                message = message,
                token = apiKey
            };
            
            return (baseUrl, payload);
        }
    }

    private static string FormatPhoneNumber(string phoneNumber)
    {
        // Remove all non-digit characters except +
        phoneNumber = new string(phoneNumber.Where(c => char.IsDigit(c) || c == '+').ToArray());
        
        // Remove spaces, dashes, etc.
        phoneNumber = phoneNumber.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "");
        
        // Ensure + prefix for international format
        if (!phoneNumber.StartsWith("+"))
        {
            if (phoneNumber.StartsWith("0"))
            {
                phoneNumber = phoneNumber.TrimStart('0');
            }
            
            // Add country code (assuming India +91 for 10 digit numbers)
            if (phoneNumber.Length == 10)
            {
                phoneNumber = "+91" + phoneNumber;
            }
            else
            {
                phoneNumber = "+" + phoneNumber;
            }
        }
        
        return phoneNumber;
    }
}