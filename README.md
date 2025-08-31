# 🗺️ Google Maps İşletme Bilgi Toplayıcı

Google Maps'ten işletme bilgilerini otomatik olarak toplayan modern web uygulaması.

## 🚀 Canlı Demo

**GitHub Pages:** [https://cemalkarapinar.github.io/Google-Maps-letme-Bilgilerinden-E-Mail-Bulan-Uygulama](https://cemalkarapinar.github.io/Google-Maps-letme-Bilgilerinden-E-Mail-Bulan-Uygulama)

## ✨ Özellikler

- 🔍 **Gerçek Veri Toplama**: Chrome Extension ile Google Maps'ten gerçek veriler
- 📊 **Akıllı Arama**: Anahtar kelime, ülke ve şehir bazlı filtreleme
- 📧 **E-mail Bulma**: İşletme websitelerinden otomatik e-mail çıkarma
- 📱 **Responsive Tasarım**: Tüm cihazlarda mükemmel görünüm
- 📄 **Çoklu Export**: Excel, CSV, PDF, Word formatlarında indirme
- ⏱️ **Gerçek Zamanlı**: Canlı ilerleme takibi ve süre gösterimi
- 📧 **Toplu Mail**: Webmail entegrasyonu ile toplu e-mail gönderme

## 🎯 GitHub Pages'de Kullanım

### 1. Web Uygulaması
- Direkt tarayıcınızda çalışır
- Demo verilerle test edebilirsiniz
- Temel özellikleri deneyimleyin

### 2. Chrome Extension (Gerçek Veri İçin)
1. **Extension İndir**: Web uygulamasında "Extension Yükle" butonuna tıklayın
2. **Chrome'a Yükle**: 
   - `chrome://extensions/` adresine gidin
   - "Geliştirici modu"nu açın
   - "Paketlenmemiş öğe yükle" ile klasörü seçin
3. **Kullan**: Google Maps'te arama yapın ve "📊 Verileri Topla" butonuna tıklayın

## 🛠️ Yerel Kurulum (Opsiyonel)

```bash
# Projeyi klonlayın
git clone https://github.com/cemalkarapinar/Google-Maps-letme-Bilgilerinden-E-Mail-Bulan-Uygulama.git
cd Google-Maps-letme-Bilgilerinden-E-Mail-Bulan-Uygulama

# Bağımlılıkları yükleyin
npm install

# Backend sunucuyu başlatın (gerçek scraping için)
npm start

# Tarayıcıda açın
open http://localhost:3001
```

## 📋 Kullanım Kılavuzu

### Web Uygulaması
1. **Arama Parametreleri**: Kelime, ülke, şehir girin
2. **Demo Test**: "Aramayı Başlat" ile demo verileri görün
3. **Export**: Verileri istediğiniz formatta indirin

### Chrome Extension (Gerçek Veri)
1. **Google Maps**: [maps.google.com](https://maps.google.com) açın
2. **Arama**: İstediğiniz kelimeyi arayın (örn: "restoran istanbul")
3. **Topla**: Sağ üstteki "📊 Verileri Topla" butonuna tıklayın
4. **İndir**: Otomatik olarak CSV dosyası indirilir

## 🔧 Teknik Özellikler

### Frontend
- **Vanilla JavaScript**: Framework bağımsız, hızlı
- **Modern CSS**: Flexbox, Grid, CSS Variables
- **Progressive Enhancement**: Temel işlevsellik her yerde çalışır
- **Export Libraries**: XLSX, jsPDF, html2canvas

### Chrome Extension
- **Manifest V3**: En güncel Chrome extension standardı
- **Content Scripts**: Google Maps sayfasında çalışır
- **Real Scraping**: Gerçek DOM'dan veri çeker
- **Auto Download**: CSV formatında otomatik indirme

### Backend (Opsiyonel)
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

- ✅ **CORS Friendly**: Cross-origin istekler desteklenir
- ✅ **Rate Limited**: Aşırı kullanımı önler
- ✅ **Input Validation**: Güvenli veri işleme
- ✅ **Error Handling**: Kapsamlı hata yönetimi
- ⚠️ **Sorumluluk**: Google ToS'a uygun kullanım gereklidir

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

---

**Made with ❤️ for the developer community**