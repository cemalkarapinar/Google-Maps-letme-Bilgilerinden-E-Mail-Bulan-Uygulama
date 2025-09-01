# GitHub Pages Deployment Notları

## GitHub Pages vs Vercel Farkları

### GitHub Pages (Statik Hosting)
- ✅ Statik dosyalar (HTML, CSS, JS) çalışır
- ❌ Serverless function'lar çalışmaz
- ✅ Frontend API çağrıları çalışır
- ✅ OpenStreetMap API'leri çalışır
- ✅ CORS proxy'ler çalışır (sınırlı)

### Vercel (Serverless + Statik)
- ✅ Statik dosyalar çalışır
- ✅ Serverless function'lar çalışır
- ✅ Backend API endpoint'leri çalışır
- ✅ Tüm özellikler çalışır

## GitHub Pages'de Çalışan Özellikler

### ✅ Çalışan Veri Kaynakları
1. **OpenStreetMap Nominatim API**
   - Gerçek işletme verileri
   - Adres, telefon, website bilgileri
   - Ücretsiz ve sınırsız

2. **Photon API (Komoot)**
   - OpenStreetMap tabanlı
   - Coğrafi arama
   - Hızlı sonuçlar

3. **Overpass API**
   - OpenStreetMap POI verileri
   - Detaylı işletme bilgileri
   - Gerçek zamanlı veriler

4. **Web Scraping (Sınırlı)**
   - CORS proxy'ler ile
   - Google arama sonuçları
   - Sınırlı başarı oranı

### ❌ Çalışmayan Özellikler
1. **Vercel Serverless Function** (`/api/search`)
   - GitHub Pages statik hosting
   - Backend kodu çalışmaz

2. **Puppeteer Backend**
   - Node.js backend gerektirir
   - GitHub Pages'de desteklenmez

## Performans Karşılaştırması

### GitHub Pages
- **Veri Kalitesi:** Orta-İyi (OpenStreetMap verileri)
- **Hız:** Hızlı (doğrudan API çağrıları)
- **Güvenilirlik:** İyi (birden fazla kaynak)
- **Maliyet:** Ücretsiz

### Vercel (Önerilen)
- **Veri Kalitesi:** Çok İyi (tüm kaynaklar + serverless)
- **Hız:** Çok Hızlı (optimize edilmiş backend)
- **Güvenilirlik:** Çok İyi (fallback mekanizmaları)
- **Maliyet:** Ücretsiz (hobby plan)

## Deployment Talimatları

### GitHub Pages için:
```bash
# 1. Repository'yi GitHub'a push et
git add .
git commit -m "GitHub Pages deployment"
git push origin main

# 2. GitHub Settings > Pages
# Source: Deploy from a branch
# Branch: main / (root)

# 3. URL: https://username.github.io/repository-name
```

### Vercel için (Önerilen):
```bash
# 1. Vercel hesabı oluştur: vercel.com
# 2. GitHub repository'yi bağla
# 3. Otomatik deploy
# 4. Custom domain (opsiyonel)
```

## Test Sonuçları

### GitHub Pages Test
- **OpenStreetMap API:** ✅ Çalışıyor
- **Photon API:** ✅ Çalışıyor  
- **Overpass API:** ✅ Çalışıyor
- **Web Scraping:** ⚠️ Sınırlı (CORS)
- **Serverless API:** ❌ Çalışmıyor

### Vercel Test
- **Tüm Özellikler:** ✅ Çalışıyor
- **Serverless API:** ✅ Çalışıyor
- **Backend Processing:** ✅ Çalışıyor

## Öneriler

1. **Production için Vercel kullanın** - Daha iyi performans ve özellikler
2. **GitHub Pages demo/test için uygun** - Ücretsiz ve hızlı
3. **Her iki platform da gerçek veri çekiyor** - Farklı kaynaklardan

## Sorun Giderme

### GitHub Pages'de veri çekilmiyor:
1. Browser console'u kontrol edin
2. CORS hatalarını kontrol edin
3. API rate limit'lerini kontrol edin
4. Network sekmesini kontrol edin

### Vercel'de deployment sorunu:
1. Build log'larını kontrol edin
2. Environment variables'ları kontrol edin
3. Function timeout'larını kontrol edin

## Sonuç

Her iki platform da çalışıyor, ancak Vercel daha kapsamlı özellikler sunuyor. GitHub Pages basit kullanım için yeterli.