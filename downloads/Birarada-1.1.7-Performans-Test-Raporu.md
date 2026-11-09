# Birarada 1.1.7 — performans, hata giderme ve Android raporu

9 Kasım 2026. Bu teslim **kaynak kodudur**. Telefona kurulmadı, canlı Edge/yasal sayfa dağıtımı veya imzalı AAB üretilmedi. Android'de 2 saniye altı sıcak açılış doğrulanmadı; hedef olarak korunur.

Paket `com.birarada.app`, aday **1.1.7 / versionCode9**. Mevcut EAS `@ahmedberat/birarada` / `9c50fe74-fec2-4f09-b4b2-c1711f4e9b6b` ve upload imzası korunur. Code9, Play Console'dan okunmuş en yüksek kod değildir. Temel, önceki doğrulanmış **1.1.6 kaynak teslimidir**; telefondaki binary'nin kaynak hash'i karşılaştırılamadı.

## 1. Tespit edilen sorunlar

- Akış verisinin gelmesi, fotoğrafın indirildiği/çizildiği anlamına gelmiyordu. Fotoğraf hatası ve zaman aşımı için bağımsız görünür durum yoktu; gri kutucuk uzun süre kalabiliyordu.
- Tek bir özel JPEG isteğinde aynı izin/profil/engel belgeleri tekrar okunuyordu: kontrollü karşılaştırmada **16 DB get** çağrısı.
- Her medya bileşeni ayrı Firebase token dinleyicisi ve 40 dakikalık zamanlayıcı açıyordu. Çoklu görüntüde gereksiz çoğalma oluşuyordu.
- Profilin değişmeyen revizyonu da oturum store'unu güncelleyip bütün uygulamanın yeniden çizilmesine yol açabiliyordu. İkincil ön yükleme ilk ekranla aynı anda başlıyordu.
- Android gönderi/mesaj videoları oynatılmasalar da kaynak hazırlayabiliyordu. Reels komşu kartları gereksiz oynatıcı hazırlayabiliyor, görünmeyen kartların düğmeleri erişilebilirlik odağında kalabiliyordu.
- Arama kutusunun klavyesi açıkken ilk dokunuşun kaybolması ve 300 ms gecikmeli arama sırasında önceki hesabın sonucuna dokunulması mümkündü. Keşfet/sohbet listelerinde dokunma davranışı eksikti.
- Sohbet yazma alanı Android sistem alt boşluğu/klavye için özel bir yerleşim taşımıyordu. Hikâye silme sonrası yeni önbellek kaydı tekrar gösterilebiliyordu.
- Android yerel Crashlytics entegrasyonu ve ayrı açılış/istek aşaması gözlemleri yoktu.

**Mevcut mimari:** Firebase JS Authentication kullanılır. Sosyal kayıtlar Supabase PostgreSQL, özel medya Supabase Storage, yetkili işlemler Edge gateway üzerindedir. Bu istemci Firestore/Firebase Storage kullanmaz. Bu nedenle Firestore sorgusu/kuralı değiştirilmedi; mevcut SQL/RPC erişimi, medya izinleri ve rol/gizlilik sınırları test edildi.

## 2. Değiştirilen başlıca dosyalar

