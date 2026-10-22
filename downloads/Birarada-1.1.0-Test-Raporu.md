# Birarada 1.1.0 doğrulama raporu — 22 Ekim 2026

## Teslim ve kimlik

Bu teslim tam mobil/web kaynak paketidir. **Yeni imzalı AAB içermez.** Bu oturumda bağlı Expo/Supabase/Firebase üretim oturumu bulunmadığı için yeni Edge kodu canlıya dağıtılmadı ve yeni EAS üretim imzası alınmadı. Yeni arayüzün fiziksel Android/iOS cihaz doğrulaması bu çalışmada yapılmadı. Daha önce telefonda çalışan 1.0 sürümünün başarısı yeni 1.1 binary'sinin testi olarak sayılmadı.

- Android applicationId / iOS bundle ID: `com.birarada.app`
- Yeni sürüm: `1.1.0`, `versionCode 2`; önceki code1 Play Console'a yüklendi.
- Mevcut EAS: `@ahmedberat/birarada`, `9c50fe74-fec2-4f09-b4b2-c1711f4e9b6b`.
- Firebase Authentication/Hosting: `birarada-5650c`.
- Supabase: `qinevhhhdtslnzrtcanq`, yeni Edge revizyonu `2026-10-22-social1`.
- Veri/koşul sürümü: `2026-10-21-free1`; yeni migration gerekmez. Mevcut imza ve hesaplar korunur.

## Tamamlanan kontroller

| Kontrol | Sonuç |
|---|---|
| TypeScript istemci | `npm run typecheck` geçti |
| TypeScript Edge sunucusu | `npm run test:server-types` geçti |
| Birim testleri | 17/17 geçti |
| Gerçek PostgreSQL uyumlu motor + Edge güvenlik testleri | 15/15 TAP kaydı geçti (14 senaryo ve üst grup) |
| Sürüm, Windows/CLI, başlatma ve yasal yayın yardımcıları | 44/44 geçti |
| Firebase Auth emulator | 1/1 geçti; kayıt, çıkış, yanlış/doğru parola, sıfırlama isteği ve hesap temizliği |
| Gerçek uygulama + yerel Auth/PostgreSQL/özel medya + Chromium | 18/18 geçti |
| İzole not düzenleyici ve onboarding | 4/4 geçti |
| Expo SDK bağımlılık uyumu | `expo install --check`, bağımlılıklar güncel |
| Üretim Android Hermes paketi | Expo export geçti |
| Üretim iOS Hermes paketi | Expo export geçti |
| Üretim web paketi | Expo export geçti |
| Native yapılandırma incelemesi | Paket, 1.1.0/code2 ve mevcut EAS UUID doğrulandı; AD_ID eklenmedi; geniş galeri izinleri kaldırma kuralları korundu |

Android/iOS Hermes ve web export'ları gerçek kaynak derlemeleridir; Gradle/Xcode ile imzalanmış uygulama veya AAB değildir. Native yapılandırma incelemesi final birleşik Android manifesti/16 KB kontrolünün yerine geçmez.

## Arayüz senaryoları

Yeni düzen için gerçek yerel sunucuda ayrı, doğrulanmış test hesapları kullanıldı. Canlı Supabase/Firebase verileri değiştirilmedi. Aşağıdaki 13 senaryo `integration-ui/redesign.spec.ts` içinde:

1. 320 piksel dar ekranda taşmadan gezinme, sohbetlerde ad arama, gerçek alıcıyla yeni sohbet.
2. Çoklu fotoğraf yükleme, karusel, beğeni, kaydetme, gerçek yorum kaydı.
3. Profil düzenleme, istatistik/ızgara, kalıcı biyografi, yeniden yükleme ve kaydedilenler menüsü.
4. Şarkılı notun gerçek kaydı, YouTube bağlantısının sadeleştirilmesi ve silme onayı.
5. Sohbetten çıkıp dönünce taslak, gerçek alıcı ve gönderilen metin.
6. Mesaja yanıt, tepki, düzenleme, silme iptali ve açık silme onayı.
7. İki ayrı tarayıcı hesabında gelen mesajın görünmesi ve gerçek görüldü kaydı.
8. Grup oluşturma, ad değiştirme ve üyelikten ayrılma.
9. Takip, profil şikâyeti, engelleme ve engeli kaldırma sonrası sunucu kaydı.
10. Reel yükleme, oturumla video indirme/çözme, beğeni, kaydetme ve yorum.
11. Gizli hesabın isteği onaylayana kadar kilitli kalması; diğer hesaptan açık kabul.
12. Hikâyede ileri/geri, yanıtın gerçek sohbete gelmesi ve görüntüleyen kaydı.
13. Profil senkronizasyonu geçici 503 hatası alırken açık sohbet ve gönderilmemiş taslağın korunması, bağlantı düzelince uyarının kalkması.

