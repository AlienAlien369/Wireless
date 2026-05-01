namespace RSSBWireless.API.Middleware;

public class RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            await next(ctx);
        }
        finally
        {
            sw.Stop();
            logger.LogInformation(
                "{Method} {Path} {StatusCode} {ElapsedMs}ms",
                ctx.Request.Method, ctx.Request.Path,
                ctx.Response.StatusCode, sw.ElapsedMilliseconds);
        }
    }
}
