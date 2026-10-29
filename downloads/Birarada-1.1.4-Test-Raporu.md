# Birarada 1.1.4 — 29 Ekim 2026 test raporu

Bu teslim kaynak kodudur. Testler yerel Chromium, Firebase Auth emulator, PGlite PostgreSQL ve gerçek Edge gateway koduyla çalıştırıldı. Kullanıcının bilgisayarına veya telefonuna bağlanılmadı; Play Store'daki kurulu Android paketi sınanmış sayılmaz.

Paket **com.birarada.app**, sürüm **1.1.4 / versionCode6**. Önceki kaynak adayı 1.1.3/code5 idi. EAS **@ahmedberat/birarada**, **9c50fe74-fec2-4f09-b4b2-c1711f4e9b6b** ve mevcut upload keystore korunur. Backend kaynak kodu bu güncellemede değişmedi; gereken Edge revizyonu **2026-10-27-instant1** olarak kaldı.

## Sonuçlar

| Kontrol | Sonuç |
|---|---:|
| İstemci TypeScript | Geçti |
| Edge TypeScript; Deno giriş dosyası yerel runtime tipleriyle dahil | Geçti |
| Birim testleri | 29/29 |
| PostgreSQL + Edge güvenlik/bildirim kontrolleri | 28/28 TAP kaydı |
| Release, Firebase Android dosyası, Windows/AAB/yasal araçları | 47/47 |
| Firebase Auth emulator | 1/1 |
| Tam sosyal tarayıcı koşusu | 44/44 |
| Giriş/onboarding ve şarkılı notlar | 4/4 |
| Üretim JS/Hermes dışa aktarımı | Android, iOS, web geçti |
| Expo yapılandırması | com.birarada.app, 1.1.4/code6, mevcut EAS kimliği doğrulandı |

**48 tarayıcı senaryosu geçti; test atlanmadı.** Bilerek üretilen 503 yanıtları hata sonrası toparlanmayı sınar. Yerel test kullanıcıları birbirinden ayrıdır; canlı tester hesaplarına gönderi veya mesaj gönderilmedi. Not düzenleyicisinin kontrollü yanıt testleri ayrıca taslak ve şarkı bağlantısı davranışını kontrol eder.

## Yeni düzeltmeler ve kanıt

- Başlangıçtaki sabit 1,4 saniyelik minimum bekleme kaldırıldı. İlk Firebase oturumu/profil doğrulaması ve topluluk onayı gereksinimi devam eder.
- Profil, gelen kutusu ve son iki sohbetin ön yüklemesi, oturum ve gerekli onaylardan sonra ana sayfa isteğiyle bağımsız başlar. Profil sayaçları da sohbet geçmişinin hazırlanmasını beklemez.
- İlk ana sayfa yanıtı bilerek bekletilirken profil ızgarası, sayaçlar, gelen kutusu ve konuşmadaki gerçek mesaj açıldı. Bu test son tam koşuda geçti.
- Aynı açık profil ekranına geri dönüldüğünde, 60 saniyelik okuma önbelleği süresi dolmuş olsa bile önceki başlık/sayaçlar ekranda kalır; sunucu arkada yeniden doğrulanır. Test, zamanı 65 saniye ilerletip yeni ağ isteklerini bekleterek bunu doğruladı. Bu kalıcı disk önbelleği değildir; uygulama yeniden başlatıldığında aynı sonuç varsayılmaz.
- Hesap aramasındaki satırlara erişilebilir düğme adları eklendi. Profil dönüş testi arka plandaki aynı metinleri değil, gerçekten açık profil alanını kontrol eder.

## Akışların kapsamı

Gerçek fotoğraf paylaşma ve yeniden deneme, başka hesapta görüntüleme/beğenme, animasyonlu bildirimden doğru gönderiyi açma; gizli hesaba takip isteği/kabul; grup oluşturma ve gruba eklenme bildirimi; iki hesap arasında mesaj, yanıt, tepki, düzenleme, onaylı silme ve görüldü; başarısız gönderimde taslak koruma ve yeniden denemede tek kayıt sınandı.

