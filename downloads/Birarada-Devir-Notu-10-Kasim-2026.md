# Birarada — 10 Kasım 2026 devir notu

Bu ZIP **devam çalışmasıdır**; imzalı APK/AAB değildir, yayıma hazır olarak doğrulanmamıştır. Yeni sohbet önce bu notu okumalı. Kullanıcı fiziksel telefon testi ve bozuk akışların düzeltilmesini istiyor; aynı bağlantı komutlarını defalarca tekrar etmek istemiyor.

## Bağlantı ve cihaz

Kullanıcının PC'sinde ADB cihaz listesi TECNO KN4n (`model:TECNO_KN4n`) için `device` durumunu gösterdi: USB bağlantısı ve izin tamam. Kullanıcı Remote Desktop Commander'ın açık olduğunu bildirdi. Ancak bu sohbetin araç listesinde Remote Desktop Commander/cihaz kumandası yoktu; Cloud capabilities boştu. Bu yüzden fiziksel telefon kontrolü/ölçümü yapılmadı. Yeni sohbet araçları gerçekten listelesin; bağlantıyı kontrol etmeden telefon testine başladığını söylemesin. Remote araçlar yoksa bunu açıkça söylesin, kullanıcıya USB kurulumunu yeniden yaptırmasın.

Kullanıcı test boyunca telefon ekranının açık kalmasını istiyor. PC'de mevcut ADB yolu `%LOCALAPPDATA%\BiraradaTools\platform-tools\adb.exe`. USB'de ekranı açık tutma komutu `shell svc power stayon usb`; kapatma `shell svc power stayon false`. Bu sohbette PC üzerinde komut çalıştırılmadı. Yeni oturum erişim alırsa test ayarını kontrol edip test sonunda önceki durumu geri yüklemeli.

Telefonda son kullanıcı beyanı 1.1.6 idi; güncel kurulu sürüm cihazdan henüz yeniden okunmadı. Önce paket/sürüm kodunu ve gerçek Play Console en yüksek kodunu doğrula. İlk aşama salt okunur gezinme ve ölçüm olmalı. Canlı yazma testlerinde yalnız kontrollü test hesapları kullan; gerçek kullanıcılara rastgele mesaj/istek gönderme.

## Proje kimliği ve mimari

Paket `com.birarada.app`; kaynak adayı **1.1.7 / code9**, Console'dan doğrulanmış en yüksek kod değildir. EAS `@ahmedberat/birarada`, UUID `9c50fe74-fec2-4f09-b4b2-c1711f4e9b6b`; mevcut upload imzası korunmalı. Yeni proje/keystore açma.

Firebase JS Authentication/Hosting: `birarada-5650c`. Sosyal DB/özel medya/API: Supabase `qinevhhhdtslnzrtcanq`. İstemci Firestore/Firebase Storage kullanmıyor. Yeni Edge için gerekli revizyon `2026-11-08-media2`; bu oturumdan canlı dağıtım yapılmadı. Veritabanını silme, sıfırlama veya mevcut kullanıcı verilerini topluca değiştirme. Şema migration'ı gerekmez. Anahtar/token/şifre isteme veya kaynaklara gömme. Gizli servis hesabı/keystore ZIP'te yoktur.

## Önceki doğrulanmış teslim

9 Kasım kaynağı: commit `42f832723ceed817119c41b50aedf7187f9a6392`, dosya `downloads/Birarada-1.1.7-Performans-Kararlilik-Kaynak.zip`.

Bu eski snapshot'ta: istemci/sunucu TS; 40 birim; 31 backend TAP sonucu (üst/alttestler dahil); 48 yardımcı; 57 sosyal +4 not/onboarding tarayıcı; 1 Auth emulator geçti. Android/iOS Hermes + web JS export ve Android prebuild geçti. Fiziksel telefon, native APK/AAB, gerçek Crashlytics/FCM teslimi geçmedi/yapılmadı. Native debug derlemesi React Native/Hermes AAR indirilirken `repo.reactnative.dev` HTTP403 ile durdu; release native derleme tamamlanmadı. Bu sonuçları aşağıdaki yeni değişikliklerin tam testi gibi sunma.

