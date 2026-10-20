# Birarada 1.0.0 doğrulama raporu

Tarih: 20 Ekim 2026 (Türkiye saati). Linux, Node.js 24.19, Expo SDK 54, React Native 0.81.5. Bu rapor mobil uygulamanın kaynak koduna aittir. Temiz ZIP içinde proje doğrudan `Birarada/` altındadır. Eski Express uygulaması ve bağımsız HTML demosu ayrı ürünlerdir ve bu pakete dahil değildir.

Uygulama adı **Birarada**, Android/iOS kimliği **`com.birarada.app`**, sürüm **`1.0.0`**, ilk Android sürüm kodu **`1`**, Firebase projesi **`birarada-5650c`**. İmzalı mağaza AAB'si, canlı Firebase kurulumu ve gerçek cihaz doğrulaması tamamlanmadı. Bu nedenle bu kaynak paketi üretim yayını onayı değildir.

## Windows tarayıcı yolu düzeltmesi

Windows'ta process.env kopyası ProgramFiles ve ProgramFiles(x86) gibi anahtarların büyük/küçük harfe duyarsız erişimini kaybediyordu. Başlatıcı araması bu farkı giderir; ProgramW6432 ve kullanıcıya özel Chrome/Edge kurulumlarını da kapsar. CHROMIUM_PATH değerinin etrafındaki çift tırnaklar temizlenir. Yanlış açıkça seçilmiş bir tarayıcı yolu sessizce başka tarayıcıya geçmez. 12 başlatıcı testi geçti; yeni testler gerçek Windows anahtar biçimleri, 32/64 bit dizinler, boşluk/Türkçe karakterler ve açık yol seçimini kapsar. Windows yolları testlerde modellenmiştir; gerçek Windows çift tıklaması burada yapılmadı. Node üzerinden BAT önkontrolü geçti.

## Temiz kaynak teslimatı

`Birarada-Temiz-Kod.zip` yalnız mobil projeyi tek `Birarada/` kökü altında içerir. Eski `downloads/Birarada.html`, ayrı HTML demo test dosyası, demo BAT başlatıcıları, eski Express sunucusu, node_modules/derleme çıktıları ve özel dosyalar dahil edilmez. Yasal sayfaların HTML dosyaları `hosting/public/` altında korunur. Şarkılı notlar dahil gerçek mobil kaynaklar, AAB aracı, kurallar ve mobil doğrulama testleri korunur. Arşivdeki her dosya `SOURCE_MANIFEST.json` ile doğrulanır. Bu değişiklik Firebase/Expo hesabı bağlamaz ve AAB üretmez. ZIP ayrı, boşluk ve Türkçe karakter içeren bir dizine açıldı. Bu çıkarılmış proje üzerinden tip kontrolü, 17 birim, 6 yayın ayarı, 10 derleme yardımcısı ve 4 arayüz testi geçti. Node üzerinden gerçek BAT önkontrolü de geçti. Bağımlılıklar bu ortamın mevcut lockfile kurulumundan kullanıldı; yeni Windows kurulumu veya çift tıklama doğrulaması değildir.

## Son ekleme: Spotify/YouTube bağlantılı notlar

Kullanıcının seçimiyle notlara şarkı adı ve Spotify/YouTube bağlantısı eklendi. Ana Sayfa ve Profil'den açılan düzenleyici, takip edilenlerin notları, profil üzerinde not gösterimi, güncelleme/silme, 24 saat sonra görünürlüğün kapanması, iki yönlü engel ve gerçek içerik kopyalı şikâyet kuralları hazırlanmıştır. Hesap temizliği notu da kaldırır. Yasal metinler yeni işlenen verileri ve harici müzik hizmetine geçişi açıklar. Ses dosyası yükleme veya uygulama içinde şarkı çalma eklenmedi. Ayrıntı: [NOTLAR.md](docs/NOTLAR.md).

