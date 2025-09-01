# Vercel Deployment Test Kılavuzu

## 🚀 Build Tamamlandıktan Sonra

### 1. Vercel URL'ini Al
- Vercel dashboard'unda deployment tamamlandığında
- "Visit" butonuna tıkla veya URL'i kopyala
- Örnek: `https://your-project-name.vercel.app`

### 2. Ana Sayfayı Test Et
```
https://your-project-name.vercel.app
```
- ✅ Sayfa yüklenmeli
- ✅ Form elemanları görünmeli
- ✅ Türk şehirleri dropdown'da olmalı

### 3. API Endpoint'ini Test Et
```
https://your-project-name.vercel.app/api/search?keyword=seo&country=Türkiye&city=İstanbul
```
- ✅ JSON response dönmeli
- ✅ `success: true` olmalı
- ✅ `data` array'inde işletmeler olmalı

### 4. Frontend Entegrasyonunu Test Et
1. Ana sayfada form doldur:
   - **Kelime**: seo
   - **Ülke**: Türkiye  
   - **Şehir**: İstanbul
2. "Aramayı Başlat" butonuna tıkla
3. Console'u aç (F12)
4. Şu mesajları görmeli:
   - "Vercel API çağrısı: /api/search?..."
   - "Vercel API yanıtı: {success: true, ...}"
   - "Vercel API başarılı: X işletme bulundu"

### 5. Beklenen Sonuçlar

#### ✅ Başarılı Durumda:
- Status: "✅ X gerçek işletme bulundu! (Vercel API)"
- Tabloda gerçek işletme verileri
- OpenStreetMap'ten gelen adresler
- Bazı işletmelerde telefon/email bilgileri

#### ⚠️ API Başarısızsa:
- Status: "✅ X gerçek işletme bulundu! (Çoklu Kaynak)"
- Diğer API'lerden gelen veriler
- Yine gerçek veriler ama farklı kaynaklardan

#### ❌ Hiç Veri Gelmezse:
- Status: "⚠️ Gerçek veri çekilemedi. Demo veriler gösteriliyor..."
- Demo işletme verileri
- Bu durumda API'lerde sorun var demektir

### 6. Hata Durumunda Kontrol Et

#### Console Hataları:
```javascript
// F12 > Console sekmesi
// Şu hataları ara:
- "Vercel API hatası: 500"
- "CORS error"
- "Network error"
- "Fetch failed"
```

#### Network Sekmesi:
```
F12 > Network sekmesi
- /api/search isteğini bul
- Status code'u kontrol et (200 olmalı)
- Response'u kontrol et
```

### 7. Performans Testi

#### Hız Testi:
- İlk yükleme: ~2-3 saniye
- API yanıtı: ~3-5 saniye
- Toplam süre: ~5-8 saniye

#### Veri Kalitesi:
- OpenStreetMap: En kaliteli veriler
- Gerçek adresler ve koordinatlar
- Bazı işletmelerde iletişim bilgileri

### 8. Sorun Giderme

#### API 500 Hatası:
```bash
# Vercel dashboard > Functions > Logs
# Hata detaylarını kontrol et
```

#### CORS Hatası:
- `vercel.json`'da CORS header'ları var mı kontrol et
- Browser'da "Disable CORS" extension dene

#### Timeout Hatası:
- API çağrısı 30 saniyede timeout oluyor
- Normal, yeniden dene

### 9. GitHub Pages ile Karşılaştırma

| Özellik | GitHub Pages | Vercel |
|---------|--------------|--------|
| **API Endpoint** | ❌ | ✅ |
| **Serverless Function** | ❌ | ✅ |
| **OpenStreetMap** | ✅ | ✅ |
| **Veri Kalitesi** | İyi | Mükemmel |
| **Hız** | Hızlı | Çok Hızlı |

### 10. Başarı Kriterleri

✅ **Minimum Başarı:**
- Sayfa yükleniyor
- API endpoint çalışıyor
- En az demo veriler geliyor

✅ **Tam Başarı:**
- Vercel API çalışıyor
- Gerçek işletme verileri geliyor
- OpenStreetMap entegrasyonu çalışıyor

✅ **Mükemmel Başarı:**
- Tüm API'ler çalışıyor
- Hızlı yanıt süreleri
- Kaliteli veri seti

## 🎯 Test Sonrası

Build tamamlandığında bu adımları takip et ve sonuçları paylaş!