| Dosyalar | Değişiklik |
|---|---|
| App.tsx, index.ts, src/firebase/client.ts | Aşama ölçümleri, yavaş başlangıçta tekrar deneme, değişmeyen profil revizyonunu yeniden yazmama, güvenli hata yakalama |
| src/navigation/Root.tsx, src/services/prefetch.ts | Ana çerçeve ölçümü, Root memo, iptal edilebilir gecikmiş ön yükleme |
| src/components/ProtectedMedia.tsx, src/hooks/useMediaToken.ts, src/utils/mediaTokenStore.ts | Tek token aboneliği, medya yükleme/hata/süre sınırı, tekrar deneme, sınırlı video hazırlığı |
| src/screens/Media.tsx, src/components/PostCard.tsx | Görünür Reels önceliği, tek sonraki video, isteğe bağlı gönderi videosu, görünmeyen kartın erişilebilirliği |
| src/components/ui.tsx, src/screens/Messaging.tsx, app.json | Yazma alanı/alt boşluk/klavye düzeni; arama listesinde ilk dokunuş; Android resize |
| src/screens/Discovery.tsx | Arama geçişinde önceki sonucun tıklanmasını engelleme, klavye dokunma davranışı |
| src/database/client.ts, src/services/api.ts, src/utils/readTimings.ts | Sınırlı ve kişisel veri içermeyen süre kayıtları, eksik cache geçersizleştirmeleri |
| supabase/functions/birarada/core.ts, gateway.ts | Aynı istekte toplu medya izin okuması, Server-Timing, mevcut yetki sınırlarını koruma |
| plugins/withAndroidDiagnostics.cjs, src/services/diagnostics.native.ts, src/utils/diagnosticsController.ts | Android Crashlytics, varsayılan kapalı/açık onay, debug koruması, tercih hatasında gönderimi kapatma |
| src/utils/startup.ts, technicalIssues.ts, src/screens/ConnectionCheck.tsx, Diagnostics.tsx | Açılış/okuma aşamaları, temiz teknik hata kodları ve ayarlar |
| hosting/public/privacy.html, scripts/check-live.cjs, YASAL_YAYINLA.cjs | İsteğe bağlı Crashlytics açıklaması; güncel politika ve Edge sürümünün yayın kontrolü |
| tests/, integration-ui/ | Medya yetkisi, oturum yarışları, onay, yavaş/çevrimdışı ağ, yazma alanı ve Reels gerileme kontrolleri |

Yeni JavaScript bağımlılığı eklenmedi. Android eklentisi yerel Firebase BoM35.0.2 / Crashlytics21.0.0 ve Gradle eklentisi3.0.8 kullanır. plugins/ klasörü EAS derleme kopyasına ve kaynak ZIP'e dahil edilir.

## 3. Yapılan optimizasyonlar ve güvenlik

- Medya yetkilendirmesi **aynı HTTP isteği içinde** toplanır. Yeni istekte oturum, aktif hesap, engel, görünürlük, süre ve sohbet üyeliği tekrar denetlenir. Yetkiler farklı istekler/hesaplar arasında önbelleğe alınmaz. Medya özel kalır, `no-store` ve Range desteği korunur.
- 30 medya bileşeninde **tek** Firebase dinleyicisi/zamanlayıcısı kullanılır. Son bileşen kapanınca temizlenir. Hesap değişiminden geç gelen token atılır; başarısız token alımı elle yeniden denenebilir.
- Önceki sınırlı oturum belleği, sayfalama, aynı okumaları birleştirme ve tek Keşfet akışı korunur. Diskte özel medya önbelleği açılmaz. Mevcut gizli hesaplar/veriler değiştirilmez.
- İkincil profil/sayaç işleri 250 ms, gelen kutusu işi 750 ms sonra başlar; oturum/ekran kapanınca bekleyen zamanlayıcılar iptal edilir. Bunlar garanti performans sınırı değildir.
- Android Reels en fazla etkin ve sıradaki tek videoyu hazırlar. İleri tampon 3 saniye/hedef 2 MB ile sınırlanır; gerçek toplam süreç RAM'i bu sınır değildir. Web sonraki özel videoyu indirmez. Gönderi/mesaj videosu dokunarak yüklenir. Sekme/arka plan değişiminde oynatma durur ve ilgili oynatıcılar kaldırılır.
- Fotoğraf 5 saniye uzarsa yavaş bağlantı bilgisi, 25 saniyede hata/tekrar deneme gösterir. Medya oturum doğrulaması da süresiz spinner yerine yeniden deneme sunar. Liste verisi ve fotoğraf ayrı durum taşır. Video SDK hatası uygulama yerine ilgili oynatıcıda yeniden deneme gösterir.
- Crashlytics gönderimi varsayılan kapalıdır. Açık onay yalnız yeni üretim Android sürümünde kullanılabilir. Debug, web/iOS ve onay okuma/yazma hataları uzak gönderimi etkinleştirmez. JS hata kayıtları yalnız sabit kategori/kod taşır; ham mesaj/yığın, e-posta, UID, token veya sohbet metni eklenmez. Bozuk raporlama servisi mevcut global hata işleyicisini engellemez.
- Native Java çökme raporları teknik yığın, Android/model/sürüm ve SDK kurulum tanımlayıcılarını içerebilir; anonimlik iddiası yoktur. NDK/C++ sembol yüklemesi eklenmedi. SDK'ya deneme kaydı verilmesi Firebase konsoluna ulaştığı anlamına gelmez.

