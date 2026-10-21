# Birarada ücretsiz altyapı doğrulaması — 21 Ekim 2026

**Teslim kaynak ZIP'idir; yeni imzalı AAB değildir. Canlıya dağıtılmış veya Play Store'a hazır olduğu doğrulanmadı.** Firebase Blaze kullanılmaz. Supabase projesi qinevhhhdtslnzrtcanq; Firebase Authentication birarada-5650c. EAS @ahmedberat/birarada / 9c50fe74-fec2-4f09-b4b2-c1711f4e9b6b ve mevcut imza korunur. Kimlik com.birarada.app; version1.0.0/code1; sahibi önceki AAB'yi Play'e yüklemediğini bildirdi. Sonradan yüklenmişse en yüksek versionCode tekrar doğrulanmalıdır.

## Bu kaynakta çalıştırılan kontroller

| Kontrol | Sonuç | Kapsam |
| --- | --- | --- |
| Uygulama TypeScript | Geçti | tsc --noEmit |
| Edge iş mantığı strict TypeScript | Geçti | tsc -p supabase/tsconfig.check.json |
| Gerçek Deno 2.5.6 Edge giriş denetimi | Geçti | deno check supabase/functions/birarada/index.ts |
| Birim testleri | 17/17 | silme sırası/tekrar, hata, akış, şarkı bağlantıları/süre |
| Yayın kimliği/ayarları | 6/6 | paket, ilk code, proje ve URL güvenliği |
| Derleme yardımcısı | 13/13 | başarısız test/canlı kontrolünde durma, gerçek Expo config, Windows komut/yol ve mevcut imzayı koruma |
| Yerel başlatıcı | 10/10 | port, hazır olma, hata ve yalnız kendi süreç ağacını kapatma |
| Ücretsiz PostgreSQL + Edge entegrasyonu | 13 senaryo geçti; TAP 14/14 | aşağıdaki ayrıntılar; üst kapsayıcı TAP sayımına dahil |
| Gerçek yerel sosyal UI | 5/5 | Auth emulator + PGlite + özel yerel medya; aşağıdaki ayrıntılar |
| Onboarding/not editörü UI | 4/4 | gerçek arayüz; not callback'leri simülasyon |
| Auth emulator | 1/1, CLI çıkışı0 | kayıt, çıkış, yanlış giriş, giriş, sıfırlama, hesabı silme |
| Yasal sayfa render | 12/12 | dört kaynak sayfa ×320/390/1280px, yerel HTTP ve gerçek Chromium; canlı Hosting değildir |
| Resmî Supabase CLI 2.76.4 indiricisi | Geçti | resmî SHA-256 listesi, arşiv çıkarma, gerçek Linux binary çalıştırma, tekrar önbellek |
| Temiz ZIP kurulumu | Geçti | ZIP yeni, boşluk içeren bir klasöre çıkarıldı; gerçek npm ci (1335 paket), uygulama/Edge tipleri, ücretsiz PostgreSQL ve13 yardım testi geçti; Linux üzerinde |
| AAB BAT JS sözdizimi/önkontrol | Geçti | Node ile parse ve --check; Windows CMD üzerinde tam çalıştırma değildir |
| Android/iOS Hermes export | Geçti | üretim ayarıyla gerçek Expo export; Gradle, imza veya AAB değildir |

Ücretsiz entegrasyon testleri gerçek PostgreSQL uyumlu PGlite motorunda migration'ı uygular. Anon tablo/RPC erişimi reddedilir; doğrulanmış owner UID sabitlemesi, sahte rol/profil/medya yazımı, gerçek JPEG özel yükleme ve range erişimi, takip/engel, MP4/AAC biçim kontrolü, idempotent paylaşım, hikâye süresi/öne çıkarma, mesaj izinleri, eski revizyonla yazımın reddi, kısıtlanmış oturum, gerçek profil/şarkılı not yazımı ve120karakter sınırı, istek tabanlı temizlik, gruptan ayrılmış kişinin silme sırasında kendi mesajını kaldırması ve Auth'tan önce medya temizliği sınanır. Bu testte kimlik sağlayıcı callback'i ve Storage bellekteki test adaptörüdür; Google imzası veya canlı Supabase Storage test edildiği anlamına gelmez.

