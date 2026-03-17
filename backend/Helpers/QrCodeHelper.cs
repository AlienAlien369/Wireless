namespace RSSBWireless.API.Helpers;
using QRCoder;

public class QrCodeHelper
{
    private readonly IConfiguration _config;
    public QrCodeHelper(IConfiguration config) => _config = config;

    public string GenerateQrCodeBase64(string setNumber)
    {
        var domain = _config["AppSettings:Domain"] ?? "https://rssb-wireless.example.com";
        var url = $"{domain}/set/{setNumber}";
        using var qrGenerator = new QRCodeGenerator();
        var data = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(data);
        return Convert.ToBase64String(qrCode.GetGraphic(20));
    }
}
