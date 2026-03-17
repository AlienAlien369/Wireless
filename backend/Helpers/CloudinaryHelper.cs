namespace RSSBWireless.API.Helpers;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

public class CloudinaryHelper
{
    private readonly Cloudinary _cloudinary;
    public CloudinaryHelper(IConfiguration config)
    {
        var account = new Account(config["Cloudinary:CloudName"], config["Cloudinary:ApiKey"], config["Cloudinary:ApiSecret"]);
        _cloudinary = new Cloudinary(account);
    }
    public async Task<(string Url, string PublicId)> UploadImageAsync(IFormFile file)
    {
        using var stream = file.OpenReadStream();
        var result = await _cloudinary.UploadAsync(new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = "rssb-wireless",
            Transformation = new Transformation().Quality("auto").FetchFormat("auto")
        });
        return (result.SecureUrl.ToString(), result.PublicId);
    }
    public async Task DeleteImageAsync(string publicId)
        => await _cloudinary.DestroyAsync(new DeletionParams(publicId));
}
