namespace RSSBWireless.API.Middleware;

using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(ctx, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext ctx, Exception ex)
    {
        var traceId = ctx.TraceIdentifier;

        var (statusCode, title) = ex switch
        {
            KeyNotFoundException        => (StatusCodes.Status404NotFound,       "Resource Not Found"),
            UnauthorizedAccessException => (StatusCodes.Status403Forbidden,      "Forbidden"),
            ArgumentException           => (StatusCodes.Status400BadRequest,     "Bad Request"),
            InvalidOperationException   => (StatusCodes.Status400BadRequest,     "Bad Request"),
            _                          => (StatusCodes.Status500InternalServerError, "Internal Server Error")
        };

        if (statusCode == StatusCodes.Status500InternalServerError)
            logger.LogError(ex, "Unhandled exception. TraceId: {TraceId}", traceId);
        else
            logger.LogWarning(ex, "{Title}. TraceId: {TraceId}", title, traceId);

        var problem = new ProblemDetails
        {
            Status   = statusCode,
            Title    = title,
            Detail   = ex.Message,
            Instance = ctx.Request.Path
        };
        problem.Extensions["traceId"] = traceId;

        ctx.Response.ContentType = "application/problem+json";
        ctx.Response.StatusCode  = statusCode;

        await ctx.Response.WriteAsync(JsonSerializer.Serialize(problem, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
}