## 4. Ölçümler: önce ve sonra

**Fiziksel Android:** Bu oturumda ölçüm yok. Kullanıcının paylaştığı önceki raporda Activity yaklaşık 0,6–0,7 saniye, ilk fotoğraf 14–16 saniyeydi; bunlar bu çalışmada benim aldığım ölçümler değildir. Yeni kaynakta Android Activity, sistem Splash, fiziksel ilk fotoğraf veya sıcak açılış için karşılaştırılabilir son ölçüm yoktur. **2 saniye hedefi sağlandı denemez.**

Aynı hesap senaryosu, aynı küçük 389 baytlık JPEG, yerel Auth emulator/PGlite/gateway ve Chromium geliştirme paketiyle ayrı beşer yeniden yükleme:

| Yerel ölçüt (ortanca) | 1.1.6 | 1.1.7 |
|---|---:|---:|
| Kalıcı oturumla ana çerçeve | 256 ms | 266 ms |
| İlk JPEG hazır / yeni yükleme kaplaması kalkmış | 402 ms | 409 ms |
| Özel JPEG isteğinde DB get sayısı | 16 | 5 |
| Her DB RPC'sine yapay 10 ms eklenen medya yolu | 164 ms | 87 ms |

Tarayıcı süreleri benzer; bu verilerden arayüz açılışının hızlandığı sonucu çıkarmıyorum. Kanıtlanan azalma tekrar edilen izin okumalarındadır. Yapay gecikme, küçük yerel resim ve tarayıcı yeniden yüklemesi gerçek fotoğraf/telefon/üretim bağlantısını temsil etmez. Android hedefiyle bu sayılar karşılaştırılmamalı.

Yeni istemcide ayrı üç yerel ölçümden aşamalar:

| Aşama | Aralık |
|---|---:|
| Firebase initializeApp/initializeAuth çağrılarının süresi | 0–0 ms |
| JS marka ekranının görünür kaldığı süre | 55–64 ms |
| Auth callback hazır (JS başlangıcından) | 39–50 ms |
| Profil hazır (JS başlangıcından) | 67–76 ms |
| Ana çerçeve layout (JS başlangıcından) | 119–129 ms |
| Akış verisi hazır (JS başlangıcından) | 135–140 ms |
| İlk içerik fotoğrafı onDisplay (JS başlangıcından) | 192–227 ms |

Initialize süresi SDK import/Android native başlangıcının veya ağdaki oturum kontrolünün toplamı değildir. Diğer satırlar başlangıçtan itibaren zaman noktalarıdır, birbirine eklenmez. Native sistem Splash, Activity ve ekrandaki gerçek fiziksel piksel bu JS kaydından ölçülmüş sayılmaz. Arka plandan dönüşte ayrı `resume-js-frame` kaydı açılır; bu da native sıcak başlangıç yerine geçmez.

Ham veriler: artifacts/117-startup-before-after.json, 117-browser-startup.json, 117-media-before-after.json, warm-navigation.json. Yeniden üretim için integration-ui/startup-benchmark.spec.ts ve scripts/benchmark-media.mts bulunur.

## 5. Test sonuçları

| Kontrol | Sonuç |
|---|---:|
| İstemci TypeScript | Geçti |
| Sunucu TypeScript (Deno girişinin ambient türleri dahil) | Geçti |
| Birim testleri | 40/40 |
| Yerel PostgreSQL/gateway güvenlik ve işlev testleri | 31/31 TAP sonucu; üst/alttestler dahil |
| Başlatıcı/sürüm/derleme/yasal yayın/Firebase Android/eklenti yardımcıları | 48/48; gerçek Windows yürütmesi değildir |
| Firebase Auth emulator | 1/1 |
| Tam sosyal Chromium paketi | 57/57; atlanan yok |
| Not/onboarding Chromium paketi | 4/4 |
| Benzersiz tarayıcı senaryosu | 61 |
| İzole başlangıç tekrarları | Yeni kaynak 2, temel kaynak 1 test; hepsi geçti |
| Android/iOS Hermes + web üretim JS dışa aktarımı | Geçti; native APK/AAB değildir |
| Android prebuild/eklenti idempotensi | Geçti |
| Android debug Kotlin derlemesi | Bağımlılık indirirken HTTP403 ile durdu |
| Android release Kotlin derlemesi | Tamamlanmadı; native başarı iddiası yok |
| Fiziksel Android / düşük RAM / pil / klavye | Bu ortamda test edilmedi |
| Gerçek Crashlytics/FCM konsol veya telefon teslimi | Doğrulanmadı |

