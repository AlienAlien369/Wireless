namespace RSSBWireless.API.Helpers;
using Twilio;
using Twilio.Rest.Api.V2010.Account;

public class SmsHelper
{
    private readonly IConfiguration _config;
    public SmsHelper(IConfiguration config)
    {
        _config = config;
        TwilioClient.Init(config["Twilio:AccountSid"], config["Twilio:AuthToken"]);
    }
    public async Task<(bool Success, string? Error)> SendSmsAsync(string to, string message)
    {
        try
        {
            await MessageResource.CreateAsync(
                body: message,
                from: new Twilio.Types.PhoneNumber(_config["Twilio:FromNumber"]),
                to: new Twilio.Types.PhoneNumber(to));
            return (true, null);
        }
        catch (Exception ex) { return (false, ex.Message); }
    }
}