Beş sosyal tarayıcı testi gerçek Auth emulator kullanır: fotoğrafın başarısız paylaşım sonrası taslakta kalması/tek paylaşılması ve gerçekten çözülmesi; fotoğraf hikâye/öne çıkan; yönetimde açık işlem onayı; özel H264 videonun başarısız indirme sonrası tekrar ile gerçek HTML video oynatıcısında çözülmesi; gerçek AAC mesajının özel indirme üzerinden HTML ses oynatıcısında çözülmesi. İki503 yanıtı bu testlerde bilerek üretilir. Yönetici test fixture'ı yalnız rastgele test sırrıyla ve loopback yerel sunucuda bulunur; normal başlatma/üretim Edge girişinde fixture yolu yoktur.

Auth testinin ilk CLI çalışması, test geçtiği hâlde bu bulut ortamının salt okunur ~/.config dizinindeki güncelleme bildiricisi nedeniyle çıkış2 verdi. CI=1, NO_UPDATE_NOTIFIER=1 ve görev kapsamındaki XDG_CONFIG_HOME ile yeniden çalıştırıldı; test ve CLI çıkışı0 oldu. Test atlanmadı. Standart Windows kullanıcı config dizini bu bulut kısıtının kapsamı dışındadır.

## 401/403 zamanlama düzeltmesi

Windows'ta test sırasında bir saniye sınırı aşılınca eski oturumun401 yerine403 beklenmesi kararsız bir sonuç üretiyordu. Gerçek davranış yeniden üretildi: eski oturum401, yenilenmiş kısıtlı oturum403. Test artık gerçek reauthAfter sınırının iki tarafını ayrı kimlik zamanlarıyla doğrular; kısıtlı kişinin belge API'sine erişimi de403 olmalıdır. Üretim yetkilendirme kodu değiştirilmedi ve test atlanmadı. Düzeltmeden sonra14/14 ücretsiz test ve iki TypeScript kontrolü tekrar geçti. Diğer yukarıdaki kontroller uygulama kodu değişmediği için önceki doğrulamalardır.

## Windows web başlangıç süresi ve tanılama düzeltmesi

Kullanıcının Windows çıktısında bütün birim/ücretsiz sunucu testleri geçti; test:social webServer120000ms başlangıç sınırında durdu. Bu çıktı hangi hizmetin beklediğini göstermiyordu; Windows'taki temel gecikmenin nedeni doğrudan doğrulanmış sayılmaz. Başlatıcı artık Auth/API/Expo aşamasını ve15s ilerlemeyi gösterir; her aşamanın180s sınırı, Playwright başlangıcının600s toplam bütçesi vardır. Hazır olma kontrolü dinleyen port/HTML yerine gerçek JavaScript paketini ister. Olağan ve üretilen Playwright config'iyle AAB BAT içindeki yardımcı aynı şekilde güncellendi; senaryo testleri atlanmadı.

Chrome/Edge otomatik algılama normal/sosyal config'lerde de kullanılır. CHROMIUM_PATH verilmeden bu ortamda5/5 sosyal tarayıcı testi ve4/4 onboarding/not UI testi geçti. Uygulama tip kontrolü,13/13 derleme yardımcı ve10/10 başlatıcı testi geçti. Demo Firebase CLI config'i görev kapsamındaki yerel veri klasörüne ayrıldı; temiz kapanış da doğrulandı. Bu çalıştırma Linux'tadır; kullanıcının Windows bilgisayarında aynı sonuç henüz doğrulanmadı. Üretim API/app kodu bu düzeltmede değiştirilmedi.