Gerçek yerel HTTP, Auth emulator ve PostgreSQL uyumlu PGlite kullanıldı. İki yerel hesapla yayın, başka hesaba görünürlük, gizlilik/engel, takip kabulü, grup oluşturma/ayrılma, mesaj/yanıt/tepki/düzenleme/silme, fotoğraf/video/ses, hikâye/öne çıkarma, beğeni/yorum kontrol edildi. Not bileşeni testlerinin kontrollü callback yanıtları vardır; bunlar canlı Firebase entegrasyonu değildir. Otomasyon canlı kullanıcılara gönderi/mesaj göndermedi.

Ek kritik kontroller: gerçek tarayıcı çevrimdışı modunda mesaj taslağı kaybolmadı; bağlantı açılınca tek kayıt gönderildi. 503, 15 saniye geciktirilmiş yeniden doğrulama, 25 saniyelik takılan resim, yanlış sırada gelen arama, eski hesabın token yanıtı, başarısız onay kaydı ve 30 medya aboneliği test edildi. Engellemeden sonraki yeni resim isteği Storage okunmadan 403 döndü. Üç Reels kaydında web yalnız görünür videoyu indirdi; sekmeden çıkınca video elementi kalmadı. Küçültülmüş tarayıcı yüksekliğinde yazma alanı/draft testi geçti; bu fiziksel Android klavyesi değildir.

Geliştirme turunda çoklu Reels kaydı, global “Kaydet” test seçicisinin birden fazla kartla eşleşmesini ortaya çıkardı; test ilgili kartla sınırlandı, görünmeyen kartların erişilebilirliği düzeltildi. Arama/klavye geçişindeki kayıp ilk dokunuş da düzeltildi. Son tam 57 senaryo temiz geçti; testler atlanmadı veya zaman eşiği yükseltilerek gizlenmedi.

**Native engel:** Resmî Android SDK/NDK, Gradle ve Java17 kuruldu. Prebuild yalnız yerel derleme doğrulaması için sentetik, açık Google yapılandırmasıyla üretildi; bu fixture ZIP'e eklenmez. Gradle, React Native/Hermes0.81.5 AAR isteğinin yönlendirildiği `repo.reactnative.dev` adresinde HTTP403 aldı. Ağ engeli aşılmadı. SDK'nın indirilmiş gerçek Crashlytics21.0.0 sınıfında kullanılan metot imzaları ayrıca doğrulandı; bu Kotlin/native uygulama derlemesi veya cihaz testi değildir.

## 6. Devam eden işler ve sınırlar

- Yeni kod henüz telefona/mağazaya veya canlı sunucuya kurulmadı. Aynı gerçek cihazda debug/release, soğuk/sıcak açılış, ilk fotoğraf, profil ve sohbet sürelerinin önce/sonra ölçümü gerekir. Düşük RAM, bellek tüketimi, FPS, ağ kaybı, Android klavye/gezinme alanı ve SDK başlangıç maliyeti henüz fiziksel olarak doğrulanmadı.
- Remote Desktop Commander PC tarafında açık gösterilmiş olsa da bu sohbetin kumanda araçları yoktu. Bu bulut ortamında USB/KVM yok; telefona ADB bağlantısı kurulmuş sayılmaz. Ekran görüntüsü veya eski ADB raporu güncel fiziksel test kanıtı yapılmadı.
- Mevcut Supabase Edge için `2026-11-08-media2` dağıtımı ve yeni Crashlytics gizlilik açıklamasının mevcut Hosting sitesini koruyarak yayını gerekir. SQL şeması değiştirilmedi; kullanıcı kayıtları sıfırlanmaz/değiştirilmez.
- Gerçek Firebase Android yapılandırmasıyla native derleme tamamlanmalı; opt-in Crashlytics denemesi konsoldan doğrulanmalı. FCM v1 yetkisi/arka plan teslimi ayrıca gerekir. Operatör SMS bağlı değildir.
- Code9 gerçek Console en yüksek koduyla karşılaştırılmalı. Yeni AAB mevcut EAS projesi/imzasıyla oluşturulmalı; imza, hedef API, 16 KB ve mağaza kontrolleri son binary üzerinde yapılmalı. Veri Güvenliği beyanında isteğe bağlı çökme/teşhis ve SDK kurulum tanımlayıcıları değerlendirilmelidir.
- Tam boyutlu fotoğrafın indirme maliyeti ve ücretsiz servislerin üretim gecikmesi bu yerel testle giderildi sayılmaz. Diskte özel medya cache'i veya yeni thumbnail altyapısı eklenmedi. Bildirim/mesajlar mevcut sorgu düzenini kullanır; anlık fiziksel teslim veya her koşulda 2 saniye garantisi yoktur.

