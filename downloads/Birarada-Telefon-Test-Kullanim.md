# Birarada: fiziksel telefonda başlatma ve ekran gözlemi

Bu araç telefona ADB üzerinden bağlı kendi Windows bilgisayarınızda çalışır. ChatGPT'nin PC'ye uzaktan eriştiği veya testin önceden yapıldığı anlamına gelmez.

Node.js ve önceden kurulmuş Google Android Platform Tools gerekir. ADB varsayılan konumu `%LOCALAPPDATA%\BiraradaTools\platform-tools\adb.exe`; farklı konum için BIRARADA_ADB değişkeni tam exe yolunu alabilir. `adb devices` çıktısında telefon `device` olmalıdır. Birden çok telefon varsa `node BIRARADA_TELEFON_TEST.cjs CIHAZ_KIMLIGI` kullanın.

```cmd
node BIRARADA_TELEFON_TEST.cjs
```

Telefonun kilidi açık kalmalı. Araç kurulu Birarada'nın gerçek sürümünü okur, uygulamayı üç kez zorla kapatıp başlatır, Android Activity başlatma sürelerini kaydeder. Sonra erişilebilir düğmeler bulunursa Ana Sayfa, Keşfet, Profil, Mesajlar ve Reels arasında gezinir. Ekranları tahmini koordinatlarla veya benzer adlı düğmelerle açmaz. Başka uygulama, kilit veya izin ekranı görünürse dokunmaya devam etmez.

İndirilenler klasöründe Birarada-Telefon-Test- ile başlayan yeni bir klasör oluşturulur. `rapor.json`, PNG ekran görüntüleri ve uygulamanın UI XML dosyaları burada kalır; otomatik yükleme yapılmaz. Görüntüler/ekran ağacı kişisel içerik gösterebilir. Önce rapor.json dosyasını inceleyin ve yalnız paylaşmak istediğiniz dosyaları gönderin.

**Sürelerin anlamı:** Android TotalTime yalnız Activity açılışıdır. Yükleme göstergesinin kaybolması bütün içeriğin tamamlandığının kanıtı değildir; rapor bunu açıkça belirtir. Ekran görüntüleri ayrıca incelenmelidir. Aracın çalışması bütün uygulamanın testlerden geçtiği anlamına gelmez.

Gönderi/mesaj yazma, takip, grup kurma, giriş yapma veya izin onaylama otomatik yapılmaz. Gerçek arka plan push teslimi ölçülmez. Hesap bilgileri veya anahtarlar alınmaz. APK/AAB kurulmaz, uygulama verisi temizlenmez, backend/Play Console değiştirilmez. Araç yeni 1.1.6 kaynağının kurulduğunu varsaymaz; telefonda hangi sürüm varsa raporlar.

Yardımcının cihaz seçimi, sürüm okuma, ön plan kontrolü, güvenli düğme seçimi, yükleme göstergesi, stdout hata ayrıntıları ve doğrulanmış başlatma etkinliği için 7 yerel kontrol geçti. Bu kontroller fiziksel telefon testinin yerine geçmez; Windows/telefon çalışması kullanıcı bilgisayarında henüz doğrulanmalıdır.

## Yardımcı v2: uygulamayı başlatmadan gözlem

Telefonunda Birarada'yı kendin aç, kilidi açık bırak ve şu komutu kullan:

```cmd
node BIRARADA_TELEFON_TEST.cjs --observe
```

Bu mod uygulamayı kapatmaz/başlatmaz; açılış süresi ölçmez. Rapor observeOnly=true ve launches=[] içerir. Yalnız mevcut uygulamada bulunabilen güvenli gezinme düğmelerini kullanır. Ön planda Birarada yoksa durur.

Varsayılan açılış modunda başlatma etkinliği package manager'dan doğrulanarak alınır, force-stop ile start ayrı çalıştırılır ve açık etkinlik adıyla am start -W kullanılır. Başarısız ADB komutunun stdout, stderr, çıkış kodu ve sinyali raporda failedCommands alanına kaydedilir. Yalnız stderr'e bakıp boş hata gösteren önceki yardımcı sorunu düzeltildi. Bu, telefondaki önceki başlatma hatasının asıl nedeninin doğrulandığı anlamına gelmez.