Son kaynaklarla tip kontrolü, **17 birim**, **6 yayın ayarı** ve **4 arayüz testi** geçti. Dört arayüz testi Windows yardımcısının farklı çalışma klasörü akışından da tekrar geçti; test paketinin yol çözümlemesi buna göre düzeltildi. Not düzenleyicisinin 3 arayüz testi gerçek bileşeni Chromium'da sınar; veri callbacks'i simüle edilmiştir, Firestore uçtan uca testi değildir. Android/iOS Hermes ve web paketlemesi başarılıdır. Notlara ait 6 yeni güvenlik testiyle toplam **40 Firestore testi** hazırlanmıştır; emulator indirme engeli değişmediği için çalıştırılmadılar. Güncel Firestore kuralları canlıya dağıtılmadı. İmzalı AAB yoktur.

## Git/GitHub gerektirmeyen Windows derlemesi

`AAB_OLUSTUR.bat`, kaynaklardan gerçek yerel kontrolleri çalıştırır; başarılı olursa resmi Expo girişini ve gerçek proje oluşturma/bağlama akışını açıp EAS AAB derlemesini başlatır. Proje kimliği uydurulmaz ve Codex ortam değişkeni ekranına elle girilmez. Orijinal kaynaklar korunur, çalışma kopyası ve gerçek public proje bilgisi `.birarada-release` içinde tutulur. Derleme için Git/VCS kullanımı kapalıdır. Kullanıcının sonraki isteğiyle kaynak indirme paketi GitHub üzerinden paylaşılmıştır; bu, EAS hesabının bağlandığı veya AAB üretildiği anlamına gelmez.

`npm run test:no-github`: **10 geçti**. Hata/durdurma, eksik giriş ve ağ ayrımı, yanlış kimlik reddi, kimlik koruma, dosya/çalışma kilidi ve komut güvenliği testleri ile gerçek Expo config çözümlemesi geçmiştir. EAS ağ yanıtları modellenmiştir; gerçek hesap/AAB testi değildir. Windows'a uyarlanan Node başlangıç komutu ve BAT önkontrolü Node üzerinden Linux'ta geçti; gerçek Windows çift tıklaması yapılmadı. Firestore testlerinin ve native derlemenin ağ engelleri devam eder. Ayrıntılar [derleme rehberindedir](docs/GITHUB_GEREKTIRMEYEN_DERLEME.md).

## Tamamlanan kontroller

| Kontrol | Gerçek sonuç ve kapsam |
| --- | --- |
| `npm run typecheck` | Geçti. Strict TypeScript; uygulama ve test dosyaları. |
| `npm test` | **17 geçti.** Türkçe hata eşlemeleri ve kullanıcı adları; silmeden önce yeniden doğrulama, temizlik hatasında Auth hesabını koruma ve tekrar deneme; akış kayıtlarının güncelliği ve tekilleştirilmesi; güvenli şarkı bağlantıları, not doğrulaması ve 24 saat sınırı. Bunlar birim testleridir. |
| `npm run test:release` | **6 geçti.** Sabit uygulama kimliği, çelişkili kimlik/sürüm/proje ayarlarının reddi, emulator/Storage bayrakları, eksik EAS UUID'si ve güvensiz/yertutucu URL'lerin reddi. Testteki sentetik UUID gerçek bir EAS projesi değildir. |
| `npm run test:auth` | **1 geçti.** Gerçek Firebase Authentication Emulator üzerinde kayıt, çıkış, yanlış şifrenin reddi, giriş ve şifre sıfırlama isteği. Demo hesap temizlendi; canlı hesap oluşturulmadı. |
| `npm run test:ui` | **4 test geçti.** 390×844 Chromium'da onboarding/giriş/kayıt onayı ve yasal bağlantılar; gerçek not düzenleyicisinde şarkı bağlantısı doğrulaması, hata durumunda taslağı koruma, onaylı silme ve eşzamanlı güncellemelerde taslağı koruma. Gerçek kayıt isteği gönderilmedi. Not veri callbacks'i simülasyondur; Firebase entegrasyonu değildir. |
| `npm run test:launcher` | **10 geçti.** Node/Java sürümleri, güvenli test ortamı, dolu porttaki servisi koruma, HTTP hazır olma/hata/zaman aşımı, beklenmedik süreç çıkışı ve yalnız başlatılan süreç ağacını kapatma. Linux üzerinde; gerçek Windows çift tıklaması doğrulanmadı. |
| `expo export --platform all --max-workers 2` | Geçti. Son kaynaklardan Web JS, Android/iOS Hermes ve asset paketleri üretildi. APK, AAB veya IPA değildir. |
| Firebase Hosting emulator + Chromium | **22 kontrol geçti.** Dört yasal sayfa ve CSS HTTP 200; alakasız rotalar 404; 320/390/1280 pikselde taşmasız görünüm, gezinme, mailto talebi ve klavye erişimi. Script/harici takip kaynağı yok, tarayıcı hatası yok. Canlıya dağıtım değildir. |
| Android prebuild | İzole kopyada geçti. Sabit paket/sürüm, ikon kaynakları ve native proje üretildi. Ana manifestte `INTERNET`, kapalı yedekleme ve gereksiz izinlerin engellenmesi incelendi; nihai birleşmiş binary manifestinin yerine geçmez. |

