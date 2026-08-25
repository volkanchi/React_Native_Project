FROM --platform=linux/amd64 mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["ServisTakipApi.csproj", "./"]
RUN dotnet restore "ServisTakipApi.csproj"

COPY . .
RUN dotnet publish "ServisTakipApi.csproj" -c Release -o /app/publish

FROM --platform=linux/amd64 mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "ServisTakipApi.dll"]