Tek dosyalık WEB_BASLATMA_DUZELT.cjs güncelleyicisi beş sabit başlangıç/derleme dosyasını SHA-256 ile doğrulayarak uygular; önce orijinalleri yeni bir yedek klasörüne kopyalar. Eski ZIP'ten çıkarılan projede önkontrol, doğru içerik/yedek, ilgisiz dosyayı koruma, tekrar çalıştırma ve yanlış paket kimliğini reddetme denendi. Bağımlılıkları yeniden kurmaz ve gerçek oturum bilgilerini değiştirmez.

## Sınırlar ve tamamlanmayan canlı işler

- Bu ortamda yetkili Supabase/Expo/Firebase oturumu yoktur. Gerçek Supabase migration/Edge/Storage dağıtımı, Google JWT/account lookup ve üretim özel-medya uçları canlı olarak doğrulanmadı. UCRETSIZ_KUR.bat kullanıcının resmî Supabase girişinden sonra dağıtır; veritabanı parolası gerekiyorsa yalnız resmî CLI istemine girilir.
- Önceki Firestore kayıtları yeni Supabase DB'ye otomatik aktarılmaz/silinmez. Firebase giriş hesabı korunur; yeni DB'de profil/owner kurulumu yapılır. Owner hesabı bu ortamda açılmadı veya etkinleştirilmedi.
- Şifre, token, service_role veya imzalama anahtarı kaynaklara eklenmedi. Yönetim rolü özel DB kaydından, owner aktivasyonu doğrulanmış e-posta ve tek UID bağlantısından gelir. Kısıtlama bu uygulamanın API'sini kapatır; Firebase Authentication hesabını sağlayıcı genelinde disabled yapmaz.
- Yeni politika sürümü 2026-10-21-free1'dir. Kaynak sayfalar hazırdır; mevcut tam site korunarak canlı Hosting'e birleştirilmesi gerekir. Yalnız yasal klasörü mevcut sitenin üstüne dağıtma. release:live eski politika sürümünde üretim derlemesini durdurur.
- Ücretsiz sunucu FFmpeg dönüştürmesi yapmaz. JPEG normalleştirme/EXIF temizliği vardır; H264 MP4 ve AAC M4A desteklenir. Video/ses metadata'sı yeniden kodlanıp temizlenmez. AAC kaydı desteklemeyen tarayıcı açık hatayla durur. Android/iOS cihazda kayıt, kamera, medya ve uzun dosyalar ayrıca sınanmalıdır.
- Uygulama korumaları medya rezervasyonunda512MiB, JSON kayıtta128MiB ve aylık medya aktarımında2GiB'dir. Sağlayıcının gerçek ölçümü/ücretsiz plan kotalarıyla eşit olduğu veya sınırsız hizmet garanti edilmez. Araç ücretli plan açmaz. Yük/ölçek testi yapılmadı.
- Listeler10s sorgulama ve yerel yazım sonrası yenileme kullanır. Süresi dolan kayıt/medya ve kuyruklar uygulama istekleriyle sınırlı partilerde temizlenir; trafik olmadığında fiziksel temizlik gecikir. Ücretli cron veya kesintisiz çalışan sunucu yoktur.
- Gerçek FCM/EAS kurulumu ve push teslimi; canlı iki hesapla gizlilik/takip/engelleme, yönetim ve hesap silme; son AAB'de package/code, mevcut imza, hedef API ve16KB native uyumluluk doğrulanmadı. Yeni imzalı AAB bu çalışmada üretilmedi. Eski AAB bu yeni özellikleri içermez.
- Play Console mağaza/veri güvenliği/yaş/erişim beyanları, hesabın test koşulları ve Google incelemesi tamamlanmalıdır. Onay veya yayımlanma süresi taahhüt edilmez.

Kurulum: README.md ve docs/CANLI_KURULUM.md. Tam test kaynakları ZIP'tedir; node_modules, canlı veri, özel env dosyası ve hesap anahtarları pakete dahil değildir.
