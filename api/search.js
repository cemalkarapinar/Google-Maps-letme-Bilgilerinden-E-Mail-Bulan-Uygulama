// Vercel serverless function - Gerçek veri çekme
// Node.js 22.x runtime
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

        // Çoklu kaynak stratejisi
        const businesses = await tryMultipleSources(keyword, city, country);

        res.status(200).json({
            success: true,
            count: businesses.length,
            data: businesses
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
        // 1. OpenStreetMap Nominatim API
        const osmData = await tryOpenStreetMapAPI(keyword, city, country);
        if (osmData && osmData.length > 0) {
            allBusinesses.push(...osmData);
            console.log(`OSM: ${osmData.length} işletme bulundu`);
        }

        // 2. Overpass API
        const overpassData = await tryOverpassAPI(keyword, city, country);
        if (overpassData && overpassData.length > 0) {
            allBusinesses.push(...overpassData);
            console.log(`Overpass: ${overpassData.length} işletme bulundu`);
        }

        // 3. Web scraping (sınırlı)
        const webData = await tryWebScraping(keyword, city, country);
        if (webData && webData.length > 0) {
            allBusinesses.push(...webData);
            console.log(`Web: ${webData.length} işletme bulundu`);
        }

        // Duplicate'ları temizle
        const uniqueBusinesses = removeDuplicates(allBusinesses);

        // Eğer gerçek veri bulunamazsa demo veri döndür
        if (uniqueBusinesses.length === 0) {
            return generateDemoData(keyword, city, country);
        }

        return uniqueBusinesses.slice(0, 20); // Maksimum 20 sonuç

    } catch (error) {
        console.error('Veri çekme hatası:', error);
        return generateDemoData(keyword, city, country);
    }
}

async function tryOpenStreetMapAPI(keyword, city, country) {
    try {
        const location = city ? `${city}, ${country}` : country;
        const endpoints = [
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword + ' ' + location)}&format=json&addressdetails=1&limit=10&extratags=1`,
            `https://photon.komoot.io/api/?q=${encodeURIComponent(keyword + ' ' + location)}&limit=10`
        ];

        for (const url of endpoints) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'GoogleMapsScraperWeb/1.0',
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();

                    if (data && data.length > 0) {
                        return data.map(item => ({
                            name: item.name || item.display_name?.split(',')[0] || 'Bilinmeyen İşletme',
                            address: item.display_name || formatAddress(item),
                            phone: item.extratags?.phone || item.extratags?.['contact:phone'] || 'Bulunamadı',
                            website: item.extratags?.website || item.extratags?.['contact:website'] || 'Bulunamadı',
                            email: item.extratags?.email || item.extratags?.['contact:email'] || 'Bulunamadı',
                            source: 'OpenStreetMap'
                        })).filter(b => b.name !== 'Bilinmeyen İşletme' && b.name.length > 2);
                    }
                }
            } catch (endpointError) {
                console.log(`OSM endpoint hatası: ${endpointError.message}`);
            }
        }

        return null;
    } catch (error) {
        console.error('OSM API hatası:', error);
        return null;
    }
}

async function tryOverpassAPI(keyword, city, country) {
    try {
        const query = `
            [out:json][timeout:15];
            (
              node["name"~"${keyword}",i]["addr:country"~"${country}",i];
              way["name"~"${keyword}",i]["addr:country"~"${country}",i];
            );
            out center meta;
        `;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
            headers: {
                'Content-Type': 'text/plain'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.elements && data.elements.length > 0) {
                return data.elements.slice(0, 10).map(element => ({
                    name: element.tags?.name || 'Bilinmeyen İşletme',
                    address: formatOSMAddress(element.tags),
                    phone: element.tags?.phone || element.tags?.['contact:phone'] || 'Bulunamadı',
                    website: element.tags?.website || element.tags?.['contact:website'] || 'Bulunamadı',
                    email: element.tags?.email || element.tags?.['contact:email'] || 'Bulunamadı',
                    source: 'OpenStreetMap POI'
                }));
            }
        }
        return null;
    } catch (error) {
        console.error('Overpass API hatası:', error);
        return null;
    }
}

async function tryWebScraping(keyword, city, country) {
    try {
        // Basit web scraping - sınırlı çalışır
        const searchQuery = `${keyword} ${city} ${country} telefon`;
        const corsProxies = [
            'https://api.codetabs.com/v1/proxy?quest=',
            'https://corsproxy.io/?'
        ];

        for (const proxy of corsProxies) {
            try {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
                const response = await fetch(proxy + encodeURIComponent(searchUrl), {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (response.ok) {
                    const html = await response.text();
                    const businesses = parseGoogleHTML(html, city);
                    if (businesses.length > 0) {
                        return businesses;
                    }
                }
            } catch (proxyError) {
                console.log(`Proxy hatası: ${proxyError.message}`);
            }
        }

        return null;
    } catch (error) {
        console.error('Web scraping hatası:', error);
        return null;
    }
}

function parseGoogleHTML(html, city) {
    // Basit HTML parsing - regex ile
    const businesses = [];

    try {
        // İşletme isimlerini ara
        const nameRegex = /<h3[^>]*>([^<]+)<\/h3>/g;
        const phoneRegex = /(\+90[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}|0\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/g;
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

        let nameMatch;
        let count = 0;

        while ((nameMatch = nameRegex.exec(html)) !== null && count < 5) {
            const name = nameMatch[1].trim();
            if (name.length > 3 && !name.includes('...')) {
                businesses.push({
                    name: name,
                    address: city ? `${city}, Türkiye` : 'Türkiye',
                    phone: 'Bulunamadı',
                    website: 'Bulunamadı',
                    email: 'Bulunamadı',
                    source: 'Google Search'
                });
                count++;
            }
        }

        return businesses;
    } catch (error) {
        console.error('HTML parsing hatası:', error);
        return [];
    }
}

function formatAddress(item) {
    if (!item) return 'Adres bulunamadı';

    const parts = [];
    if (item.address?.road) parts.push(item.address.road);
    if (item.address?.city) parts.push(item.address.city);
    if (item.address?.country) parts.push(item.address.country);

    return parts.length > 0 ? parts.join(', ') : 'Adres bulunamadı';
}

function formatOSMAddress(tags) {
    if (!tags) return 'Adres bulunamadı';

    const parts = [];
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    if (tags['addr:country']) parts.push(tags['addr:country']);

    return parts.length > 0 ? parts.join(', ') : 'Adres bulunamadı';
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
            source: 'Demo Veri'
        });
    }

    return demoBusinesses;
}