Not düzenleme ekranı: [music-note-mobile.png](artifacts/music-note-mobile.png). Hosting için aşağıdaki 22 kontrol, önceki metinlerle yapılmıştır; yeni paragrafların canlı yayını doğrulanmadı.

Hosting kanıtı: [hosting-validation.json](artifacts/hosting-validation.json), [mobil görünüm](artifacts/privacy-mobile.png). Uygulama açılış görüntüsü: [auth-mobile.png](artifacts/auth-mobile.png).

Ortam taslağına kaydedilen `install_script` baştan sona çalıştırılıp exit 0 ile tamamlandı: eski web uygulamasının veri değiştiren preinstall adımı kapalı tutuldu; mobil `npm ci` lockfile ile 1314 paket kurdu, ardından tip kontrolü, 9 birim ve 6 yayın testi geçti. `start_skill`, önbellek yolları, servisleri yeniden başlatma, Android araçlarını etkinleştirme ve açık engelleri içerir. Ortam taslağının yayımlanması ve yeni bir görevde geri yükleme doğrulanmadı.

## Android native derleme

Resmî kaynaklardan doğrulanmış JDK 17/21, Gradle 8.14.3, Android platform 36, build-tools 35/36, NDK 27.1.12297006 ve CMake 3.22.1 kuruldu. Dağıtım checksum kayıtları [android-toolchain.json](artifacts/android-toolchain.json) içindedir. Native derleme, kök bağımlılıkları değiştirmeyen izole kaynak kopyasında iki Gradle worker ile çalıştırıldı.

`assembleDebug -PreactNativeArchitectures=arm64-v8a` **95 Gradle adımından sonra hata verdi**. React Native ve Hermes 0.81.5 AAR dosyaları için Maven Central, resmî `repo.reactnative.dev` adresine yönlendiriyor; bu hedef ortam proxy'sinden HTTP 403 alıyor. Debug ve release artifact adresleri için aynı engel doğrulandı. Bu, çözümlenmiş bir uygulama derleme hatası değildir: tam native derleme henüz doğrulanamadı. APK/AAB oluşmadı; nihai binary manifesti, imza, zipalign ve 16 KB native kitaplık uyumluluğu kontrolleri çalıştırılamadı. Ağ taslağına `repo.reactnative.dev` eklendi; uygulandıktan sonra korunmuş Gradle önbelleğiyle yeniden denenmeli.

Derleme kanıtı: [android-native-validation.json](artifacts/android-native-validation.json), [kısa sonuç](artifacts/android-native-summary.txt). Başlatılan Gradle/Kotlin süreçleri durduruldu; uygulama kaynakları ve bağımlılık çıktıları izole kopyada tutuldu.

Android cihaz/emulator çalıştırma yapılmadı; ortamda `/dev/kvm` yok. Expo/EAS hesabı oturumu ve gerçek EAS proje UUID'si bulunmuyor. İmzalı üretim AAB'si oluşturulmadı, Play Console'a yükleme yapılmadı.

## Çalıştırılamayan güvenlik ve entegrasyon kontrolleri

