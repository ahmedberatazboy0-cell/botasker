# Şarkılı notlar

Ana Sayfa → **Notlar · Şarkını paylaş** veya Profil → **Notum ve şarkım** üzerinden açılır. Bir hesap aynı anda bir not yayımlar; yeni paylaşım öncekinin yerini alır. Metin en fazla 60, şarkı/sanatçı adı en fazla 120 karakterdir. Yalnız metin, yalnız şarkı veya ikisi birlikte paylaşılabilir. Şarkı adı ve bağlantısı birlikte girilmelidir.

Spotify'ın tam şarkı bağlantıları ile YouTube video, youtu.be, mobil, Music ve Shorts bağlantıları kabul edilir. Spotify albüm/listesi, YouTube oynatma listesi, kısaltılmış Spotify bağlantısı, başka siteler, HTTP ve uygulama içi komut URL'leri kabul edilmez. Bağlantılar standart HTTPS adresine dönüştürülür; takip parametreleri kaldırılır. Kullanıcı bağlantıya dokunduğunda ilgili servis açılır. Uygulama şarkı dosyası, kapak resmi veya otomatik önizleme indirmez; müzik dosyası yükleme/çalma özelliği ve üçüncü taraf hesap oturumu yoktur.

`notes/{uid}` belgesi yazar kimliği, kullanıcı adı, metin, şarkı adı, standart bağlantı ve sunucunun `updatedAt` zamanını içerir. Başka kullanıcılar yalnız onaylanmış takip ilişkisiyle okuyabilir. Her iki yönde engel, kaldırılmış takip ve silinmekte olan hesap bu erişimi kısıtlar. Genel not listelemesi kapalıdır; takipler 30'luk gruplarla yüklenip notlar ayrı ayrı okunur. **Daha fazla hesap göster** ve **Notları yenile** düğmeleri vardır.

Sunucu erişim kuralı 24 saat dolduğunda takipçilerin okumasını reddeder. Arayüz de zamanlayıcıyla notu gizler. Süre dolması belgenin fiziksel silinmesi değildir: sahibi eski kaydı görebilir, değiştirebilir veya silebilir. Hesap temizliği, profil ve Auth silinmeden önce güncel/süresi dolmuş notu kaldırır; yarım kalmış temizliğin tekrarı desteklenir.

Not şikâyeti, o anda okunabilen notun metnini, şarkı adını, bağlantısını ve tam zaman damgasını kanıt olarak saklar. Kurallar bu kopyayı gerçek kayıtla karşılaştırır; değiştirilmiş/silinmiş/süresi dolmuş notun eski kopyasıyla şikâyet gönderilemez. Şikâyetlerin işletim sorumlusu tarafından incelenmesi hâlâ gereklidir. Başkalarının oluşturduğu şikâyet kopyaları, notun sahibi hesabını sildiğinde otomatik silinmez; gizlilik metninde açıklanmıştır.

## Doğrulama

- `npm test`: 17 test geçti; 8'i bağlantı güvenliği, not doğrulaması ve 24 saat sınırı içindir.
- `npm run test:ui`: 4 test geçti; 3'ü gerçek not düzenleme bileşeninin tarayıcıda doğrulanmasıdır. Hatalı bağlantı, eksik şarkı alanları, kayıt hatasında taslağı koruma, silme onayı ve başka cihazdan güncelleme sırasında taslağı koruma sınandı. Bu üç testin veri callbacks'i simülasyondur; Firebase entegrasyonu değildir.
- `npm run typecheck` ve altı yayın ayarı testi geçti. Android/iOS Hermes ve web export başarılıdır; native AAB değildir.
- `tests/rules.test.ts` içinde 40 Firestore testi hazırlanmıştır; 6 yeni test notların erişimi, engel, süre, güvenli yazımı, hesap temizliği ve şikâyet kanıtını kapsar. Firestore Emulator JAR indirmesindeki ağ engeli devam ettiği için bu testler henüz çalıştırılamadı; geçti sayılmaz.

Yayın öncesinde iki gerçek hesapla kayıt/not paylaşma/düzenleme/silme, takip kabulü/geri çekme, iki yönlü engel, şikâyet ve hesap silme akışları Firestore üzerinde doğrulanmalı. 24 saat sınırı, uygulamanın arka plandan dönüşü ve bağlantı kesintisi de gerçek telefonda denenmelidir. Güncellenen kuralların ve yasal sayfaların canlıya dağıtımı ile imzalı AAB üretimi tamamlanmadı.

## Kullanıcının Windows emulator sonucu

20 Ekim 2026'da paylaşılan Windows konsol kaydında notlara ait altı Firestore güvenlik testi geçti. Tüm güvenlik testlerinde sonuç 39/40 idi; kalan hata not kurallarından değil, profil/kullanıcı adı silme testinin farklı Firestore örneklerini aynı batch içinde kullanmasından kaynaklandı. Test düzeltildi; tam 40 testin güncel sonuçları yeniden alınmalı. Bu harici kayıt, canlı Firebase yayını veya gerçek mobil cihaz doğrulaması değildir.
