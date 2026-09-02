FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["ServisTakipApi.csproj", "./"]
RUN dotnet restore "ServisTakipApi.csproj"

COPY . .
RUN dotnet clean "ServisTakipApi.csproj"
RUN dotnet publish "ServisTakipApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV DOTNET_gcServer=0
ENV DOTNET_gcConcurrent=0
ENV DOTNET_EnableDiagnostics=0
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "ServisTakipApi.dll"]