`npm run test:rules`, resmî Firestore Emulator JAR indirmesinin `storage.googleapis.com` isteğinde ortam proxy'sinden HTTP 403 aldı. Runner aşamasına ulaşılmadı: **hazırlanmış 40 Firestore güvenlik testi çalışmadı; hiçbirinin geçtiği iddia edilmiyor.** Kuralların çalışma zamanı derlemesi de doğrulanmadı. TLS ve checksum kontrolleri kapatılmadı, testler atlanarak başarı üretilmedi.

Hazır testler profil/kullanıcı adı atomikliği, onay kaydı, tür/alan sınırları, değişmez sayaçlar, gizli gönderi/takip/engel erişimi, sorgu kapsamları, beğeni/yorum yetkileri, takip istekleri, sohbet üyeliği ve DM tercihleri, mesaj düzenleme/görüldü, atomik takip bildirimleri, gerekçeli raporlar, silme durumu ve alt kayıt temizleme izinlerini kapsıyor. Statik inceleme çalışma zamanı testlerinin yerini tutmaz.

Profil oluşturma/düzenleme, gönderi/beğeni/yorum, takip/kabul, DM, bildirim, engelleme, raporlama ve hesap silmenin **gerçek uygulama + Firestore uçtan uca testi yapılmadı**. Auth SDK testi bu akışları doğrulamaz. Android/iOS cihazı, native oturum kalıcılığı, ağ kesintisi, web Google OAuth ve gerçek medya da doğrulanmadı.

## Hesap silme ve güvenlik değişiklikleri

Kayıt/profil tamamlama için topluluk kurallarının kabulü zorunlu. Raporlar gerekçeli; gönderi raporu ilgili gönderi kimliğini içeriyor. Engellenen hesaplar arayüzde filtreleniyor; yükleme/okuma hatası engel denetimini sessizce aşmıyor. Kurallar kimlik, alanlar, zaman damgaları, değişmez sayaçlar, üyelik, iki yönlü engelleme ve silme durumu için sıkılaştırıldı.

Silme önce yeniden kimlik doğrular ve yerel/uzak `deletionPending` işaretini kaydeder. Kendi gönderilerini ve alt kayıtlarını, kendi yorum/beğeni/mesajlarını, bağlantılarını, özel kayıtlarını, bildirimlerini ve kendi raporlarını kaldırır. Profil ve kullanıcı adı aynı transaction'da, Auth hesabı en son silinir. Yarıda kalan işlem için kurtarma ekranı vardır. Profil kaldırıldıktan sonra Auth silmesi başarısız olursa, tekrar denemede artık izin verilmeyen sohbet önizleme yazımı atlanır; bu hata regresyon testiyle kapsandı.

Temizlik istemci tarafından birden fazla işlemde yapılır, sunucu tarafında atomik değildir. Başkalarının mesajları, sohbet üyelik geçmişi ve başkalarının yaptığı raporlar otomatik silinmez. Bağımsız gönderi silmeyle aynı anda gelen alt kayıtlar için yarış ihtimali vardır; güvenilir sunucu temizliği ve saklama politikası hâlâ gereklidir. Tam silme garantisi verilmez.

## Canlı hizmetlerin durumu

- Firebase CLI yetkili Hosting listeleme girişimi oturum olmadığı için kimlik doğrulama hatası verdi. Auth sağlayıcıları, canlı Firestore kuralları/indeksleri ve mevcut Hosting sürümü doğrulanmadı. Canlı veri/kurallar/altyapı değiştirilmedi.
- EAS `whoami` sonucu `Not logged in`. Güncel CLI'nin parolasız `login --device --non-interactive` akışı da denendi; giriş bağlantısı üretmeden HTTP 403 aldı. Önce ağ erişimi ve ardından güvenli Expo oturumu gerekir. Yeni EAS projesi oluşturulamadı; UUID veya üretim imzalama anahtarı uydurulmadı. Gerçek oturumdan sonra [PLAY_STORE_RELEASE.md](docs/PLAY_STORE_RELEASE.md) uygulanmalı.
- `/privacy`, `/delete-account`, `/terms`, `/child-safety` sayfaları gerçek Türkçe içerikle hazır ve yerel olarak testli. Canlıda yayımlanmadı. Mevcut sitenin tam çıktısıyla birleştirilmeden legal klasörü tek başına Hosting'e dağıtılmamalı; [HOSTING.md](docs/HOSTING.md) adımları mevcut siteyi korur.
- Üretim `release:check` komutu bu ortamda gerekli gerçek EAS UUID'si ve açık production bayrakları olmadığından hata verir. Bu, önkoşul eksikliğidir; altı guard birim testinin başarısıyla karıştırılmamalı.
- Gerekli Expo/Firebase alan adları ortam ağ taslağına kaydedildi. Taslak kaydı mevcut runtime'a uygulandığı veya ortamın yayımlandığı anlamına gelmez.