Tam kaynakla güncelleme yolu README.md içindedir. Önceki yükleme/önbellek/arayüz düzeltmeleri korunur. Mevcut tasarım baştan değiştirilmedi; yeni sosyal, Coin veya Kapışma özellikleri eklenmedi.

## Değişen kaynak/doküman dosyalarının tam listesi

- `App.tsx`
- `GEMINIYE_YAPISTIR.txt`
- `GUNCELLE_VE_AAB.bat`
- `README.md`
- `TEST_REPORT.md`
- `YASAL_YAYINLA.cjs`
- `app.json`
- `docs/GEMINI_DEVIR_NOTU.md`
- `docs/PLAY_STORE_RELEASE.md`
- `hosting/public/privacy.html`
- `index.ts`
- `integration-ui/instant.spec.ts`
- `integration-ui/keyboard-media.spec.ts`
- `integration-ui/navigation-benchmark.spec.ts`
- `integration-ui/public-navigation.spec.ts`
- `integration-ui/redesign.spec.ts`
- `integration-ui/startup-benchmark.spec.ts`
- `package-lock.json`
- `package.json`
- `plugins/withAndroidDiagnostics.cjs`
- `scripts/benchmark-media.mts`
- `scripts/build-no-github.cjs`
- `scripts/check-live.cjs`
- `scripts/package-source.py`
- `scripts/release-check.cjs`
- `src/components/PostCard.tsx`
- `src/components/ProtectedMedia.tsx`
- `src/components/social-ui.tsx`
- `src/components/ui.tsx`
- `src/database/client.ts`
- `src/firebase/client.ts`
- `src/hooks/useApiList.ts`
- `src/hooks/useMediaToken.ts`
- `src/navigation/Root.tsx`
- `src/screens/ConnectionCheck.tsx`
- `src/screens/Diagnostics.tsx`
- `src/screens/Discovery.tsx`
- `src/screens/Media.tsx`
- `src/screens/Messaging.tsx`
- `src/screens/Social.tsx`
- `src/services/api.ts`
- `src/services/diagnostics.native.ts`
- `src/services/diagnostics.ts`
- `src/services/prefetch.ts`
- `src/utils/diagnosticsController.ts`
- `src/utils/mediaTokenStore.ts`
- `src/utils/readTimings.ts`
- `src/utils/startup.ts`
- `src/utils/technicalIssues.ts`
- `supabase/functions/birarada/core.ts`
- `supabase/functions/birarada/gateway.ts`
- `tests/android-diagnostics.test.cjs`
- `tests/diagnostics-consent.test.ts`
- `tests/free-media-performance.test.ts`
- `tests/media-token.test.ts`
- `tests/no-github-build.test.cjs`
- `tests/read-timings.test.ts`
- `tests/release.test.cjs`
- `tests/startup.test.ts`

## Kaynak paketinin son kontrolü

ZIP boşluk ve Türkçe karakter içeren yeni dizine çıkarıldı; manifestteki bütün dosyaların hashleri doğrulandı. Çıkarılan kaynakta istemci/sunucu TypeScript ve 48 yardımcı testi tekrar geçti. Mevcut node_modules bağı kuruldu; temiz npm ci yapılmış olduğu iddia edilmez. plugins klasörü dahil edildi; test amaçlı google-services.json, özel anahtar, keystore, APK ve AAB paketlenmedi. Son rapor/metadata eklendikten sonra ZIP yeniden üretildi ve bütünlük yeniden kontrol edildi.
