# 🗺️ Google Maps İşletme Bilgi Toplayıcı

Google Maps'ten işletme bilgilerini otomatik olarak toplayan modern web uygulaması.

## 🚀 Canlı Demo

**GitHub Pages:** [https://cemalkarapinar.github.io/Google-Maps-letme-Bilgilerinden-E-Mail-Bulan-Uygulama](https://cemalkarapinar.github.io/Google-Maps-letme-Bilgilerinden-E-Mail-Bulan-Uygulama)

## ✨ Özellikler

### 🌐 Web Uygulaması (Ana Platform)
- 🔍 **Gerçek Veri Toplama**: OpenStreetMap, Photon, Wikipedia API'leri
- 🌍 **Akıllı Web Scraping**: 4 farklı CORS proxy ile Google arama sonuçları
- 📧 **Website E-mail Arama**: Otomatik e-mail adresi çıkarma
- 📊 **Gerçek Zamanlı Arama**: Canlı ilerleme takibi ve süre gösterimi
- 📱 **Responsive Tasarım**: Tüm cihazlarda mükemmel görünüm
- 📄 **Çoklu Export**: Excel, CSV, PDF, Word formatlarında indirme
- 🇹🇷 **Türkçe Destek**: Tam Türkçe arayüz ve şehir listesi
- ⚡ **Hızlı ve Güvenli**: HTTPS, CORS uyumlu, favicon destekli



## 🎯 GitHub Pages'de Kullanım

### 🌐 Web Uygulaması (Ana Platform)
✅ **Direkt Kullanım**: Tarayıcınızda hemen çalışır, kurulum gerektirmez
✅ **Gerçek İşletme Verileri**: OpenStreetMap, Photon API'leri ile canlı veriler
✅ **Akıllı Web Scraping**: 4 farklı proxy ile Google arama sonuçlarından veri
✅ **E-mail Bulma**: Website'lerden otomatik e-mail adresi çıkarma
✅ **Profesyonel Export**: Excel, CSV, PDF formatlarında indirme

### 🔧 Chrome Extension (İsteğe Bağlı)
Alternatif olarak Google Maps'ten direkt veri çekmek için Chrome extension da mevcuttur.

## 🛠️ Yerel Geliştirme (İsteğe Bağlı)

```bash
# Projeyi klonlayın
git clone https://github.com/cemalkarapinar/Google-Maps-letme-Bilgilerinden-E-Mail-Bulan-Uygulama.git
cd Google-Maps-letme-Bilgilerinden-E-Mail-Bulan-Uygulama

# Direkt index.html'i açın veya yerel sunucu çalıştırın
npm install && npm start
```

## 📋 Kullanım Kılavuzu

### Web Uygulaması
1. **Arama Parametreleri**: Kelime, ülke, şehir girin
2. **Demo Test**: "Aramayı Başlat" ile demo verileri görün
3. **Export**: Verileri istediğiniz formatta indirin

### Chrome Extension (İsteğe Bağlı)
Chrome extension ile Google Maps'ten direkt veri çekme de mümkündür.

## 🔧 Teknik Özellikler

### 🌐 Web Uygulaması (Ana Platform)
- **Vanilla JavaScript**: Framework bağımsız, hızlı ve güvenilir
- **Modern CSS**: Flexbox, Grid, CSS Variables ile responsive tasarım
- **API Entegrasyonu**: OpenStreetMap Nominatim, Photon, Wikipedia API'leri
- **CORS Proxy**: 4 farklı proxy ile web scraping (allorigins, codetabs, thingproxy, cors-anywhere)
- **Export Libraries**: XLSX, jsPDF, html2canvas ile çoklu format desteği
- **Progressive Enhancement**: Temel işlevsellik her yerde çalışır
- **HTTPS Uyumlu**: Güvenli bağlantılar, mixed content yok
- **Favicon**: SVG format ile modern icon desteği



### 🖥️ Backend (Yerel Geliştirme)
- **Node.js + Express**: RESTful API
- **Puppeteer**: Headless browser automation
- **Streaming**: Server-Sent Events ile gerçek zamanlı veri
- **Rate Limiting**: Güvenlik ve performans

## 🌟 GitHub Pages Deployment

### Otomatik Deployment
1. GitHub repository'nizi oluşturun
2. Dosyaları push edin
3. Settings > Pages > Source: "Deploy from a branch"
4. Branch: `main`, Folder: `/ (root)`
5. Siteniz hazır: `https://cemalkarapinar.github.io/Google-Maps-letme-Bilgilerinden-E-Mail-Bulan-Uygulama`

### Manuel Deployment
```bash
# Build (eğer gerekirse)
npm run build

# GitHub Pages branch'i oluştur
git checkout -b gh-pages
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
```

## 🔒 Güvenlik ve Uyumluluk

### ✅ Güvenlik Özellikleri
- **HTTPS Only**: Tüm API çağrıları güvenli bağlantı ile
- **CORS Proxy**: 4 farklı proxy ile güvenli cross-origin istekler
- **Input Validation**: Güvenli veri işleme ve sanitization
- **Error Handling**: Kapsamlı hata yönetimi ve fallback sistemleri
- **Rate Limiting**: API'lere aşırı yük binmesini önler
- **No Mixed Content**: HTTP/HTTPS karışık içerik sorunu yok

### ⚖️ Yasal Uyumluluk
- **API ToS**: OpenStreetMap, Wikipedia API kullanım şartlarına uygun
- **Fair Use**: Makul kullanım sınırları içinde
- **Privacy**: Kişisel veri koruma önlemleri
- ⚠️ **Sorumluluk**: Kullanıcı sorumluluğunda uygun kullanım

## 📊 Desteklenen Veri Formatları

| Format | Web App | Extension | Özellikler |
|--------|---------|-----------|------------|
| **CSV** | ✅ | ✅ | Excel uyumlu, UTF-8 |
| **Excel** | ✅ | ⚠️ | .xlsx format, formatlama |
| **PDF** | ✅ | ⚠️ | Türkçe karakter desteği |
| **Word** | ✅ | ⚠️ | .docx format |

## 🤝 Katkıda Bulunma

1. **Fork** edin
2. **Feature branch** oluşturun: `git checkout -b feature/amazing-feature`
3. **Commit** edin: `git commit -m 'Add amazing feature'`
4. **Push** edin: `git push origin feature/amazing-feature`
5. **Pull Request** oluşturun

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## ⚠️ Yasal Uyarı

Bu araç eğitim ve araştırma amaçlıdır. Kullanırken:
- Google'ın hizmet şartlarına uyun
- Makul kullanım sınırlarını aşmayın
- Kişisel verileri koruyun
- Ticari kullanım için izin alın

## 🆕 Son Güncellemeler (v2.1)

### ✅ Düzeltilen Sorunlar
- **HTTPS Sorunları**: Tüm API çağrıları güvenli bağlantıya çevrildi
- **CORS Hataları**: 4 farklı proxy ile cross-origin sorunları çözüldü
- **Favicon 404**: SVG favicon eklendi, 404 hatası giderildi
- **Mixed Content**: HTTP/HTTPS karışık içerik sorunu çözüldü

### 🚀 Yeni Özellikler
- **Gelişmiş Web Scraping**: 4 proxy ile Google arama sonuçlarından veri çekme
- **Akıllı E-mail Arama**: Website'lerden otomatik e-mail bulma
- **API Optimizasyonu**: OpenStreetMap ve Photon API'leri optimize edildi
- **Hata Toleransı**: Gelişmiş fallback sistemleri

### 📅 Güncelleme Tarihi
**Son Güncelleme**: 31 Ağustos 2025

---

**Made with ❤️ for the developer community**