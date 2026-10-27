# Birarada 1.1.3 — 27 Ekim 2026 doğrulama raporu

Bu teslim kaynak kodudur. Bu çalışmada yeni backend dağıtılmadı, imzalı AAB üretilmedi ve fiziksel telefonda ölçüm yapılmadı.

- Paket **com.birarada.app**, sürüm **1.1.3 / versionCode5**. Önceki kaynak sürümü code4 kullanıyordu.
- Mevcut EAS **@ahmedberat/birarada**, **9c50fe74-fec2-4f09-b4b2-c1711f4e9b6b**; mevcut upload keystore korunur.
- Beklenen Edge **2026-10-27-instant1**. Veritabanı şeması, hesaplar ve mevcut yasal sayfa içeriği korunur.

## Kontroller

| Kontrol | Sonuç |
|---|---:|
| İstemci TypeScript | Geçti |
| Edge TypeScript; Deno giriş dosyası dahil, yerel runtime tipleriyle | Geçti |
| Birim | 29/29 |
| PostgreSQL + gerçek gateway güvenlik/bildirim | 28/28 TAP kaydı |
| Release, Firebase Android yapılandırması, Windows başlatıcı, AAB/yasal araçları | 47/47 |
| Firebase Auth emulator | 1/1 |
| Gerçek yerel backend ile sosyal arayüz | 42/42 |
| Notlar/onboarding | 4/4 |
| Üretim JS/Hermes dışa aktarımı | Android, iOS, web geçti |
| Expo yapılandırması | Paket, 1.1.3/code5 ve mevcut EAS UUID doğrulandı |

46 benzersiz tarayıcı senaryosu geçti. Son tam sosyal koşu 42/42, notlar/onboarding koşusu 4/4 sonuçlandı. Test sırasında bulunan mesaj ön yükleme sınırı, tanılama ekranının web sürüm bilgisi ve arka planda da bulunan metne denk gelen test seçicileri düzeltildi; ilgili senaryolar yeniden geçti. Hiçbir test atlanmadı. Bilerek üretilen 503 yanıtları hata sonrası toparlanmayı sınar.

Sosyal testler gerçek yerel Firebase Auth emulator, PGlite PostgreSQL, Edge gateway ve Chromium ile, birbirinden ayrı test hesaplarında çalıştı. Canlı tester hesaplarına içerik veya mesaj gönderilmedi. Not düzenleyicisinin kontrollü yanıt testleri ayrıca taslak/şarkı bağlantısı davranışını kontrol eder.

## Kullanıcının istediği akışlar

- Gerçek fotoğraf düzenleyicisinden paylaşım; diğer hesabın görmesi ve beğenmesi; bildirimden doğru gönderinin açılması.
- Gizli hesaba takip isteği; alıcıda animasyon/sayaç; kabulden sonra isteği gönderenin ilişki durumunun güncellenmesi.
- Gerçek grup oluşturma; diğer üyede gruba eklenme bildirimi; mesaj ve bildirimden doğru konuşmaya geçiş.
- Mesaj taslağının ekran değişiminde korunması; yanıt, tepki, düzenleme, onaylı silme ve görüldü akışı.
- Sohbet üst bilgisinin geçici hatadan toparlanması; başka profil açıkken arka plandaki sohbet sorgularının durması.
- Geciktirilmiş gönderimde “Gönderiliyor…” gösterimi; 503 sonrası taslağın kalması; yeniden denemede tam bir mesaj kaydı.
- Fotoğraf, H.264 video, Reels, özel AAC ses, hikâye/öne çıkarma, profil, engel/gizlilik ve yönetim kontrolleri.
- Herkese açık video/Reels'in başka hesaba ulaşması; gizli içerik için onay gerekliliği ve engel sonrası erişimin kaldırılması.

## Yükleme ölçümü

Ön yükleme tamamlandıktan sonra yeni sunucu yanıtı bilerek bekletildi. Profil/gönderi ayrıntıları testi bu beklemeyi 15 saniye sürdürdü; ekran kullanılabilir kaldı. Gelen kutusu ve mesaj geçmişi de sonraki belge isteği bekletilirken göründü.

| Yerel Chromium ölçümü | Sonuç |
|---|---:|
| Profil ızgarası → gönderi ayrıntısı | 215 ms |
| Gelen kutusu → ön yüklenmiş konuşma | 118 ms |
| Sekiz profil/ana sayfa turundaki belge HTTP okuması | 6 |
| Bu gezinme testindeki 429 hatası | 0 |

