# Birarada sosyal özellikler — doğrulama

21 Ekim 2026, Türkiye saati. Linux / Node24.19 / Java21 / Expo54 / React Native0.81.5. **Yeni imzalı AAB üretilmedi. Canlı Firebase dağıtımı, owner hesabı ve gerçek telefon doğrulaması tamamlanmadı.** Bu paket kaynak koddur ve Play'e yükleme dosyası değildir.

## Bu çalışmada gerçekten geçen kontroller

| Kontrol | Sonuç |
| --- | --- |
| Uygulama TypeScript | Geçti |
| Mevcut uygulama/şarkılı not birim testleri | 17/17 |
| Kimlik/üretim ayarı korumaları | 6/6 |
| GitHub gerektirmeyen derleme aracı | 13/13; canlı kontrol başarısızsa EAS'e ulaşmama ve mevcut credentials'ı koruma dahil |
| Yerel başlatıcı | 10/10 |
| Sunucu TypeScript + politika/gerçek medya işleme | 11/11; gerçek JPEG normalleştirme, video ve ses FFmpeg8 dönüşümü |
| Firestore güvenlik kuralları | 46/46; önceki 40 ve yeni admin/protocol/media/suspension testleri |
| Auth emulator | 1/1 |
| Gerçek Auth + Firestore + Functions API entegrasyonu | 12/12; dış test kabı dahil |
| Firestore handler/timeline/bildirim/temizleme | 5/5; dış test kabı dahil |
| Mevcut onboarding/şarkılı not Chromium arayüzü | 4/4 |
| Gerçek giriş/fotoğraf retry/hikâye/admin Chromium arayüzü | 3/3 |
| Android ve iOS üretim JavaScript/Hermes export | Geçti; native Gradle/Xcode veya imzalı AAB derlemesi değildir |
| Kendi JS kodunu taşıyan AAB_OLUSTUR.bat | Node sözdizimi + Node/Java/Chromium önkontrolü geçti; Windows'ta uçtan uca yeniden çalıştırılmadı |

Son arayüz tekrarında sosyal paket14,7 saniye, mevcut paket6,7 saniyede geçti. Rapor test gruplarını ayrı gösterir; üst test kapları bağımsız ek özellik sayılmaz. Test atlama yoktur.

## Nelerin sınandığı

Sunucu kontrolleri gerçek yerel Auth/Firestore/Functions süreçlerini kullanır: anonim/sahte admin reddi, doğrulanmış tek UID'ye owner bağlama, başka kullanıcının yüklemesini ele geçirememe, SVG reddi, özel medya takip/engelleme ve token erişimi, byte-range/no-store, gerçek video dönüştürme ve etiket araması, hikâye süresi/izleyenler/öne çıkanlar, DM izinleri/medya/yanıt/tepki/görüldü, gruptan ayrılma, şikâyete özgü moderasyon erişimi, kısıtlama ve silme öncesi medya temizliği.

Gerçek uygulama tarayıcı kontrolleri örnek giriş ekranı kullanmaz: emulator Auth ile giriş, gerçek PNG seçimi ve HTTP yükleme, bir paylaşım isteğine kontrollü503 sonrası taslağı koruyarak tek kayıt oluşturma, hikâye ekleme/öne çıkarma, gerçek server custom claim'li yönetim panelinde onay öncesi hesap durumunu değiştirmeme ve onay sonrası kısıtlama yapılır.

## Açık test sınırları

