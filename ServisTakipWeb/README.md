# ServisTakipWeb

Firma ve yönetici (Admin) hesapları için web tabanlı yönetim paneli. React + TypeScript
(.tsx) + Vite ile yazıldı, `ServisTakipApi` üzerinden çalışır.

## Kurulum

```bash
cd ServisTakipWeb
npm install
cp .env.example .env   # API adresini gerekirse düzenleyin
npm run dev
```

`.env` içindeki `VITE_API_BASE_URL` varsayılan olarak yayındaki API'ye
(`https://servis-takip-api-anir.onrender.com/api`) işaret eder. Backend'i kendi
bilgisayarınızda çalıştıracaksanız `ServisTakipApi/Properties/launchSettings.json`
dosyasındaki portu kullanarak bu değeri `https://localhost:xxxx/api` olarak değiştirin.

## Giriş

Panelde iki rol var:

- **Firma** → `/company` altındaki panel: profil, şoförler, araçlar, rotalar.
- **Admin** → `/admin` altındaki panel: firmalar, kullanıcılar.

Yolcu/Şoför rolündeki hesaplar (mobil uygulama kullanıcıları) bu panele giriş
yapamaz; giriş ekranı bu durumu tespit edip uyarı gösterir.

Mobil uygulamanın kodunu incelediğimde firma kaydının (`POST /company/register`)
**kimliği doğrulanmış bir Firma/Admin token'ı gerektirdiğini** gördüm — yani genel bir
"firmanı kaydet" ekranı yok. Bu yüzden yeni firma oluşturma işlemini bilerek sadece
Admin panelindeki "Firmalar" sekmesine koydum.

## Backend'de yapılan değişiklikler (önemli)

`ServisTakipApi` incelendiğinde listeleme (GET) uçlarının bir kısmının eksik olduğu
görüldü — CRUD'un "Read" kısmı olmadan panelde tablo gösterip düzenleme/silme yapmak
mümkün değildi. Bu nedenle backend'e şu **minimal, mevcut mimariyle tutarlı** eklemeler
yapıldı (ayrı bir zip olarak birlikte teslim edildi):

| Endpoint | Amaç |
|---|---|
| `GET /api/company/drivers` | Giriş yapan firmanın şoförlerini listeler |
| `GET /api/route` | Giriş yapan firmanın rotalarını listeler |
| `GET /api/admin/companies` | *(Admin)* Tüm firmaları listeler |
| `DELETE /api/admin/companies/{id}` | *(Admin)* Firma siler (soft delete) |
| `GET /api/admin/users` | *(Admin)* Tüm kullanıcıları listeler |
| `DELETE /api/admin/users/{id}` | *(Admin)* Kullanıcı siler (soft delete, mevcut `UserService.DeleteUserAsync` kullanılıyor) |

Ayrıca `Program.cs`'teki CORS politikası düzeltildi: `WithOrigins("http://localhost:*")`
gibi joker karakterli origin'ler .NET'te literal string olarak karşılaştırıldığı için
aslında hiçbir portu eşleştirmiyordu. Artık `localhost`/`127.0.0.1`/LAN origin'lerini
port fark etmeksizin kabul eden bir `SetIsOriginAllowed` kullanıyor. **Web panelini
kendi alan adınızda yayına alırsanız o origin'i de bu listeye eklemeniz gerekir.**

Bu değişiklikleri API projenize uygulamadan paneldeki listeleme sayfaları
(Şoförler, Rotalar, Admin/Firmalar, Admin/Kullanıcılar) 404/yetkisiz hatası alır.

## Bilinen sınırlamalar

- **Firma profili önceden doldurulamıyor.** API'de "giriş yapan firmanın kendi
  bilgilerini getir" uç noktası yok; `Firma Profili` sayfası doğrudan güncelleme
  (PUT) gönderen boş bir formdur. İstenirse `GET /api/company/profile` eklenebilir.
- **Admin, yeni Admin/Firma-dışı kullanıcı oluşturamıyor.** `UserController.Register`
  her zaman `Yolcu` rolü atıyor; panelden farklı rollerde kullanıcı oluşturmak için
  backend'de ayrı bir uç nokta gerekir.
- Silme işlemleri "soft delete" (`Deleted = true`) olarak yapılır, veritabanından
  fiziksel olarak silinmez — mevcut mimariyle tutarlı.

## Proje yapısı

```
src/
  lib/          axios istemcisi, JWT çözümleme, Auth/Toast context'leri
  components/   paylaşılan UI (Layout, Modal, ConfirmDialog, EmptyState, ...)
  pages/
    LoginPage.tsx
    company/    Genel Bakış, Profil, Şoförler, Araçlar, Rotalar
    admin/      Genel Bakış, Firmalar, Kullanıcılar
  types.ts      Backend DTO'larıyla birebir eşleşen TypeScript tipleri
```

## Derleme

```bash
npm run build
```

`tsc -b && vite build` çalıştırır, çıktı `dist/` klasörüne yazılır.
