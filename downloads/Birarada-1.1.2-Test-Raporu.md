# Birarada 1.1.2 — 25 Ekim 2026 doğrulama raporu

Bu teslim kaynak kodudur. Bu bulut çalışmasında yeni backend dağıtılmadı ve imzalı AAB üretilmedi. Gerçek cihaz hızını doğruladığımız iddia edilmez.

- Paket: `com.birarada.app`; sürüm **1.1.2 / versionCode4**. Önceki code3 Play Console'a yüklendi.
- Mevcut EAS: `@ahmedberat/birarada`, `9c50fe74-fec2-4f09-b4b2-c1711f4e9b6b`; mevcut upload keystore korunur.
- Beklenen yeni Edge: `2026-10-25-performance1`. DB şeması, kullanıcılar ve yasal sayfa içerikleri değişmedi.

## Tamamlanan kontroller

| Kontrol | Sonuç |
|---|---:|
| İstemci TypeScript | Geçti |
| Edge TypeScript | Geçti |
| Birim testleri | 23/23 |
| Gerçek PostgreSQL + Edge güvenlik/performans | 20/20 TAP kaydı |
| Release, Windows başlatıcı, AAB yardımcısı, yasal sayfa araçları | 44/44 |
| Firebase Auth emulator | 1/1 |
| Gerçek yerel backend ile sosyal arayüz | 33/33 |
| Notlar/onboarding arayüzü | 4/4 |
| Üretim JS/Hermes dışa aktarımı | Android, iOS, web geçti |
| Expo native yapılandırma | Paket, 1.1.2/code4, mevcut EAS UUID doğrulandı; etkin AD_ID izni yok |

Toplam 37 tarayıcı senaryosu geçti. Sosyal paket gerçek yerel Firebase Auth emulator, PGlite PostgreSQL ve Edge gateway koduyla Chromium'da çalışır. Not düzenleyicisi kontrollü yanıtlarla taslak/bağlantı/şarkı davranışını ayrıca sınar. Hiçbir test atlanmadı. Kontrollü 503 hataları hata sonrası toparlanmayı doğrulamak için bilerek üretildi.

## Yeni testlerin kapsamı

`tests/free-read-performance.test.ts`:

- 25 beğeni okunurken izin denetiminin her satır için yeniden DB ağına gitmemesi.
- Toplu okumada izin reddinin yalnız ilgili öğeyi etkilemesi, toplu uçtan rol/yazma saldırısının reddedilmesi.
- İlk 50 aday artık gizli hesaplara aitken daha eski uygun herkese açık gönderinin sayfada bulunması.
- Eski gizli gönderinin onaysız veya başkası tarafından keşfete açılamaması; hesap gizliyken reddedilmesi; açık sahip onayından sonra iki ayrı hesabın görebilmesi; engellenen kullanıcının görememesi.

`tests/read-batcher.test.ts`: aynı hesaptaki eşzamanlı okumaları birleştirme, tek öğe hatasını ayırma, 8 öğe/2 bağlantı sınırını uygulama ve eski oturumun sıradaki/geç sonuçlarını reddetme.

`integration-ui/feed-recovery.spec.ts` içindeki 11 senaryo önceki akış/yükleme hatalarının yanında şunları doğrular:

- İkincil okumalar bekletilirken kendi profil adının gerçek profil verisiyle 2 saniyelik test sınırında görünmesi.
- Engellerin ek okuması bekletilirken sunucunun izin verdiği gönderinin 4 saniyelik test sınırında görünmesi.
- Takip ilişkisi olmayan başka hesabın yeni herkese açık gönderisinin zaten açık Keşfet ekranına yeniden yükleme olmadan gelmesi.
- Eski gizli gönderinin menüde açık onayla yayımlanması, iptalin hiçbir değişiklik yapmaması.

Önceki mesaj/taslak/yanıt/tepki/düzenleme/onaylı silme/görüldü/grup, takip/kabul/engel, profil, fotoğraf/video/özel AAC ses, hikâye/öne çıkarma/görüntüleyenler, not/şarkı, yönetim ve iki hesap arasında video/Reels görünürlüğü testleri yeniden geçti. Medya yeniden deneme testi yeni yüklenen videonun kendi kartına sabitlendi; önbellekte tutulan gizli ekranlar ve diğer video kartları sonucu yanıltmıyor. Gönderi detay testi de gerçek detay ekranına sabitlendi.

## Performans kanıtı

1.1.1 kaynak ZIP'inden alınan kod ile yeni kod, aynı yerel veri ve her DB RPC'sine yapay 10 ms gecikme ile karşılaştırıldı. İlgisiz bildirim işleri boşaltıldı; kimlik önhazırlığı aynı şekilde yapıldı. 25 beğeni her iki yanıtta da döndü.

| Ölçüm | Önce | Sonra |
|---|---:|---:|
| DB kayıt okuma çağrısı | 255 | 5 |
| Toplam DB işlemi | 259 | 9 |
| Ölçülen yanıt | 2027 ms | 103 ms |

Ham özet: `artifacts/read-performance.json`. Bu sentetik karşılaştırma gerçek telefon/üretim gecikmesi garantisi değildir. Yetki kontrolleri kaldırılmadı; önbellek tek istekle sınırlı ve toplu okumalar eski işlem sayısı kadar hız kotası tüketiyor. Detaylar [HIZ_VE_KESFET.md](docs/HIZ_VE_KESFET.md).

## Tekrar çalıştırma ve canlıya uygulama

```sh
npm ci --include=dev --no-audit --no-fund
npm run typecheck
npm run test:server-types
npm test
npm run test:free
node --test tests/release.test.cjs tests/no-github-build.test.cjs tests/start-local.test.cjs tests/legal-publish.test.cjs
npm run test:auth
npm run test:social
npm run test:ui
```

Aynı klasörde test/kurulum pencerelerini birlikte çalıştırmayın. Linux Auth CLI testi yazılabilir `XDG_CONFIG_HOME` ile çalıştırıldı; Windows yardımcısı kendi yerel yapılandırma dizinini hazırlar.

ZIP'i tümüyle yeni klasöre çıkarıp `GUNCELLE_VE_AAB.bat` çalıştırın. Mevcut Supabase projesinin Edge kodu güncellenir; testler ve canlı sağlık/yasal sayfa kontrolleri geçtikten sonra mevcut EAS projesi ve imzasıyla code4 AAB başlatılır. DB migration'ı veya yeni proje/anahtar gerekmez. Önceki normal `get/query` uçları korunduğu için eski istemciyle sunucu uyumluluğu sürer.

Bu oturumda canlı sağlayıcılara yetkili giriş yok ve ağ politikası bu canlı adresleri kapsamıyor. Yeni canlı dağıtım, canlı sağlık/yasal sayfaların yeniden okunması, imzalı AAB, son binary'nin API/16 KB/Play denetimleri, fiziksel cihaz kamera/mikrofon/video davranışı ve gerçek push teslimi doğrulanmadı. Kaynak testleri bu kontrollerin yerine geçmez.