H.264 video, Reels, özel AAC ses, hikâye/öne çıkarma, profil düzenleme, şarkılı notlar, yönetim, engelleme ve gizlilik kontrolleri tekrar geçti. Herkese açık video/Reels başka hesabın akışına gelir; gizli içerik onay ve görünürlük sınırlarına uyar. Profil/ana sayfa arasında sekiz turda istek kotası hatası oluşmadı. Sohbetin üst bilgi sorgusu başka profil açıkken durdu ve geçici hata başarılı okumada temizlendi.

## Yerel hız ölçümü

| Ön yükleme tamamlanmış Chromium senaryosu | Sonuç |
|---|---:|
| Profil ızgarası → gönderi ayrıntısı | 265 ms |
| Gelen kutusu → konuşma | 136 ms |
| Sekiz profil/ana sayfa turundaki belge HTTP okuması | 6 |
| Bu gezinme testindeki 429 hatası | 0 |

Ham veri **artifacts/warm-navigation.json**. Profil/gönderi testi yeni ağ yanıtını 15 saniye bekletirken önceden yüklenen içeriğin kullanılabilir kaldığını doğrular. Bunlar fiziksel telefon veya canlı sunucu ölçümleri değildir; ilk soğuk açılış ve Instagram ile hız eşitliği doğrulanmadı. Ayarlar → Bağlantı kontrolü telefondaki sunucu ve oturumlu okuma sürelerini ayrıca ölçebilir.

## Play Store ve Remote Desktop Commander denemesi

Kullanıcının verdiği adres: https://play.google.com/store/apps/details?id=com.birarada.app

29 Ekim'de HTTPS erişimi normal ortam proxy'si üzerinden denendi. İstek **CONNECT tunnel failed, response 403** ile ortamın ağ geçidinde durdu; mağaza sayfası alınamadı. Bu Google Play'in uygulamayı reddettiği veya uygulamanın çalışmadığına ilişkin bir sonuç değildir. Erişim kısıtı aşılmadı.

Remote Desktop Commander adı kullanıcı tarafından belirtildi; fakat bu oturumda masaüstü kontrol komutları ve etkin bir Android cihaz/emülatörü erişime açık değildi. Kullanıcının bilgisayarına dosya indirilmedi; Google/Play hesabıyla oturum açılmadı; Android kurulum ve fiziksel cihaz testi yapılamadı.

## Bildirim ve dağıtım sınırları

Uygulama içi animasyon, sayaç, doğru hedef ekranı ve sunucunun hedefli push paketleri sınandı. Expo taşıması denetimli ilk gönderim yanıtlarıyla test edildi; **Expo kabulü telefona teslim kanıtı değildir.** FCM v1 yetkisi, gerçek telefon izni ve cihaz teslimi doğrulanmadı. Gönderim makbuzları ayrıca sorgulanmaz. Kuyruk yeniden denemesi sonraki API trafiğiyle yürür; sürekli cron servisi yoktur. Operatör SMS hizmeti bağlı değildir.

Bu oturumda yeni backend dağıtılmadı ve imzalı AAB/APK üretilmedi. Canlı sağlayıcı oturumları bulunmuyor. Son binary'nin imzası, hedef API, 16 KB uyumu, kamera/mikrofon davranışı ve Play onayı doğrulanmadı. Üretim JavaScript dışa aktarımı bu binary kontrollerinin yerine geçmez.

## Yeniden çalıştırma

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

Test/kurulumları aynı klasörde aynı anda çalıştırmayın. Linux Auth testi yazılabilir XDG_CONFIG_HOME kullandı; gerçek Windows CMD oturumu burada sınanmadı. Web ön izlemesi için WEB_TEST.bat veya npm run web:local kullanılır; hesaplar yereldir.

ZIP'i yeni klasöre tamamen çıkarıp GUNCELLE_VE_AAB.bat çalıştırmak mevcut sunucuyu doğrular/günceller ve testli üretim AAB sürecini başlatır. Mevcut sunucu zaten 2026-10-27-instant1 ise AAB_OLUSTUR.bat doğrudan kullanılabilir. Yeni AAB mevcut Play test kanalına yüklenip cihazdan güncellenmelidir. Telefon push kurulumu docs/HIZ_VE_BILDIRIM.md ve BILDIRIM_KUR.bat içindedir.
