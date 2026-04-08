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

    public SmsHelper(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _config = config;
        _mode = _config["SmsGateway:Mode"] ?? "Local";
        
        ConfigureHttpClient();
    }

    private void ConfigureHttpClient()
    {
        if (_mode == "Local")
        {
            // Local Server uses Basic Authentication [^3^]
            var username = _config["SmsGateway:Local:Username"]!;
            var password = _config["SmsGateway:Local:Password"]!;
            var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{username}:{password}"));
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        }
        else
        {
            // Cloud uses JWT Bearer Token [^7^]
            var token = _config["SmsGateway:Cloud:Token"]!;
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }
    }

    public async Task<(bool Success, string? Error)> SendSmsAsync(string phoneNumber, string message)
    {
        try
        {
            var baseUrl = _mode == "Local" 
                ? _config["SmsGateway:Local:BaseUrl"]! 
                : _config["SmsGateway:Cloud:BaseUrl"]!;

            // SMS Gateway API endpoint [^3^][^7^]
            var url = $"{baseUrl}/message";

            // Format phone number (ensure + prefix for international format)
            if (!phoneNumber.StartsWith("+"))
            {
                phoneNumber = "+" + phoneNumber.TrimStart('0');
            }

            var payload = new
            {
                textMessage = new
                {
                    text = message
                },
                phoneNumbers = new[] { phoneNumber }
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                return (true, null);
            }
            else
            {
                return (false, $"HTTP {(int)response.StatusCode}: {responseBody}");
            }
        }
        catch (Exception ex)
        {
            return (false, ex.Message);
        }
    }
}