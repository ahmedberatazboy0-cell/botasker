# Birarada — Gemini devir notu

20 Ekim 2026. Bu not, kullanıcının en son Windows konsol kaydı ve mevcut kaynak koduna göre hazırlanmıştır. Eski test raporlarındaki 39/40 veya bu bulut ortamında çalıştırılamadı ifadeleri geçmiş durumu anlatır; aşağıdaki Windows sonucu daha günceldir.

## Proje ve beklenen sonuç

ZIP'te tek bir `Birarada/` mobil proje kökü vardır. Expo SDK 54, React Native 0.81.5, React 19.1, TypeScript strict, Firebase JS SDK ve React Navigation kullanılır. `npm ci` için lockfile dahildir. Eski Express sunucusu, tek dosyalık HTML demo ve örnek hesap ekranı yoktur. `hosting/public/*.html` yalnız yasal sayfalardır.

Hedef üretim imzalı Android AAB'dir. Şu anda AAB/APK yoktur. `com.birarada.app` kimliği Android ve iOS için sabittir. Kaynak sürümü `1.0.0`, ilk versionCode `1`; daha önce Play'e yükleme yapıldıysa yeni sürüm kodu ve mevcut imza eşleşmesi zorunludur. Kullanıcı başlangıçta mevcut uygulama güncellemesi demiş, sonra henüz EAS projesi olmadığını ve ilk sürüm bilgilerini vermiştir; mağaza kaydı ve imza durumu hesap üzerinden doğrulanmalıdır.

## En son gerçek Windows sonucu

Kullanıcının gönderdiği konsol kaydında:

| Kontrol | Sonuç |
| --- | --- |
| `npm ci` | 1313 paket kuruldu; bazı bağımlılık/script uyarıları var. |
| `npm run typecheck` | Geçti. |
| `npm test` | 17/17 geçti. |
| `npm run test:release` | 6/6 geçti; bunlar guard birim testleri, gerçek EAS bağlantısı değildir. |
| `npm run test:auth` | 1/1 geçti; gerçek yerel Auth Emulator kullanıldı. |
| `npm run test:rules` | **40/40 geçti**, fail 0; gerçek yerel Firestore Emulator 1.22.0. |
| Playwright not düzenleyicisi | 3/3 geçti; gerçek bileşenin callbacks'i testte simüle edilir. |
| Playwright onboarding | `page.goto` ilk `http://127.0.0.1:8081/` yüklemesinde **30000 ms timeout**; 3 test geçti, 1 başarısız. |

Başlatıcı bu son arayüz hatasında durdu; 2/4 Expo hesabı adımına geçilmedi. Son kayıtta ilk sayfaya `load` beklenirken zaman aşımı var. Soğuk Metro paketlemesi, makine yükü, sayfanın/bundle'ın HTTP yanıtı ve gerçek tarayıcı hataları araştırılmalı. Test bütçesini makul biçimde artırmak/ilk DOM ve uygulama hazır durumunu ayrı beklemek ve gerekirse tek worker kullanmak düşünülebilir; bu değişiklikler henüz uygulanmadı. Mevcut iddiaları koruyup tekrar çalıştır. Sadece testi atlayarak devam etme.

`PERMISSION_DENIED` kayıtları büyük ölçüde negatif güvenlik testlerindeki beklenen retlerdir; test toplamı başarılıdır. Emulatorün test sonu `SIGINT` ile kapatılması normaldir. Canlı Firebase kurallarını açmak bu testi çözme yöntemi değildir.

## Daha önce düzeltilen iki Windows/test sorunu

1. `ProgramFiles` gibi Windows ortam değişkenleri kopyalanınca anahtar erişimi harf farkına duyarlı oluyordu. `scripts/build-no-github.cjs` ve kendi JS kodunu içeren `AAB_OLUSTUR.bat`, Chrome/Edge aramasını harf farkından bağımsız yapar; ProgramW6432, ProgramFiles(x86) ve kullanıcıya özel kurulumlar kapsanır. 12 başlatıcı testi geçti. Java 21 kullanıcı tarafından kuruldu.
2. Profil/kullanıcı adı silme testinde `env.authenticatedContext(uid)` her çağrıda farklı Firestore bağlantısı oluşturuyordu. Her batch için tek Eve/Alice bağlantısı saklanıp belge referansları o bağlantıdan oluşturuldu. Son Windows çalıştırmasında bu test dahil tüm 40 test geçti. Bu düzeltmede üretim güvenlik kuralları değiştirilmedi.

## Başlatıcı ve derleme

