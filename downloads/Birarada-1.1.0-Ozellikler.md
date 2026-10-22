# 1.1.0 değişiklikleri ve özellik sınırları

Instagram'da alışılan ekran düzenleri temel alınarak Birarada'nın arayüzü yeniden yazıldı. Ürün adı, simgesi ve hesapları Birarada'ya aittir. Instagram'ın tüm ürünlerinin tamamlandığı iddia edilmez.

| Alan | Çalışan işlevler |
|---|---|
| Ana sayfa | Hikâye halkaları, keşfet/takip akışı, tam genişlikte medya, çoklu fotoğrafta kaydırma ve sayfa göstergesi, çift dokunarak beğeni, yorum, kaydetme, sistem paylaşımı, şikâyet ve onaylı silme |
| Profil | Avatar, gerçek paylaşım/takip sayıları, biyografi, düzenleme, gönderi/Reels/liste sekmeleri, 3 sütunlu ızgara, öne çıkanlar, arşiv, kaydedilenler, kendi takip listeleri |
| Gizlilik | Gizli hesap, bekleyen takip isteği, kabul/red/geri çekme, engelleme ve engeli kaldırma, yetki kontrollü medya |
| Keşfet | Kullanıcı adı, kelime ve etiket arama, hesap sonuçları, gönderi/Reels ızgarası |
| Paylaşım | Fotoğraf/video, çoklu fotoğraf, galeri/kamera, yerel video önizleme, açıklama, yorum izni, taslak |
| Hikâye | Tam ekran gösterim, önceki/sonraki, basılı tutarak duraklatma, görüntüleyenler, doğrudan mesajla yanıt, öne çıkarma, onaylı silme ve şikâyet |
| Reels | Dikey sayfalama, görünür videonun oynatılması, gerçek beğeni/yorum/kaydetme, profil bağlantısı, sistem paylaşımı ve şikâyet |
| Notlar | 24 saatlik not, şarkı adı ve güvenli Spotify/YouTube bağlantısı, silme onayı |
| Mesajlar | Gerçek kişi adları/avatarları, sohbet ve kişi arama, yeni sohbet, birebir/grup, metin/fotoğraf/video/ses, yanıt, emoji tepkisi, düzenleme, onaylı silme, gönderildi/görüldü, yerel taslak, grup adı ve ayrılma |
| Güvenlik/yönetim | Şikâyetler, engelleme, yetkiye bağlı mevcut yönetim paneli, hesap kısıtlama/silme onayları, sunucu rol kontrolleri, hesap silme akışı |

## Bu sürümde bulunmayanlar

Sesli/görüntülü arama, canlı yayın, lisanslı müzik kataloğu, otomatik video dönüştürme, yüz/AR filtreleri, alışveriş/reklam sistemi, Instagram öneri algoritması ve uçtan uca şifreleme uygulanmadı. Şarkı paylaşımı bağlantı paylaşımıdır; lisanslı müzik çalma servisi değildir. Sistem paylaşımı gönderinin metnini paylaşır; evrensel web gönderi bağlantısı servisi kurulmadı. Kullanıcı adı değiştirme mevcut sürümde kapalıdır. Başkalarının takipçi listelerini gezme eklenmedi.

Bildirim listesi mevcut sunucu olaylarını gösterir; her beğeni/yorum için yeni push olayı üretildiği iddia edilmez. Cihaz push teslimi bu ortamda sınanmadı. Yeni arayüz tarayıcı ve üretim paketleme kontrollerinden geçtiğinde bile Android/iOS fiziksel cihaz doğrulamasının yerine geçmez.

## Sunucudaki hata düzeltmesi

İstemcinin atomik işlemleri yeni takip, bildirim, kendi engel kaydı ve şikâyet oluştururken önce kaydın yokluğunu okuyordu. Önceki politika bu okumalardan bazılarını reddediyordu. Eksik ilişki kayıtları yalnız taraflardan birine, eksik engel kaydı yalnız sahibine açıldı. Mevcut kayıtların sahiplik/gizlilik kontrolleri ve yazım doğrulamaları korunur. Rastgele şikâyet kimliğinin yokluğu okunabilir; oluşmuş şikâyeti yalnız bildiren kişi okuyabilir. Yabancı ilişki/şikâyet erişimi ve sahte kabul işlemleri güvenlik testinde reddedilir.

Güncelleme yalnız Edge Function kodudur; şema/politika sürümü `2026-10-21-free1`, veri yapısı ve eski istemci protokolü değişmedi. Sağlık yanıtına `2026-10-22-social1` revizyonu eklendi.
