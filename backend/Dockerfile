FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["src/SchoolERP.API/SchoolERP.API.csproj", "src/SchoolERP.API/"]
COPY ["src/SchoolERP.Application/SchoolERP.Application.csproj", "src/SchoolERP.Application/"]
COPY ["src/SchoolERP.Domain/SchoolERP.Domain.csproj", "src/SchoolERP.Domain/"]
COPY ["src/SchoolERP.Infrastructure/SchoolERP.Infrastructure.csproj", "src/SchoolERP.Infrastructure/"]
RUN dotnet restore "src/SchoolERP.API/SchoolERP.API.csproj"
COPY . .
RUN dotnet publish "src/SchoolERP.API/SchoolERP.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser
COPY --from=build /app/publish .
# Create the uploads directory with correct ownership before dropping privileges.
# The named Docker volume will be mounted here; creating it in the image ensures
# the directory exists even on first run before the volume is populated.
RUN mkdir -p /app/private-uploads && chown -R appuser:appgroup /app
USER appuser
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "SchoolERP.API.dll"]