`AAB_OLUSTUR.bat` kendi Node kodunu taşır; kaynak dizinindeki release-check ve toolchain yardımcılarını kullanır. İlk `/* 2>nul` satırı CMD'de görünebilir; gerçek başarısızlık satırı değildir. `scripts/build-no-github.cjs` aynı akışın modül sürümüdür; birini değiştirirken diğerini de güncel tut.

Yardımcı önce `npm ci`, tip, birim, yayın guard, Auth/Firestore ve UI kontrollerini çalıştırır. UI için `.birarada-release/checks/playwright.config.cjs` üretir. Kök `playwright.config.ts` değişikliği tek başına bu üretilen config'i düzeltmez. Onboarding testi `e2e/onboarding.spec.ts` içindedir. Klasör yollarında boşluk, Türkçe karakter ve `(2)` gibi parantezler vardır; kabuk kaçışlarına dikkat et.

Kontroller başarılıysa resmi `eas-cli@25.2.0` ile güvenli tarayıcı girişi, statik bootstrap üzerinden gerçek proje oluşturma/bağlama ve üretim AAB derlemesi başlar. `EAS_NO_VCS=1` ve mutlak `EAS_PROJECT_ROOT` kullanılır. Asıl kaynaklar korunur; ayrı çalışma kopyasına gerçek projectId/owner eklenir. `.birarada-release/project.json` gerçek public proje bilgisini saklar. Aynı anda iki çalışma engellenir. Sahiplik işareti olmayan bir çalışma klasörünün içeriği silinmez.

`app.config.ts` ve `scripts/release-check.cjs` üretimde gerçek EAS UUID'si, açık emulator=false ve storage=false ayarları ister. Kimlik uydurarak guard'ı geçme. EAS oturumu/projesi henüz oluşturulmadı. Kullanıcı Play Console ve Expo hesaplarının hazır olduğunu söyledi; bu çalışma ortamında yetkili oturum olduğu anlamına gelmez.

## Firebase ve yasal sayfalar

- Firebase projesi `birarada-5650c`; public web istemci ayarları `src/firebase/client.ts` içindedir. Admin credential değildir.
- Mevcut site `https://birarada-5650c.web.app`.
- İstenen rotalar `/privacy`, `/delete-account`, `/terms`, `/child-safety`; gerçek Türkçe içerik `hosting/public/` içinde hazırlanmıştır. Canlıya dağıtım yapılmadı.
- Destek `ahmedberatazboy0@gmail.com`.
- Sağlayıcılar, canlı Firestore kuralları ve indeksleri dağıtılmadı/doğrulanmadı. Mevcut site korunarak yasal içerik birleştirilmelidir. `docs/HOSTING.md` önemlidir.

## Mevcut uygulama kapsamı ve açık işler

Email/şifre giriş, profil, public sayfalı metin akışı, gizli profil/takip istekleri, yorum/beğeni/kaydetme, metin DM, takip bildirimi, engel/şikâyet, hesap silme ve şarkılı notlar kodda vardır. Not: 60 karakter, isteğe bağlı 120 karakterlik şarkı adı ve doğrulanmış Spotify/YouTube bağlantısı; yalnız kabul edilmiş takipçiler, 24 saatlik erişim, silme ve gerçek not kopyalı şikâyet. Şarkı dış serviste açılır; ses yükleme/oynatma yoktur.

Storage, kamera/galeri/video, native Google girişi kapalıdır. Anlar/Yakınlar, grup/ses/medya DM, push, tam içerik arama, yaş denetimleri, spam sınırlama/App Check ve işletilen moderasyon sistemi tamamlanmadı. Bunları uygulanmış gibi sunma. Hesap temizliği istemciden sıralı işlemlerle yürür; atomik sunucu silme değildir. Başkalarının mesajları/şikâyetleri gibi kalan veriler yasal metinlerde açıklanmıştır.

Gerçek uygulama + canlı backend + iki fiziksel hesap/cihaz akışları henüz tamamlanmadı. Mağaza beyanları, yaş/içerik derecelendirmesi, destek/moderasyon/silme taleplerinin işletilmesi ve cihaz/pre-launch kontrolleri gerekir.

## Önceki bulut ortamının engeli

Önceki Codex ortamında `api.expo.dev`, `storage.googleapis.com` ve `repo.reactnative.dev` erişimi proxy 403 ile engelliydi; bağlı Expo/Firebase oturumu yoktu. Yerel native prebuild geçti, debug Gradle derlemesi React Native/Hermes AAR yönlendirmesinde durdu; APK/AAB oluşmadı. Bu engelin yeni ortamda da aynı olduğunu varsayma; kendi ortamının gerçek ağ ve hesap erişimini denetle. Parola, token veya imza anahtarını sohbetten isteme/public dosyaya koyma.