- Medya nesneleri entegrasyon testinde yalnız `demo-birarada` + Functions Emulator + açık geçici dizin koşulunda yerel dosyada saklanır. Auth/yetki ve medya dönüştürme gerçektir; **Google Cloud Storage IAM/bucket entegrasyonu test edilmedi**.
- Firestore emülatörü resmî Google Cloud SDK dağıtımından doğrulanmış1.22.0 JAR ile çalıştırıldı. Kaynak/checksum/launcher: `artifacts/firestore-emulator-distribution.json`. Kurallar gerçek emulatörde çalıştı; canlı composite-index gereklilikleri emulator tarafından doğrulanmaz. Yeni sorguların indeksleri kaynakta eklendi; canlı hazır durumu beklenmeli.
- Bulutta Firestore dış süreçte çalıştığı için otomatik tetikleyici teslimi Functions Emulator tarafından kaydedilemedi. Handler'lar gerçek emulator belge anlık görüntüleriyle doğrudan çağrılarak test edildi; Cloud Eventarc/Scheduler teslimi değildir.
- Push payload/invalid-device temizliği kontrollü sahte Expo yanıtıyla test edildi. **Gerçek Expo/FCM cihaz teslimi yapılmadı.** Kullanıcının güvenli EAS/Firebase credentials kurulumu gerekir.
- Kamera/mikrofon/galeri gerçek Android cihazda, büyük medya/yük/erişilebilirlik testleri, son native binary 16 KB sayfa uyumluluğu ve Play Console ön kontrolleri yapılmadı.

## Düzeltilen somut sorunlar

Yeni expo-audio kurulurken yanlış çözümlenen expo-asset58 bağımlılığı açılışı bozuyordu. Expo54 ile uyumlu expo-asset12 ve expo-constants18 doğrudan sabitlendi; gerçek web açılışı ve Android/iOS bundle tekrar geçti. İlk yükleme için commit + gerçek onboarding görünürlüğü beklenir; süre artırarak bozuk bundle gizlenmez.

Sunucu rolleri istemci/e-posta alanından verilmez; her yönetim isteğinde güncel Auth custom claim/verified-email ve iptal edilmiş token durumu kontrol edilir. Yeni medya token URL'si üretmez. Kısıtlama Firestore profilini/status kaydını atomik günceller. Hesap silme sunucu medyasını ve gönderileri temizler; profil kaldırıldıktan sonraki tekrar deneme de desteklenir. Değişmiş içerikle aynı yayın/mesaj işlem kimliği yeniden kullanılırsa hata verir.

## Canlı yayın engelleri

Bu ortamda yetkili Firebase/Expo oturumu yoktur; ilgili dış servisler mevcut ağ politikasıyla erişilebilir değildir. `release:live` gerçekten çalıştırıldı ve başarısız oldu; üretim derlemesi durduruldu. Canlı backend/indeksler/yasal sayfalar yayımlanmadı. Blaze planının açık olup olmadığı bilinmiyor. Ücretli plan kendiliğinden açılmadı.

Kullanıcının daha önce Windows'ta oluşturduğu EAS projesi **@ahmedberat/birarada**, UUID **9c50fe74-fec2-4f09-b4b2-c1711f4e9b6b** kaynakta korunur. Android paket **com.birarada.app**, version1.0.0/code1; kullanıcı eski AAB'yi henüz Play'e yüklemediğini bildirdi. Eski AAB yeni sosyal özellikleri içermez. Yeni yardımcı mevcut keystore'u `--freeze-credentials --non-interactive` ile kullanır; yeni anahtar oluşturmaz.

`ahmedberatazboy0@gmail.com` için canlı Auth hesabı/owner claim bu ortamda oluşturulmadı. Sunucu yapılandırması + kullanıcının gerçek e-posta doğrulamasından sonra uygulamadaki resmî hesap etkinleştirmesi gerekir. Sağlanan parola kaynaklara veya raporlara yazılmadı.

Kurulum: `FIREBASE_KUR.bat`, [CANLI_KURULUM.md](docs/CANLI_KURULUM.md), [HOSTING.md](docs/HOSTING.md), ardından `AAB_OLUSTUR.bat`. Play incelemesi, hesap özelindeki test şartları, veri beyanları ve işletilen moderasyon/destek süreçleri ayrıca gerekir. Her şeyin hatasız veya bu gece yayımlanacağı iddia edilmez.
