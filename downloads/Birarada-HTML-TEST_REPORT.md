# Birarada · Tek HTML test raporu

19 Ekim 2026. Bu dosya, Expo/Firebase uygulamasından ayrı bir yerel demo sürümüdür.

## Kullanım

Birarada-HTML.zip dosyasını çıkartıp Birarada.html dosyasını güncel Chrome, Edge veya Firefox ile açın. Sunucu, Node.js, Java, npm kurulumu veya başlat.bat gerekmez. Açılışta “Örnek hesapla dene” seçeneği vardır. Kayıt/giriş, profil, paylaşım, beğeni, yorum, kaydetme, takip isteği, bildirimler, yerel sohbet, Anlar ve küçük yerel videolar bu cihazda denenebilir.

## Doğrulama

- Inline JavaScript sözdizimi kontrolü geçti.
- Chromium’da 10 işlevsel kontrol geçti: mobil/masaüstü görünüm, beş sekme, paylaşımın yeniden açılışta korunması, beğeni, XSS metninin güvenli gösterimi, yerel mesajlaşma ve kalıcılık, örnek hesaplar arasında geçiş, kayıt/profil, yerel sürüm açıklamaları ve sıfır dış ağ/harici dosya isteği.
- Medya regresyonları ayrıca doğrulandı: hesap değişiminde ve sıfırlamada taslak temizliği, eski yükleme sonucunun yok sayılması, iki yükleme çakışması, profil fotoğrafı hesabı değiştiğinde iptal, geçersiz videonun reddi, geçerli PNG/WebM ve object URL temizliği, gizli beğeni sayısı, geçerli örnek kullanıcı adı.
- Mobil tarayıcı JavaScript hatası görülmedi. Testler `node --test mobile/tests/standalone-html.cjs` ile çalışır; kullanıcı bu komuta ihtiyaç duymaz.

Bu ortamın yönetilen Chromium politikası file:// açılışını engellediği için doğrudan dosya açma kontrolü atlandı. İşlevsel kontroller aynı HTML baytları geçici yerel HTTP üzerinden sunularak, tüm diğer istekler engellenerek yapıldı. Bu, Windows’ta veya kullanıcının cihazında çift tıklama testinin yapıldığı anlamına gelmez.

## Sınırlar

Gerçek Firebase bağlantısı yoktur. Kullanıcılar ve örnek içerikler bu tarayıcıdaki IndexedDB’de saklanır; desteklenmezse localStorage, o da kullanılamazsa açıkça belirtilen geçici bellek kullanılır. Bu dosya gerçek çok kullanıcılı mobil uygulamayı, sunucu yetkilerini veya production güvenliğini doğrulamaz. Örnek hesaplar arasında geçiş, iki taraflı yerel etkileşimleri denemek içindir; başka cihazlara mesaj iletilmez. Şikâyetler bu cihazda test kaydıdır; bir moderasyon ekibine gönderilmez. Şifreler salt+PBKDF2 özeti olarak saklanır, buna rağmen burada gerçek hesap şifrelerinizi kullanmayın.

Görseller dosyanın içinde SVG olarak bulunur. İçe aktarılan fotoğraflar cihazda JPEG’e dönüştürülür; videolar en fazla 16 MB’dır. Tarayıcının desteklemediği codec’ler reddedilir. Tarayıcı verileri temizlenirse içerikler kaybolur; dosyanın kendisi bir yedek içermez. Mobil tarayıcıların yerel HTML açma ve depolama desteği değişebilir.