## Desteklenen kapsam ve eksikler

Kodda email/şifre Auth, profil tamamlama/düzenleme, şarkı bağlantılı notlar, public sayfalı akış, profil gönderileri, metin paylaşımı, beğeni/yorum/kaydetme, takip istekleri, kullanıcı adı öneki araması, metin DM, takip bildirimleri, engelleme/raporlama, ayarlar ve hesap silme bulunuyor. Bu liste, yukarıda çalıştırılamayan Firebase akışlarının doğrulandığı anlamına gelmez.

Storage kapalıdır; kurallar medya URL'lerini ve Storage erişimini reddeder. Galeri/kamera/kısa video sekmesi ve native Google düğmesi gizlidir. Anlar/Yakınlar, öne çıkanlar, grup/ses/medya DM, cevap/reaksiyon/yazıyor bilgisi, hashtag/içerik araması, repost, push, güvenilir sayaç agregasyonu, yaş denetimleri ve native Google OAuth tamamlanmadı. Native Firestore JS SDK kalıcı disk önbelleği sağlamaz; web IndexedDB cache vardır.

Profil alanları giriş yapan kullanıcılara açıktır; e-posta Auth'ta kalır. Gönderi görünürlüğü oluşturulurken sabitlenir, hesap gizliliği eski gönderileri dönüştürmez. Public gönderiler public kalır; engelleme bunların arayüzde gizlenmesini ve etkileşim kısıtlarını sağlar. Eski sohbet geçmişi üyelere açık kalır. Sunucudan spam/rate limiting, App Check ve işletilen moderasyon süreci yoktur.

## Yayın için kalan somut işler

1. Ortam ayarlarındaki ağ taslağını gözden geçirip kaydedin ve ortamı yayımlayın. `repo.reactnative.dev` erişimiyle native derlemeyi, `storage.googleapis.com` erişimiyle 40 güvenlik testini ve kritik uygulama + emulator entegrasyon akışlarını tamamlayın. EAS giriş API'sinin HTTP 403 engeli de giderilmeli. Taslak kaydı bu engellerin ortadan kalktığı anlamına gelmez.
2. Firebase'e kendi hesabınızla güvenli giriş yapın, sağlayıcıları ve backend'i doğrulayın; test edilmiş kuralları/indeksleri dağıtın. Yasal sayfaları mevcut siteyi koruyarak yayımlayıp oturumsuz canlı URL'leri kontrol edin.
3. Yeni EAS projesini kendi hesabınızda oluşturup gerçek UUID'yi bağlayın; gerçek telefonda iki hesapla bütün kritik akışları ve hesap silmeyi test edin. Ardından üretim imzasıyla ilk AAB'yi oluşturun.
4. İşleyen moderasyon/çocuk güvenliği/destek ve silme talebi süreçlerini, saklama sürelerini ve veri sorumlusu açıklamalarını kesinleştirin. Play Data safety, hedef yaş, içerik derecelendirmesi, mağaza kaydı ve hesap özelindeki test koşullarını gerçek davranışa göre tamamlayın. Önce internal testing ve pre-launch report sonuçlarını inceleyin.

Kaynak kodunda şifre, service account, private key veya üretim imzalama anahtarı bulunmaz. Kullanıcının sağladığı Firebase web istemci yapılandırması herkese açık uygulama yapılandırmasıdır.