Yerel medya izin okumaları 16→5; yapay 10 ms/RPC testinde ortanca165→87ms. Aynı küçük yerel JPEG ile tarayıcı ana çerçeve256→266ms, ilk JPEG402→409ms; belirgin UI açılış iyileşmesi kanıtlanmadı. Bunlar telefon ölçümü değildir; 2 saniye Android hedefi doğrulanmadı.

Kaynakta önceki cache/pagination/tek Keşfet/açık hesap varsayılanı, gizlilik, mesaj taslağı/idempotensi, medya hata/yeniden deneme ve isteğe bağlı varsayılan kapalı Crashlytics korunur. Yeni sosyal/Coin/Kapışma veya komple tasarım değişikliği yapma.

## Bu turdaki yeni değişiklikler ve kanıt

- Yeni tarayıcı regresyonu `integration-ui/keyboard-media.spec.ts`: “opening Reel comments pauses the existing player without downloading its private bytes again”. Düzeltmeden önce gerçekten başarısızdı: yorumlar açılınca video elementi0 oluyordu. Düzeltmeden sonra **1/1 geçti**; aynı blob URL/tek indirme ile duraklatma ve devam doğrulandı.
- `src/components/ProtectedMedia.tsx`: web özel medya, görünür kart hazırlanmışken yorum/menu sırasında baytları korur; ekran odağı/ön plan kaybolunca kaynağı bırakır. `preload` bilgisi AuthorizedPlayer→WebPrivateMedia'ya taşındı. Bir sonraki web Reels'i önceden indirilmez.
- Aynı dosyada hata görünümü ile `useVideoPlayer` sahibi bileşen ayrıldı. SDK hata verdiğinde iç bileşen kaldırılır; Expo hook'unun native kaynağı temizleme yolu çalışır. Etkin videoda30 saniye hazırlanamama sınırı eklendi; duraklatılmış video bu sınırla kesilmez. Bu native davranış henüz gerçek Android'de doğrulanmadı; yalnız kod/hook yaşam döngüsü incelendi.
- `src/screens/Stories.tsx`: geçerli hikâye videosunun duraklatma sırasında hazırlanmış kalması için `preload={focused}` eklendi.
- Bu değişikliklerden sonra **istemci TypeScript geçti** ve yukarıdaki **tek yeni tarayıcı testi geçti**. Tam sosyal paket, backend, diğer UI/oynatma senaryoları ve üretim export bu yeni snapshot üzerinde henüz yeniden çalıştırılmadı. Diğer kaynaklara dokunulmadı.

## Devam sırası

1. Remote araç varsa gerçek cihaz/paket/sürüm/envanterini oku; ana sayfa, Keşfet, profil, mesaj ve Reels sürelerini ölç. Yerel tarayıcı ile fiziksel telefon sonucunu ayır. Ekranı USB test süresince açık tut.
2. Yeni medya değişikliklerini tam regresyona al: `npm run typecheck`, `npm test`, `npm run test:server-types`, `npm run test:backend`, `CHROMIUM_PATH=... npm run test:social`, `npm run test:ui`. İki UI/Auth emulator sürecini aynı9099/8081/5002 portlarıyla birlikte başlatma.
3. Video hata/yeniden deneme,30 saniye takılma, yorumlarda indirme tekrarı, sekmeden/arka plana geçince bırakma ve hikâye video duraklatma için ek kritik kontroller yap. Mevcut oturum/özel medya güvenliğini koru.
4. Yeni durumun test raporu/verification/manifestini güncelle; eski başarıları yeni kaynağa aitmiş gibi gösterme. Fiziksel 2 saniye sonucu yoksa garanti verme.
5. Canlı Edge/yasal sayfalar, gerçek Firebase Android yapılandırması, FCM/Crashlytics teslimi, mevcut imza ve Console en yüksek kodu doğrulanarak yeni AAB üret. Henüz bunlar yapılmış değildir.

Geliştirme ortamında ana Git HEAD `247c59172f65aecb61fdd82b87c2b5af2295ce0d` ve index korunuyordu; root README gibi ilgisiz değişiklikleri resetleme/stage etme. Kaynak çalışma klasörü `/workspace/botasker/mobile-next`; yeni sohbetin dosya sistemi aynı olmayabilir, bu ZIP'i esas al.
