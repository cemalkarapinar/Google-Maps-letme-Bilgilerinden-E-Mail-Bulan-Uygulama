// Vercel serverless function - Bilgisayardaki güçlü versiyon v3
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
        console.log(`GÜÇLÜ API çağrısı: ${keyword} - ${city} - ${country}`);

        // Çoklu kaynak stratejisi - bilgisayardaki gibi
        const businesses = await tryMultipleSources(keyword, city, country);

        res.status(200).json({
            success: true,
            count: businesses.length,
            data: businesses,
            version: 'Güçlü API v3'
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
        console.log('🔍 Çoklu güçlü API kaynaklarından veri çekiliyor...');

        // 1. OpenStreetMap Nominatim API (geliştirilmiş)
        const osmData = await tryOpenStreetMapAPI(keyword, city, country);
        if (osmData && osmData.length > 0) {
            allBusinesses.push(...osmData);
            console.log(`✅ OSM: ${osmData.length} işletme bulundu`);
        }

        // 2. Overpass API (POI)
        const poiData = await tryOverpassAPI(keyword, city, country);
        if (poiData && poiData.length > 0) {
            allBusinesses.push(...poiData);
            console.log(`✅ Overpass: ${poiData.length} işletme bulundu`);
        }

        // 3. Web Scraping (sınırlı)
        const webData = await tryWebScraping(keyword, city, country);
        if (webData && webData.length > 0) {
            allBusinesses.push(...webData);
            console.log(`✅ Web: ${webData.length} işletme bulundu`);
        }

        // Duplicate'ları temizle
        const uniqueBusinesses = removeDuplicates(allBusinesses);

        // Eğer gerçek veri bulunamazsa demo veri döndür
        if (uniqueBusinesses.length === 0) {
            console.log('❌ Hiç gerçek veri bulunamadı, demo veri döndürülüyor');
            return generateDemoData(keyword, city, country);
        }

        console.log(`🎉 Toplam ${uniqueBusinesses.length} gerçek işletme bulundu`);
        return uniqueBusinesses.slice(0, 20); // Maksimum 20 sonuç

    } catch (error) {
        console.error('Veri çekme hatası:', error);
        return generateDemoData(keyword, city, country);
    }
}

