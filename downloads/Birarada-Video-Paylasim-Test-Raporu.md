# Birarada video paylaşım testi — 22 Ekim 2026

**Sonuç: 4 yeni video senaryosu geçti. Mevcut 18 senaryo ile birlikte 22/22 entegre tarayıcı testi başarılı.**

Test edilen kaynak: Birarada 1.1.0 / versionCode2 / com.birarada.app. Her senaryoda ayrı paylaşan, takipçi ve takip etmeyen hesapları oluşturuldu. Gerçek uygulama arayüzünden H.264 MP4 seçilip yüklendi; Firebase Auth emulator, PostgreSQL uyumlu PGlite, gerçek SQL timeline tetikleyicileri ve özel medya API'si kullanıldı. Canlı kullanıcı hesaplarına içerik gönderilmedi.

| Paylaşım | Başka hesabın ana sayfası | Takip ettiklerin | Global Reels |
|---|---|---|---|
| Herkese açık video gönderisi | Görünüyor | Takipçide görünüyor | Eklenmiyor; gönderi türü ayrı |
| Herkese açık Reel | Görünüyor | Takipçide görünüyor | Görünüyor ve otomatik oynuyor |
| Gizli video gönderisi | Genel keşfet akışına eklenmiyor | Onaylı takipçide görünüyor | Eklenmiyor |
| Gizli Reel | Genel keşfet akışına eklenmiyor | Onaylı takipçide görünüyor | Genel Reels listesine eklenmiyor; sahibinin profilindeki Reels sorgusundan erişilebiliyor |

Ana sayfa kontrolü akış yüklenirken veya yenilenirken yapıldı. Uygulama açıkken başka kişinin paylaşımının aynı listeye kendiliğinden anında eklenmesi doğrulanmadı. Yeni hesaplar varsayılan olarak gizlidir; herkese açık dağıtım için profilde Gizli hesap kapatılmalıdır. Reels olarak paylaşmak için paylaşım türü Reels seçilir; genel Reels listesi yalnız herkese açık hesap içeriklerini gösterir.

## Doğrulanan işlemler

- Gönderi ve Reel yayınlama, doğru sunucu kind/media kaydı, başka hesapta akış kartı.
- Takipçi ve takip etmeyen hesapta oturumla özel medya indirme, H.264 video çözme ve oynatma. Yalnız metadata değil, en az bir video karesi ve ilerleyen currentTime doğrulandı.
- Başka hesaptan videoyu beğenme ve yorum yazma; paylaşan hesabın sunucu kayıtlarında yazar ve metin doğrulandı.
- Global Reels filtresinin normal video gönderisini dışarıda bırakması; yalnız aktif Reels ekranı içinde kontrol yapıldı.
- Takip isteği beklerken gizli videoya ve medya baytlarına erişimin 403 ile reddedilmesi.
- Yayından sonra takip isteği kabul edilince eski videonun takipçi akışına eklenmesi ve oynatılabilmesi.
- Onaysız üçüncü hesaba gizli içeriğin açılmaması.
- Engellemeden sonra mevcut takipçi oturumu/tokenı ile medya erişiminin 403 olması ve takipçi akışından kaldırılması.
- Girişsiz medya erişiminin 401 ile reddedilmesi.

## Kapsam ve dosyalar

Bu sonuç yerel sunucu ve Chromium tarayıcı testidir; canlı Supabase projesi veya telefonda yüklü AAB bu çalışmada denenmedi. Yayın/görünürlük kodunda bir değişiklik gerekmedi. Arayüze yalnız Reels testinin doğru ekranla sınırlanması için görünmez bir test kimliği eklendi. Yeni imzalı AAB üretilmedi.

Test: `integration-ui/video-distribution.spec.ts`. Tam test komutu: `npm run test:social`. Tip kontrolü ve son kaynak için Android/iOS Hermes + web üretim export'u başarılı. Yeni migration veya yeni imza gerekmiyor. Güncel kaynak ZIP'inde GUNCELLE_VE_AAB.bat önceki gibi bulunur.
