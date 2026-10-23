# Birarada 1.1.1 doğrulama raporu — 23 Ekim 2026

Bu teslim kaynak paketidir; bu çalışma ortamında imzalı AAB üretilmedi ve canlı sunucu dağıtılmadı.

- Android/iOS kimliği: `com.birarada.app`
- Yeni sürüm: `1.1.1`, `versionCode 3`; önceki code2 Play Console'a yüklendi.
- Mevcut EAS: `@ahmedberat/birarada`, `9c50fe74-fec2-4f09-b4b2-c1711f4e9b6b`; mevcut upload keystore korunmalı.
- Yeni Edge sağlık revizyonu: `2026-10-23-feed1`; DB şeması ve yasal sayfa içerikleri değişmedi.

## Bu çalışmada geçen kontroller

| Kontrol | Sonuç |
|---|---|
| İstemci TypeScript | Geçti |
| Edge TypeScript | Geçti |
| Birim testleri | 20/20 |
| PostgreSQL + Edge güvenlik/akış testleri | 16/16 TAP kaydı |
| Release / Windows başlatıcı / derleme / yasal sayfa yardımcıları | 44/44 |
| Firebase Auth emulator | 1/1 |
| Gerçek yerel sunucuyla sosyal arayüz | 29/29 |
| Notlar ve onboarding | 4/4 |
| Üretim JS/Hermes dışa aktarımı | Android, iOS, web geçti |
| Expo native yapılandırma | Paket, 1.1.1/code3, mevcut EAS UUID doğrulandı; etkin AD_ID izni yok |

Tarayıcı testleri Chromium, yerel Firebase Auth emulator, PGlite PostgreSQL ve gerçek Edge gateway koduyla çalışır. Kayıt/not arayüzü paketi kontrollü yanıtlarla hata, taslak ve onay davranışlarını ayrıca sınar. Bu kontroller fiziksel telefon ve canlı sağlayıcı testi değildir.

## Yeni hata senaryoları

`integration-ui/feed-recovery.spec.ts`:

1. Gizli hesabın yeni paylaşımı sonrası kendi gönderisi ana sayfada görünür.
2. Ekrana dönerken yavaş yenileme isteği mevcut kartları kaldırmaz.
3. Daha önce açılmış profil ızgarası yeni paylaşım sonrası güncellenir.
4. Açık akış yeni sunucu paylaşımını sayfa yenilemeden alır.
5. Geçici engel-listesi okuma hatası başarılı sonraki abonelik okumasında temizlenir.
6. Başarısız akış isteği yüklemeyi bitirir; yeniden deneme listeyi getirir.
7. Gönderi detayı başarısız ilk istekten sonra yeniden açılır ve eski hata temizlenir.

`tests/deadline.test.ts`: bekleyen token, AbortSignal'i görmezden gelen taşıma, normal başarı ve hata davranışları sınanır. Token geç dönse bile süresi bitmiş işlem yeni ağ isteği başlatmaz.

`tests/free-feed.test.ts`: 35 gönderinin sayfalanması, gönderi başına tekrarlanmayan yetki okumaları, toplu DB isteği hata verdiğinde sonraki isteğin toparlanması, yeni istekte değişen gizlilik/engel/kısıtlama kararlarının uygulanması sınanır. Yetki kontrolleri kaldırılmadı; istekler arası güvenlik önbelleği yok.

Önceki 22 sosyal senaryo yeniden geçti: fotoğraf/video yükleme, tekil tekrar, taslak korunması, profil, beğeni, yorum, kaydetme, takip/kabul/engel, mesaj yanıt/tepki/düzenleme/silme/görüldü/grup, hikâye/öne çıkarma/görüntüleyenler, H.264 ve AAC çözme, başka hesaptaki akış/Reels görünürlüğü ve engelleme sonrası erişim kesilmesi. Notlara şarkı adı + Spotify/YouTube bağlantısı korunur.

## Tekrar çalıştırma

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

Aynı klasörde test/kurulum pencerelerini birlikte çalıştırmayın; test sunucuları ortak yerel portları kullanır. Linux bulut ortamında Auth CLI yapılandırma dizini yazılabilir bir `XDG_CONFIG_HOME` ile seçildi. Windows yardımcısı kendi yerel yapılandırma dizinini hazırlar.

## Canlıya uygulama

`GUNCELLE_VE_AAB.bat`: mevcut Supabase projesindeki Edge Function'ı günceller, testleri ve canlı sağlık/yasal sayfa kontrolünü çalıştırır, mevcut EAS projesi ve imzasıyla üretim AAB başlatır. Testler atlanmaz. Veritabanı migration'ı, yeni proje veya yeni keystore oluşturulmaz. ZIP'i tamamen yeni klasöre çıkarmak gerekir.

Bu ortamda yeni Edge'in canlı dağıtımı, yeni canlı sağlık/yasal sayfa okuması, EAS imzalı AAB üretimi, son binary'nin hedef API/16 KB uyumu, fiziksel telefon/kamera/mikrofon davranışı, gerçek push teslimi veya Play incelemesi doğrulanmadı. Mevcut bulut ortamında bu sağlayıcılara yetkili oturum yoktur ve dış erişim politikası bu canlı adresleri kapsamıyor. Bu rapor bunların tamamlandığını veya uygulamanın her koşulda hatasız olduğunu iddia etmez.

Ayrıntılar: [AKIS_DUZELTMELERI.md](docs/AKIS_DUZELTMELERI.md), özellik kapsamı: [YENI_ARAYUZ.md](docs/YENI_ARAYUZ.md).
