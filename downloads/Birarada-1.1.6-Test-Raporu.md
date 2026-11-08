# Birarada 1.1.6 — 8 Kasım 2026 test ve teslim raporu

Bu teslim **kaynak kodudur**. Yeni AAB/APK üretilmedi, canlı sunucu/yasal sayfalar bu oturumdan yayımlanmadı, telefondaki sürüme kurulum yapılmadı. Yerel test sonucu fiziksel telefonda aynı hızın veya push tesliminin kanıtı değildir.

## Kimlik ve başlangıç

Paket `com.birarada.app`, kaynak adayı **1.1.6 / versionCode 8**; EAS `@ahmedberat/birarada`, proje `9c50fe74-fec2-4f09-b4b2-c1711f4e9b6b`. Mevcut imza korunur. Code8, Play Console'dan doğrulanmış en yüksek kod değildir. Derlemeden önce tüm kanallar/App Bundle Explorer kontrol edilmeli.

Bu oturumun başlangıcı buradaki **1.1.4/code6 kaynağıdır**. Diğer sohbetin 1.1.5 adayı alınmış veya telefondaki sürüm incelenmiş sayılmaz. Değişiklik öncesi kaynak saklanarak aynı yerel gezinme senaryosu iki kaynak üzerinde ayrıca çalıştırıldı.

Kullanıcının ekran görüntüsü Ahmed-PC'nin Remote Desktop Commander sunucusunda Online olduğunu gösterdi. Bu sohbetin araç listesinde Remote Desktop Commander, tarayıcı kumandası veya fiziksel cihaz araçları sunulmadı; ortamın capabilities listesi de boştu. Bu nedenle PC/telefon kontrolü yapıldığı iddia edilmez. Şifre, servis hesabı, imzalama anahtarı veya token istenmedi.

## Uygulanan değişiklikler

- Ana sayfa yalnız herkese açık Keşfet akışıdır. Takip ettiklerin filtresi kaldırıldı. Eski istemcilerin followingFeed API'si korunur. Gizli hesaptan yayınlayan kişi kendi profiline döner; gizli gönderi genel keşfete taşınmaz.
- Yeni profiller `isPrivate: false` ile oluşturulur ve kayıt ekranında açık hesap tercihi açıklanır. Kullanıcı daha sonra gizlilik ayarını değiştirebilir. Mevcut gizli hesaplar/özel gönderiler topluca açılmaz. Eski istemcilerin açıkça gizli profil oluşturması da desteklenir.
- Keşfet, üç sütunlu FlatList ile görünür alanı ve çevresini oluşturur. Arama çubuğu düzenlendi; geç dönen eski hesap araması yeni aramanın sonuçlarını değiştiremez.
- Ana sayfa ve boş aramalı Keşfet aynı ilk sayfa anahtarını kullanır. Son 5 saniyede alınan API sonucu hızlı gezinmede tekrar indirilmez. Elle yenileme, mutasyon geçersizleştirmesi ve zamanlı sorgu sunucuya gider. Oturum belleği en fazla 60 saniye/80 okuma; çıkışta temizlenir, diske özel içerik yazılmaz.
- Ön yüklemeden gelen yeni veri hook açılmadan hemen önce hazırsa ilk render yükleme ekranında beklemez. Yeni belge aboneliği son 1,5 saniyelik aynı yetkili okumayı yeniden istemez; açık yenileme bunu atlar. Mesajlar için engel listesi de ön yüklenir.
- Sunucu istek başına profil, hesap durumu ve ayarları tek DB okumasında hazırlar. Hikâye şeridi hesapları sırayla beklemek yerine en fazla dört sorguyla okur ve görünürlük izinlerini topluca hazırlar. Her yeni HTTP isteğinde kimlik, rol, kısıtlama ve gizlilik yeniden denetlenir.
- Bildirimler hesap fotoğraflarıyla Bugün/Bu hafta/Daha önce gruplarındadır. Telefon kurulum/deneme kontrolleri Bildirim ayarları penceresine taşındı. Animasyonlu uygulama içi kart ve hedef ekrana yönlendirme korunur.
- Android alt çubuk, sistem gezinme alanının alt boşluğunu hesaba katar. Fiziksel Android yerleşimi bu ortamda doğrulanmadı.
- Gizlilik sayfası yeni hesap varsayılanını açık olarak anlatır. Canlı kontrol, eski “varsayılan gizli” sayfasıyla derlemeyi durdurur. GUNCELLE_VE_AAB.bat sunucu güncellemesinden sonra mevcut Hosting dosyalarını koruyan yasal yayın yardımcısını çalıştırır.

## Son kontroller

| Kontrol | Sonuç |
|---|---:|
| İstemci TypeScript | Geçti |
| Sunucu TypeScript, Deno girişinin ambient türleri dahil | Geçti |
| Birim testleri | 30/30 |
| Yerel PostgreSQL + gerçek gateway güvenlik/işlev testleri | 30/30 TAP sonucu, üst/alttestler dahil |
| Windows başlatıcı, sürüm, derleme, yasal yayın ve Firebase Android yardımcıları | 47/47 |
| Firebase Auth emulator | 1/1 |
| Tam sosyal tarayıcı paketi | 48/48, atlanan yok |
| Notlar ve onboarding tarayıcı paketi | 4/4 |
| Yeni kaynaktaki benzersiz tarayıcı senaryosu | 52 |
| Android/iOS Hermes ve web üretim dışa aktarımı | Geçti; native binary değildir |
| Expo config introspection | Paket, code8 ve mevcut EAS UUID doğrulandı |

