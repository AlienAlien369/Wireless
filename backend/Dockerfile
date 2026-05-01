FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Disable ASP.NET config-file hot-reload (inotify watchers) so the app does not
# exhaust the Linux per-user inotify instance limit (1024) on shared hosts like Render.
ENV DOTNET_hostBuilder__reloadConfigOnChange=false

EXPOSE 80
ENTRYPOINT ["dotnet", "RSSBWireless.API.dll"]