Ham sonuç **artifacts/warm-navigation.json**. Bunlar oturum belleği hazırlanmış yerel senaryolardır; fiziksel telefon, ilk soğuk açılış veya üretim ağı hız garantisi değildir. Uygulamada Ayarlar → Bağlantı kontrolü gerçek telefonun iki servis süresini ölçer.

Oturum belleği 80 okuma/60 saniye ile sınırlıdır; disk önbelleği yoktur. Oturum değişimi, izin reddi, geç yanıtlar, sorgu paylaşımı ve kapasite test edildi. Google hesap doğrulaması yalnız örtüşen çağrılarda paylaşılır; sonraki çağrı hesabı yeniden doğrular. Geçici kimlik hizmeti kesintisi 503, geçersiz kimlik 401 olarak kalır. Önceki 1.1.2 sentetik DB karşılaştırması **artifacts/read-performance.json** içinde tarihsel olarak korunur; bu sürümün cihaz ölçümü değildir.

## Bildirim doğrulaması ve sınırlar

Sunucu testleri gerçek takip/beğeni/grup/mesaj işlemlerinin doğru alıcıya yüksek öncelikli push paketi üretmesini doğruladı. Mesaj gövdesi push metnine eklenmiyor; doğru chat/post kimlikleri taşınıyor. FCM yetki hatası kuyrukta kalıyor, geçersiz cihaz kaldırılıyor. Kişiye özel deneme isteği idempotent; durum ucu cihaz token'ını açığa çıkarmıyor.

Expo taşıması testte denetimli yanıtlarla sınandı. **Expo kabulü fiziksel telefona teslim kanıtı değildir.** Gerçek Firebase Android açık dosyası, EAS FCM v1 yetkisi, Android izni ve fiziksel teslim bu ortamda doğrulanmadı. `notifications:setup` açık Android dosyasını resmî CLI ile alır; yanlış proje/paket, eksik SDK bilgisi, özel anahtar veya symlink kabul etmez. `BILDIRIM_KUR.bat` resmî EAS credentials ekranını açar. Operatör SMS hizmeti bağlı değildir.

Uygulama içi bildirim 3 saniyelik polling ile; arka plan push'u Expo/FCM ile çalışır. Kuyruk yeniden denemesi sonraki API trafiğiyle yürür; sürekli cron eklenmedi. Expo gönderim makbuzları ayrıca sorgulanmaz; gösterilen durum ilk gönderim yanıtıdır. iOS push için ayrıca APNs kurulumu gerekir.

## Tekrar çalıştırma / uygulama

```sh
npm ci --include=dev --no-audit --no-fund
npm run typecheck
npm run test:server-types
npm test
npm run test:free
node --test tests/release.test.cjs tests/no-github-build.test.cjs tests/start-local.test.cjs tests/legal-publish.test.cjs tests/firebase-android.test.cjs
npm run test:social
npm run test:ui
npm run test:auth
```

Test/kurulumları aynı klasörde eşzamanlı çalıştırmayın. Linux Auth CLI testinde yazılabilir XDG_CONFIG_HOME kullanıldı. Windows yardımcısı tarayıcıyı otomatik arar; BAT artık ortak Node yardımcısını alıntılanmış dosya yoluyla çalıştırır. Node önkontrolü ve boşluklu yol testleri geçti; gerçek Windows CMD oturumu burada çalıştırılmadı.

ZIP'i yeni klasöre tamamen çıkar; **GUNCELLE_VE_AAB.bat** mevcut Edge kodunu günceller ve testli AAB sürecini başlatır. Push için **BILDIRIM_KUR.bat** ve [HIZ_VE_BILDIRIM.md](docs/HIZ_VE_BILDIRIM.md) adımlarını tamamla. Son yeni AAB Play test kanalına yüklenip cihazdan güncellenmeli. Önceki AAB bu kaynak değişikliklerini içermez.

Bu oturumda yetkili Supabase/Firebase/Expo kimliği yok; canlı servis adresleri çalışma ortamının ağ politikasında izinli değil. Canlı dağıtım, yeni imzalı AAB, fiziksel cihaz kamera/mikrofon/video/push davranışı, son binary'nin imzası/hedef API/16 KB ve Play onayı doğrulanmadı.
