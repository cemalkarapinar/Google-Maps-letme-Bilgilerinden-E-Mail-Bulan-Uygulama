// Vercel serverless function - Gerçek veri çekme v2
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { keyword, city, country } = req.query;

    if (!keyword || !country) {
        return res.status(400).json({
            success: false,
            error: 'Keyword ve country parametreleri gereklidir'
        });
    }

    try {
        console.log(`API çağrısı: ${keyword} - ${city} - ${country}`);

        // Gerçek veri çekme - OpenStreetMap API'leri
        const businesses = await tryMultipleSources(keyword, city, country);

        res.status(200).json({
            success: true,
            count: businesses.length,
            data: businesses,
            message: 'Gerçek veri API\'si aktif - v2'
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            data: []
        });
    }
}

async function tryMultipleSources(keyword, city, country) {
    const allBusinesses = [];

    try {
        console.log('Gerçek veri kaynakları deneniyor...');

        // 1. OpenStreetMap Nominatim API
        const osmData = await tryOpenStreetMapAPI(keyword, city, country);
        if (osmData && osmData.length > 0) {
            allBusinesses.push(...osmData);
            console.log(`OSM: ${osmData.length} işletme bulundu`);
        }

        // Duplicate'ları temizle
        const uniqueBusinesses = removeDuplicates(allBusinesses);

        // Eğer gerçek veri bulunamazsa demo veri döndür
        if (uniqueBusinesses.length === 0) {
            console.log('Gerçek veri bulunamadı, demo veri döndürülüyor');
            return generateDemoData(keyword, city, country);
        }

        console.log(`Toplam ${uniqueBusinesses.length} gerçek işletme bulundu`);
        return uniqueBusinesses.slice(0, 20);

    } catch (error) {
        console.error('Veri çekme hatası:', error);
        return generateDemoData(keyword, city, country);
    }
}

async function tryOpenStreetMapAPI(keyword, city, country) {
    try {
        const location = city ? `${city}, ${country}` : country;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword + ' ' + location)}&format=json&addressdetails=1&limit=10&extratags=1`;

        console.log(`OSM API deneniyor...`);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'GoogleMapsScraperWeb/1.0',
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();

            if (data && data.length > 0) {
                const businesses = data.map(item => ({
                    name: item.name || item.display_name?.split(',')[0] || 'Bilinmeyen İşletme',
                    address: item.display_name || 'Adres bulunamadı',
                    phone: item.extratags?.phone || item.extratags?.['contact:phone'] || 'Bulunamadı',
                    website: item.extratags?.website || item.extratags?.['contact:website'] || 'Bulunamadı',
                    email: item.extratags?.email || item.extratags?.['contact:email'] || 'Bulunamadı',
                    source: 'OpenStreetMap'
                })).filter(b => b.name !== 'Bilinmeyen İşletme' && b.name.length > 2);
                
                if (businesses.length > 0) {
                    console.log(`OSM API başarılı: ${businesses.length} işletme`);
                    return businesses;
                }
            }
        }

        return null;
    } catch (error) {
        console.error('OSM API hatası:', error);
        return null;
    }
}

function removeDuplicates(businesses) {
    const seen = new Set();
    return businesses.filter(business => {
        const key = business.name.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function generateDemoData(keyword, city, country) {
    const demoBusinesses = [];
    const cityName = city || 'İstanbul';

    for (let i = 1; i <= 8; i++) {
        demoBusinesses.push({
            name: `${keyword} Firması ${i} - ${cityName}`,
            address: `${cityName} Merkez, ${country}`,
            phone: `0555 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)}`,
            email: i <= 4 ? `info${i}@${keyword.toLowerCase().replace(/\s+/g, '')}.com` : 'Bulunamadı',
            website: i <= 6 ? `www.${keyword.toLowerCase().replace(/\s+/g, '')}${i}.com` : 'Bulunamadı',
            source: 'Demo Veri (API\'ler çalışmadı)'
        });
    }

    return demoBusinesses;
}