# Onboarding ilk yükleme düzeltmesi

20 Ekim 2026. Kullanıcının paylaştığı Gemini raporundan hareketle mevcut kaynağa bağımsız uygulandı. Gemini'nin kaynak ZIP'i bu sohbete eklenmedi; bildirilen ZIP hash'i doğrulanmadı.

- `e2e/onboarding.spec.ts`: gezinme `waitUntil: "commit"`, 30000 ms; gerçek ilk ekran 90000 ms; test toplamı 120000 ms. Mevcut kontroller korunur.
- `playwright.config.ts` ve `scripts/build-no-github.cjs`: tek worker.
- `AAB_OLUSTUR.bat`: aynı yardımcı koddan yeniden üretildi; Windows'a özel require yolları ve CRLF korundu.

Gerçek yerel sonuçlar:

| Kontrol | Sonuç |
| --- | --- |
| TypeScript | Geçti |
| no-GitHub yardımcı testleri | 12/12; gerçek Expo çözümlemesi dahil |
| BAT sözdizimi / Node üzerinden `--check` | Geçti |
| Yardımcının farklı klasörden ürettiği config ile Chromium | 4/4, 7,9 saniye |
| İlk Metro JavaScript isteğini 32 saniye geciktiren Chromium koşusu | Onboarding'in tüm kontrolleri geçti, 38,2 saniye |
| Uygulama kaynaklarının değişmemesi | `src/` altındaki 26 dosyada önce/sonra SHA-256 eşit |

Gecikmeli koşu yalnız gerçek yavaş açılışı sınamak için geçici bir test kopyasında yapıldı; teslim edilen uygulamaya/teste yapay gecikme eklenmedi. Yeni test kaldırma/skip yoktur. Bu kontroller fiziksel Windows veya Android cihazında yapılmadı. Auth, Firestore ve native derleme bu turda yeniden çalıştırılmadı. Önceki kullanıcı Windows kaydında Firestore 40/40 ve Auth 1/1 geçmiştir.

`com.birarada.app`, 1.0.0 ve kaynak versionCode 1 korunur. Önceden mağaza yüklemesi varsa gerçek en yüksek sürüm kodu ve mevcut imza hesap üzerinden doğrulanmalıdır. Expo/Firebase oturumu ve gerçek EAS projectId yok; bilinen bulut ağ engelleri sürüyor. İmzalı AAB, imza/16 KB doğrulaması ve canlı backend/yasal sayfa dağıtımı tamamlanmadı. Bu teslimat kaynak kodudur; Play Store yayını onayı değildir.