Testlerde gerçek yerel HTTP API, PGlite PostgreSQL, Firebase Auth emulator ve Chromium kullanıldı. Fotoğraf/video/ses yükleme ve çözme, takip/istek kabulü, gizli/engelli içerik, beğeni/yorum, grup kurma/ayrılma, mesaj/yanıt/tepki/düzenleme/silme, hikâye görüntüleme/yanıt, notlar, yeni hesap oluşturma ve profil tercihleri kontrol edildi. Canlı kullanıcılara mesaj/gönderi atılmadı. Expo push taşıma yanıtları kontrollü test yanıtlarıdır; gerçek FCM teslimi değildir.

İlk geliştirme turunda yeni akıştan kaldırılan blok-listesi bağımlılığını bekleyen eski test ve henüz ön yüklenmemiş engel listesine takılan mesaj ekranı kontrolü başarısız oldu. Mesaj ön yüklemesi düzeltildi; blok listesi testi sunucunun izin verdiği akışın ikincil okumaya takılmadığını kontrol edecek şekilde güncellendi. Video testi, zaten yüklenmiş videoda yeniden “yükle” düğmesini aramaya devam ediyordu; hem yüklenmiş hem yüklenmemiş durum korunarak düzeltildi. Gizli paylaşımdan sonra profile dönme beklentileri güncellendi. Son tam 48 senaryo temiz geçti; testler atlanmadı.

## Önce/sonra karşılaştırması

Aynı kaynak senaryosu, aynı yerel sağlayıcılar ve kontrollü veriler kullanıldı. Yeni sürümün soğuk telefon açılışı ölçülmedi.

| Ölçüt | Önce 1.1.4 | Sonra 1.1.6 |
|---|---:|---:|
| Ana sayfa → Keşfet → ana sayfa ve 4 profil dönüşünde liste HTTP istekleri | 10 | 0 |
| Aynı senaryoda profil sayacı HTTP istekleri | 4 | 4 |
| Yerel Keşfet gidiş/dönüşü | 151 ms | 213 ms |
| Yerel 4 profil gidiş/dönüşü | 605 ms | 587 ms |
| 20 satırlık akışta DB get çağrısı | 7 | 5 |
| 25 hikâye sahibinde DB get çağrısı | 106 | 5 |

Yerel ağ çok hızlı olduğu için tekil UI süreleri dalgalanır; Keşfet turundaki 151→213 ms sonucunu hızlanma diye sunmuyoruz. Kesin gözlem tekrar liste isteğinin kaldırılmasıdır. Veritabanı karşılaştırmasında her RPC'ye **yapay 10 ms** eklendi: akış ortancası 114→99 ms, 25 hikâye senaryosu 1.504→182 ms. Bu sayılar üretim/telefon gecikmesi değildir.

Yeni kaynakta ağ yanıtı tutulurken daha önce alınmış profil+gönderi ayrıntısına geçiş 193 ms, gelen kutusu+son konuşmaya geçiş 153 ms idi. 8 profil/ana sayfa turunda toplam 4 belge HTTP isteği ve 0 hız sınırı hatası görüldü. Ana sayfa isteği bekletilirken profil/sohbet ön yüklemesinin bağımsız çalıştığı doğrulandı. Ham sonuçlar artifacts/warm-navigation.json, navigation-1.1.4.json, navigation-1.1.6.json ve nov08-*-before-after.json içindedir.

## Gerçek ekran görüntüleri

Yerel uygulama testinden alınmıştır; çizim veya telefon ölçümü değildir:

- artifacts/nov08-feed.png
- artifacts/nov08-explore.png
- artifacts/redesign-profile.png
- artifacts/redesign-chat.png
- artifacts/redesign-story.png
- artifacts/instant-follow-notification.png

Kalan eski tarihli doküman/artefaktlar tarihsel kayıttır; güncel sonuç için bu rapor ve artifacts/verification.json esas alınır.

## Dağıtımdan önce kalanlar

1. Mevcut gerçek kaynak ve Play Console en yüksek sürüm kodu doğrulanmalı; diğer sohbetin alınmamış değişiklikleri varsa birleştirilmeli.
2. `npm run backend:update` ile mevcut Supabase Edge revizyonu **2026-11-08-public1** yapılmalı. Migration, yeni veritabanı veya Blaze gerekmez.
3. `npm run legal:deploy` ile güncel gizlilik metni mevcut siteyi koruyarak yayımlanmalı; canlı kontroller geçmeli.
4. Mevcut EAS projesi/upload imzasıyla üretim AAB oluşturulmalı. FCM v1 yetkisi resmî Expo akışında kontrol edilmeli; özel anahtar kaynaklara eklenmemeli.
5. Yeni sürüm Play test kanalından fiziksel cihaza güncellenmeli. Gerçek açılış/sekme gecikmesi, pil ve zayıf ağ koşulları, arka plan push teslimi ve dokunma hedefi, Android alt boşluğu, imza/16 KB/mağaza doğrulamaları tamamlanmalı.

Telefon bildirimleri push türündedir; SMS bağlı değildir. Uygulama içi bildirim/mesaj sorguları 3 saniyelik aralık kullanır; anlık teslim garantisi veya uçtan uca şifreleme iddiası yoktur. Instagram'ın tüm özelliklerinin birebir uygulanmış olduğu iddia edilmez.

## Kaynak paketinin kontrolü

ZIP yeniden açılarak tüm manifest hashleri ve uygulama kimliği kontrol edildi. Boşluk ve Türkçe karakter içeren yeni bir dizine çıkarılan kaynakta istemci/sunucu TypeScript ve 23 ilgili sürüm/Firebase/yasal yardımcı testi geçti. Bağımlılıklar mevcut node_modules dizinine bağlandı; temiz npm ci yapılmış olduğu iddia edilmez. Paket özel anahtar veya native AAB/APK içermez.