// OpenStreetMap Nominatim API - Geliştirilmiş (bilgisayardaki gibi)
async function tryOpenStreetMapAPI(keyword, city, country) {
    try {
        const location = city ? `${city}, ${country}` : country;
        
        // Orijinal çalışan endpoint'ler (bilgisayardaki gibi)
        const endpoints = [
            // Şehir + anahtar kelime (en spesifik)
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword + ' ' + city)}&countrycodes=tr&format=json&addressdetails=1&limit=15&extratags=1`,
            // Photon API şehir odaklı
            `https://photon.komoot.io/api/?q=${encodeURIComponent(keyword + ' ' + city)}&limit=15`,
            // Nominatim genel
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword + ' ' + location)}&format=json&addressdetails=1&limit=15&extratags=1`
        ];
        
        for (const url of endpoints) {
            try {
                console.log(`🔍 OSM API deneniyor: ${url.includes('photon') ? 'Photon' : 'Nominatim'}`);
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'GoogleMapsScraperWeb/1.0 (Educational Purpose)',
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`📊 OSM API yanıt: ${data?.length || data?.features?.length || 0} sonuç`);
                    
                    if (data && (data.length > 0 || (data.features && data.features.length > 0))) {
                        let businesses;
                        
                        if (url.includes('photon.komoot.io')) {
                            // Photon API format
                            businesses = data.features?.map(item => ({
                                name: item.properties?.name || item.properties?.street || 'Bilinmeyen İşletme',
                                address: formatPhotonAddress(item.properties),
                                phone: item.properties?.phone || 'Bulunamadı',
                                website: item.properties?.website || 'Bulunamadı',
                                email: item.properties?.email || 'Bulunamadı',
                                source: 'Photon API',
                                city: item.properties?.city || item.properties?.state || ''
                            })) || [];
                        } else {
                            // Nominatim format
                            businesses = data.map(item => ({
                                name: item.name || item.display_name?.split(',')[0] || 'Bilinmeyen İşletme',
                                address: item.display_name || 'Adres bulunamadı',
                                phone: item.extratags?.phone || item.extratags?.['contact:phone'] || 'Bulunamadı',
                                website: item.extratags?.website || item.extratags?.['contact:website'] || 'Bulunamadı',
                                email: item.extratags?.email || item.extratags?.['contact:email'] || 'Bulunamadı',
                                source: 'OpenStreetMap'
                            }));
                        }
                        
                        // Geçerli işletmeleri filtrele
                        let validBusinesses = businesses.filter(b => 
                            b.name !== 'Bilinmeyen İşletme' && 
                            b.name.length > 2 &&
                            !b.name.includes('undefined')
                        );
                        
                        // Şehir filtresi uygula (esnek)
                        if (city && validBusinesses.length > 0) {
                            const cityFiltered = validBusinesses.filter(b => 
                                b.address.toLowerCase().includes(city.toLowerCase()) ||
                                b.name.toLowerCase().includes(city.toLowerCase())
                            );
                            
                            // Orijinal şehir filtresi mantığı
                            if (cityFiltered.length > 0) {
                                validBusinesses = cityFiltered;
                                console.log(`🎯 ${city} şehrinde ${cityFiltered.length} işletme bulundu`);
                            } else {
                                // Şehir filtresi sonuç vermezse genel sonuçları kullan
                                console.log(`⚠️ ${city} şehrinde spesifik sonuç yok, genel sonuçlar: ${validBusinesses.length}`);
                            }
                        }
                        
                        if (validBusinesses.length > 0) {
                            console.log(`✅ OSM API başarılı: ${validBusinesses.length} işletme bulundu`);
                            return validBusinesses;
                        }
                    }
                }
            } catch (endpointError) {
                console.log(`❌ Endpoint hatası: ${endpointError.message}`);
            }
        }
        
        return null;
    } catch (error) {
        console.error('OpenStreetMap API hatası:', error);
        return null;
    }
}

function formatPhotonAddress(properties) {
    if (!properties) return 'Adres bulunamadı';
    
    const parts = [];
    if (properties.street) parts.push(properties.street);
    if (properties.housenumber) parts.push(properties.housenumber);
    if (properties.city) parts.push(properties.city);
    if (properties.postcode) parts.push(properties.postcode);
    if (properties.country) parts.push(properties.country);
    
    return parts.length > 0 ? parts.join(', ') : 'Adres bulunamadı';
}

// Overpass API (OpenStreetMap) ile POI verisi çek
async function tryOverpassAPI(keyword, city, country) {
    try {
        const query = `
            [out:json][timeout:25];
            (
              node["name"~"${keyword}",i]["addr:country"~"${country}",i];
              way["name"~"${keyword}",i]["addr:country"~"${country}",i];
              relation["name"~"${keyword}",i]["addr:country"~"${country}",i];
            );
            out center meta;
        `;
        
        console.log('🔍 Overpass API deneniyor...');
        const overpassUrl = 'https://overpass-api.de/api/interpreter';
        const response = await fetch(overpassUrl, {
            method: 'POST',
            body: query,
            headers: {
                'Content-Type': 'text/plain'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.elements && data.elements.length > 0) {
                const businesses = data.elements.slice(0, 10).map(element => ({
                    name: element.tags?.name || 'Bilinmeyen İşletme',
                    address: formatOSMAddress(element.tags),
                    phone: element.tags?.phone || element.tags?.['contact:phone'] || 'Bulunamadı',
                    website: element.tags?.website || element.tags?.['contact:website'] || 'Bulunamadı',
                    email: element.tags?.email || element.tags?.['contact:email'] || 'Bulunamadı',
                    source: 'OpenStreetMap POI'
                }));
                
                console.log(`✅ Overpass API başarılı: ${businesses.length} işletme`);
                return businesses;
            }
        }
        return null;
    } catch (error) {
        console.error('Overpass API hatası:', error);
        return null;
    }
}

function formatOSMAddress(tags) {
    if (!tags) return 'Adres bulunamadı';
    
    const addressParts = [];
    if (tags['addr:street']) addressParts.push(tags['addr:street']);
    if (tags['addr:housenumber']) addressParts.push(tags['addr:housenumber']);
    if (tags['addr:neighbourhood']) addressParts.push(tags['addr:neighbourhood']);
    if (tags['addr:district']) addressParts.push(tags['addr:district']);
    if (tags['addr:city']) addressParts.push(tags['addr:city']);
    if (tags['addr:postcode']) addressParts.push(tags['addr:postcode']);
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'Adres bulunamadı';
}

// Web scraping (sınırlı)
async function tryWebScraping(keyword, city, country) {
    try {
        console.log('🔍 Web scraping deneniyor...');
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
                        console.log(`✅ Web scraping başarılı: ${businesses.length} işletme`);
                        return businesses;
                    }
                }
            } catch (proxyError) {
                console.log(`❌ Proxy hatası: ${proxyError.message}`);
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