`integration-ui/social.spec.ts` içindeki 5 mevcut senaryo da geçti: gerçek fotoğraf yükleme/hata sonrası tekil tekrar, hikâye/öne çıkarma, yönetici onayı, özel H.264 video oynatma ve AAC sesli mesaj oynatma. `e2e` içindeki 4 senaryo onboarding, parola sıfırlama ekranı, kayıt onayı/yasal bağlantılar ve not düzenleyicinin hata/taslak davranışını doğrular.

22 tarayıcı senaryosu gerçek cihaz kamerası, mikrofon kaydı, donanım video çözücüleri veya push teslimi için kanıt değildir. Kontrollü 503 hataları, hata davranışını doğrulamak için bilerek enjekte edildi; testler atlanmadı.

## Düzeltilen hatalar

- İlk takip/bildirim, kendi engel kaydı ve yeni şikâyet oluşturulurken atomik işlemin eksik kayıt okuması reddediliyordu. Politika bu durumları sahiplik sınırlarıyla destekliyor. Yabancı ilişki ve mevcut şikâyet erişimi, sahte takip kabulü reddedilir; ek PostgreSQL güvenlik senaryosu bunu doğrular.
- Her yerel yazımdan sonra bütün aboneliklerin gereksiz yenilenmesi kaldırıldı. Yalnız ilgili kayıt/listeler yenilenir; eşzamanlı aynı hesap/sorgu okumaları birleştirilir. İlgisiz hesapların sonuçları paylaşılmaz, kalıcı sonuç önbelleği eklenmez.
- Gizli ekranlarda liste sorguları durur. Öndeki sohbetler 3 saniyede, normal kayıtlar 10 saniyede, beğeni/kaydetme abonelikleri 60 saniyede sorgulanır. Kullanıcının kendi yazımı ilgili listeyi hemen yeniler. Sunucu hız/güvenlik limitleri kaldırılmadı.
- Geçici profil senkronizasyon hatasında gezinme ağacı kaldırılmaz; sohbet taslağı korunur. Yetki/oturum hataları güvenlik kapısında kalır.
- Hikâyede duraklatma sonrası kalan süre ve sayfalama sonrası ilerleme düzeltildi. Profil hatası başarılı okuma sonrası temizlenir. Takip bildiriminden ilgili profile gitme düzeltildi.

## Üretimde kalan doğrulamalar

`GUNCELLE_VE_AAB.bat` önce aynı Supabase projesindeki Edge Function'ı günceller, sonra testli üretim derlemesini mevcut EAS projesinde başlatır. Güncelleme DB şemasına dokunmaz. Canlı önkontrol yeni sağlık revizyonunu ister; eski sunucu yanlışlıkla kabul edilmez.

Burada henüz doğrulanmayanlar: yeni Edge sürümünün canlı dağıtımı, güncel canlı yasal sayfaların yeniden okunması, yeni imzalı AAB'nin indirilmesi, son binary'nin imzası/hedef API/16 KB uyumu, yeni UI'nin fiziksel cihazda galeri/kamera/mikrofon/video davranışı, gerçek FCM/Expo push teslimi ve Google Play incelemesi. Mevcut hesabın üretim erişimi için Play Console'daki kapalı test şartları ayrıca geçerlidir.

Sesli/görüntülü arama, canlı yayın ve lisanslı müzik kataloğu bu sürümde yoktur. Tam özellik sınırları [YENI_ARAYUZ.md](docs/YENI_ARAYUZ.md) içindedir. Bu rapor Instagram'ın tüm ürün özelliklerinin uygulandığı veya uygulamanın hatasız olduğu iddiası değildir.

## Tekrar çalıştırma

```sh
npm ci --include=dev --no-audit --no-fund
npm run typecheck
npm run test:server-types
npm test
npm run test:free
node --test tests/release.test.cjs tests/no-github-build.test.cjs tests/start-local.test.cjs tests/legal-publish.test.cjs
npm run test:social
npm run test:ui
```

Chrome/Edge özel konumu `CHROMIUM_PATH` ile verilebilir. Otomatik sunucu testleri kendi yerel Auth/PostgreSQL/medya süreçlerini başlatıp durdurur. Rapor ekran görüntüleri `artifacts/redesign-*.png` içindedir; medya ve hesaplar yerel test örnekleridir.
