// Vercel serverless function - Python mantığına göre güçlendirilmiş v4
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
        console.log(`🔍 GÜÇLÜ API v4 çağrısı: ${keyword} - ${city} - ${country}`);

        // Python kodundaki gibi çoklu kaynak stratejisi
        const businesses = await tryMultipleSourcesAdvanced(keyword, city, country);

        // E-mail adreslerini geliştir
        const enhancedBusinesses = await enhanceBusinessesWithEmails(businesses);

        res.status(200).json({
            success: true,
            count: enhancedBusinesses.length,
            data: enhancedBusinesses,
            version: 'Python-Based API v4',
            timestamp: new Date().toISOString()
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

async function tryMultipleSourcesAdvanced(keyword, city, country) {
    const allBusinesses = [];

    try {
        console.log('🔍 Python mantığıyla çoklu kaynaklardan veri çekiliyor...');

        // 1. OpenStreetMap Nominatim API (geliştirilmiş)
        const osmData = await tryOpenStreetMapAPIAdvanced(keyword, city, country);
        if (osmData && osmData.length > 0) {
            allBusinesses.push(...osmData);
            console.log(`✅ OSM Advanced: ${osmData.length} işletme bulundu`);
        }

        // 2. Google Maps benzeri web scraping (Python tarzı)
        const webData = await tryAdvancedWebScraping(keyword, city, country);
        if (webData && webData.length > 0) {
            allBusinesses.push(...webData);
            console.log(`✅ Advanced Web: ${webData.length} işletme bulundu`);
        }

        // 3. Overpass API (POI)
        const poiData = await tryOverpassAPI(keyword, city, country);
        if (poiData && poiData.length > 0) {
            allBusinesses.push(...poiData);
            console.log(`✅ Overpass: ${poiData.length} işletme bulundu`);
        }

        // Duplicate'ları temizle (Python'daki gibi)
        const uniqueBusinesses = removeDuplicatesAdvanced(allBusinesses);

        // Eğer gerçek veri bulunamazsa demo veri döndür
        if (uniqueBusinesses.length === 0) {
            console.log('❌ Hiç gerçek veri bulunamadı, demo veri döndürülüyor');
            return generateAdvancedDemoData(keyword, city, country);
        }

        console.log(`🎉 Toplam ${uniqueBusinesses.length} gerçek işletme bulundu`);
        return uniqueBusinesses.slice(0, 25); // Maksimum 25 sonuç

    } catch (error) {
        console.error('Veri çekme hatası:', error);
        return generateAdvancedDemoData(keyword, city, country);
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

// OpenStreetMap Nominatim API - Python mantığına göre geliştirilmiş
async function tryOpenStreetMapAPIAdvanced(keyword, city, country) {
    try {
        const location = city ? `${city}, ${country}` : country;
        
        // Python'daki gibi çoklu endpoint stratejisi
        const endpoints = [
            // Şehir + anahtar kelime (en spesifik) - Python'daki gibi
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword + ' ' + city)}&countrycodes=tr&format=json&addressdetails=1&limit=20&extratags=1&dedupe=1`,
            // Photon API şehir odaklı - geliştirilmiş
            `https://photon.komoot.io/api/?q=${encodeURIComponent(keyword + ' ' + city + ' türkiye')}&limit=20&lang=tr`,
            // Nominatim genel - geliştirilmiş filtreler
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword + ' ' + location)}&format=json&addressdetails=1&limit=20&extratags=1&dedupe=1`,
            // Kategori bazlı arama
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword)}&city=${encodeURIComponent(city || '')}&countrycodes=tr&format=json&addressdetails=1&limit=15&extratags=1&dedupe=1`
        ];
        
        for (const url of endpoints) {
            try {
                console.log(`🔍 OSM API deneniyor: ${url.includes('photon') ? 'Photon' : 'Nominatim'}`);
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'GoogleMapsScraperWeb/2.0 (Educational Purpose; Python-Based)',
                        'Accept': 'application/json',
                        'Accept-Language': 'tr,en;q=0.9'
                    },
                    signal: AbortSignal.timeout(12000)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`📈 OSM API yanıt: ${data?.length || data?.features?.length || 0} sonuç`);
                    
                    if (data && (data.length > 0 || (data.features && data.features.length > 0))) {
                        let businesses;
                        
                        if (url.includes('photon.komoot.io')) {
                            // Photon API format - geliştirilmiş
                            businesses = data.features?.map(item => ({
                                name: item.properties?.name || item.properties?.street || 'Bilinmeyen İşletme',
                                address: formatPhotonAddressAdvanced(item.properties),
                                phone: item.properties?.phone || item.properties?.['contact:phone'] || 'Bulunamadı',
                                website: item.properties?.website || item.properties?.['contact:website'] || 'Bulunamadı',
                                email: item.properties?.email || item.properties?.['contact:email'] || 'Bulunamadı',
                                source: 'Photon API Advanced',
                                city: item.properties?.city || item.properties?.state || '',
                                coordinates: item.geometry?.coordinates || null
                            })) || [];
                        } else {
                            // Nominatim format - Python tarzı parsing
                            businesses = data.map(item => ({
                                name: extractBusinessNameAdvanced(item),
                                address: item.display_name || 'Adres bulunamadı',
                                phone: extractContactInfo(item, 'phone') || 'Bulunamadı',
                                website: extractContactInfo(item, 'website') || 'Bulunamadı',
                                email: extractContactInfo(item, 'email') || 'Bulunamadı',
                                source: 'OpenStreetMap Advanced',
                                type: item.type || 'unknown',
                                importance: item.importance || 0
                            }));
                        }
                        
                        // Python'daki gibi gelişmiş filtreleme
                        let validBusinesses = filterValidBusinesses(businesses, keyword);
                        
                        // Şehir filtresi uygula (Python mantığı)
                        if (city && validBusinesses.length > 0) {
                            const cityFiltered = applyCityFilter(validBusinesses, city);
                            
                            if (cityFiltered.length > 0) {
                                validBusinesses = cityFiltered;
                                console.log(`🎯 ${city} şehrinde ${cityFiltered.length} işletme bulundu`);
                            } else {
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

// Python tarzı gelişmiş web scraping
async function tryAdvancedWebScraping(keyword, city, country) {
    try {
        console.log('🔍 Python tarzı gelişmiş web scraping deneniyor...');
        
        // Python'daki gibi çoklu arama sorguları
        const searchQueries = [
            `${keyword} ${city} telefon email adres`,
            `${keyword} firması ${city}`,
            `${keyword} ${city} ${country} iletişim`,
            `"${keyword}" ${city} site:*.com`,
            `${keyword} ${city} directory listing`
        ];
        
        // Çalışan CORS proxy'leri - Python'daki mantıkla
        const corsProxies = [
            'https://api.codetabs.com/v1/proxy?quest=',
            'https://corsproxy.io/?',
            // Yedek proxy'ler
            'https://proxy.cors.sh/',
            'https://thingproxy.freeboard.io/fetch/'
        ];
        
        for (const searchQuery of searchQueries) {
            for (const proxy of corsProxies) {
                try {
                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&gl=tr&hl=tr&num=20`;
                    const proxyUrl = proxy + encodeURIComponent(searchUrl);
                    
                    console.log(`🔍 Web scraping: ${searchQuery.substring(0, 30)}...`);
                    
                    const response = await fetch(proxyUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
                        },
                        signal: AbortSignal.timeout(10000)
                    });
                    
                    if (response.ok) {
                        let html;
                        if (proxy.includes('codetabs')) {
                            html = await response.text();
                        } else if (proxy.includes('allorigins')) {
                            const json = await response.json();
                            html = json.contents;
                        } else {
                            html = await response.text();
                        }
                        
                        if (html && html.length > 1000) {
                            const businesses = parseGoogleSearchResultsAdvanced(html, keyword, city);
                            if (businesses.length > 0) {
                                console.log(`✅ Web scraping başarılı: ${businesses.length} işletme (${searchQuery.substring(0, 20)}...)`);
                                return businesses;
                            }
                        }
                    }
                } catch (error) {
                    console.log(`❌ Proxy ${proxy.substring(0, 20)}... hatası: ${error.message}`);
                    continue;
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('Gelişmiş web scraping hatası:', error);
        return null;
    }
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

function removeDuplicatesAdvanced(businesses) {
    const seen = new Set();
    const seenNames = new Set();
    
    return businesses.filter(business => {
        // Normalleştirilmiş isim kontrolü (Python'daki gibi)
        const normalizedName = business.name.toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ');
        
        // Duplicate kontrolü
        const key = `${normalizedName}_${business.address?.toLowerCase().substring(0, 20) || ''}`;
        
        if (seen.has(key) || seenNames.has(normalizedName)) {
            return false;
        }
        
        seen.add(key);
        seenNames.add(normalizedName);
        return true;
    });
}

function generateAdvancedDemoData(keyword, city, country) {
    const demoBusinesses = [];
    const cityName = city || 'İstanbul';
    const keywordNormalized = keyword.toLowerCase().replace(/\s+/g, '');

    // Python'daki gibi gerçekçi demo veri
    for (let i = 1; i <= 12; i++) {
        const businessTypes = ['Ltd. Şti.', 'A.Ş.', 'Tic. Ltd. Şti.', 'San. Tic. A.Ş.', ''];
        const businessType = businessTypes[i % businessTypes.length];
        
        demoBusinesses.push({
            name: `${keyword} ${businessType} ${i} - ${cityName}`,
            address: `${cityName} ${['Merkez', 'Çamlıca', 'Bağdat Cad.', 'Atatürk Bulvarı'][i % 4]}, ${country}`,
            phone: i <= 8 ? `0${[212, 216, 312, 232, 224][i % 5]} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)}` : 'Bulunamadı',
            email: i <= 6 ? `info${i}@${keywordNormalized}${i}.com` : 'Bulunamadı',
            website: i <= 8 ? `www.${keywordNormalized}${i}.com` : 'Bulunamadı',
            source: 'Python-Based Demo Data (API\'ler çalışmadı)'
        });
    }

    return demoBusinesses;
}

// Python'daki email bulma mantığı
async function enhanceBusinessesWithEmails(businesses) {
    console.log(`📧 ${businesses.length} işletme için e-mail adresleri geliştiriliyor...`);
    
    const enhancedBusinesses = [];
    
    for (let i = 0; i < businesses.length; i++) {
        const business = { ...businesses[i] };
        
        // E-mail bulunamadıysa ve website varsa, Python'daki gibi website'den ara
        if (business.email === 'Bulunamadı' && business.website !== 'Bulunamadı') {
            try {
                const foundEmail = await findEmailFromWebsiteAdvanced(business.website);
                if (foundEmail) {
                    business.email = foundEmail;
                    console.log(`📧 E-mail bulundu: ${foundEmail} (${business.name})`);
                }
            } catch (error) {
                console.log(`❌ E-mail arama hatası (${business.website}): ${error.message}`);
            }
        }
        
        enhancedBusinesses.push(business);
        
        // Progress log (Python'daki gibi)
        if (i % 3 === 0) {
            console.log(`📧 E-mail arama ilerlemesi: ${i + 1}/${businesses.length}`);
        }
    }
    
    const emailCount = enhancedBusinesses.filter(b => b.email !== 'Bulunamadı').length;
    console.log(`✅ E-mail geliştirme tamamlandı: ${emailCount}/${enhancedBusinesses.length} işletmede e-mail bulundu`);
    
    return enhancedBusinesses;
}

// Python'daki gibi gelişmiş e-mail bulma
async function findEmailFromWebsiteAdvanced(websiteUrl) {
    try {
        if (!websiteUrl || websiteUrl === 'Bulunamadı') return null;
        
        let url = websiteUrl;
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        
        // Çalışan CORS proxy'leri (Python mantığıyla)
        const corsProxies = [
            'https://api.codetabs.com/v1/proxy?quest=',
            'https://corsproxy.io/?',
            // Yedek proxy'ler
            'https://proxy.cors.sh/',
        ];
        
        for (const proxy of corsProxies) {
            try {
                const proxyUrl = proxy + encodeURIComponent(url);
                const response = await fetch(proxyUrl, {
                    signal: AbortSignal.timeout(8000),
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                
                if (response.ok) {
                    let html;
                    if (proxy.includes('allorigins')) {
                        const data = await response.json();
                        html = data.contents;
                    } else {
                        html = await response.text();
                    }
                    
                    if (html) {
                        const email = extractBestEmailAdvanced(html, url);
                        if (email) {
                            return email;
                        }
                    }
                }
            } catch (proxyError) {
                console.log(`Proxy ${proxy.substring(0, 20)}... başarısız: ${proxyError.message}`);
                continue;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Website e-mail arama hatası:', error);
        return null;
    }
}

// Python'daki gibi gelişmiş e-mail çıkarma
function extractBestEmailAdvanced(content, domainUrl) {
    try {
        // Python'daki gibi çoklu e-mail regex pattern'leri
        const emailPatterns = [
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            /mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi,
            /"email"\s*:\s*"([^"]+@[^"]+)"/gi,
            /'email'\s*:\s*'([^']+@[^']+)'/gi,
            /data-email=["']([^"']+@[^"']+)["']/gi,
            /href=["']mailto:([^"']+@[^"']+)["']/gi
        ];
        
        const allEmails = [];
        
        // Tüm pattern'leri dene
        for (const pattern of emailPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                allEmails.push(...matches.map(email => 
                    email.replace(/^(mailto:|"email"\s*:\s*"|'email'\s*:\s*'|data-email=["']|href=["']mailto:)/i, '')
                         .replace(/["'\]\)\}>]$/, '')
                         .trim()
                ));
            }
        }
        
        if (allEmails.length === 0) return null;
        
        // Tekrarları kaldır
        const uniqueEmails = [...new Set(allEmails)];
        
        // Python'daki gibi spam/geçersiz e-mailleri filtrele
        const spamKeywords = [
            'noreply', 'no-reply', 'donotreply', 'example.com', 'test.com',
            'dummy', 'fake', 'sample', 'placeholder', 'your-email',
            'youremail', 'email@', '@email', 'name@', '@name', 'user@',
            '@user', 'admin@example', 'test@test', 'info@example'
        ];
        
        const validEmails = uniqueEmails.filter(email => {
            const emailLower = email.toLowerCase();
            const isValid = emailLower.length > 5 && 
                           email.includes('@') && 
                           email.includes('.') &&
                           !spamKeywords.some(spam => emailLower.includes(spam)) &&
                           email.split('@')[1]?.includes('.');
            return isValid;
        });
        
        if (validEmails.length === 0) return null;
        
        // Python'daki gibi domain bazlı önceliklendirme
        try {
            const siteDomain = new URL(domainUrl).hostname.toLowerCase();
            const cleanSiteDomain = siteDomain.replace(/^www\./, '');
            
            // Aynı domain'den e-mail varsa öncelik ver
            for (const email of validEmails) {
                const emailDomain = email.split('@')[1]?.toLowerCase();
                if (emailDomain === cleanSiteDomain || 
                    emailDomain?.includes(cleanSiteDomain) || 
                    cleanSiteDomain.includes(emailDomain || '')) {
                    return email;
                }
            }
        } catch (error) {
            // URL parsing hatası - devam et
        }
        
        // Genel e-mail sağlayıcıları için öncelik sırası (Python'daki gibi)
        const priorityDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
        
        // Önce kurumsal e-mailleri tercih et
        for (const email of validEmails) {
            const emailDomain = email.split('@')[1]?.toLowerCase();
            if (!priorityDomains.some(provider => emailDomain?.includes(provider))) {
                return email;
            }
        }
        
        // Kurumsal bulunamazsa genel sağlayıcılardan seç
        return validEmails[0];
        
    } catch (error) {
        console.error('E-mail çıkarma hatası:', error);
        return null;
    }
}

// Python'daki gibi Google arama sonuçlarını parsing
function parseGoogleSearchResultsAdvanced(html, keyword, city) {
    const businesses = [];
    
    try {
        // Python'daki BeautifulSoup benzeri parsing
        // Google'da çoklu result selector'ları dene
        const resultPatterns = [
            /<h3[^>]*>([^<]+)<\/h3>/g,
            /<div[^>]*class="[^"]*BNeawe[^"]*"[^>]*>([^<]+)<\/div>/g,
            /<a[^>]*><h3[^>]*>([^<]+)<\/h3><\/a>/g
        ];
        
        const linkPatterns = [
            /<a[^>]*href="([^"]*)"/g,
            /url\?q=([^&]+)/g
        ];
        
        const phonePatterns = [
            /(\+90[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/g,
            /(0\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/g,
            /(\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/g
        ];
        
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        
        // İsimleri çıkar
        const names = [];
        for (const pattern of resultPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null && names.length < 15) {
                const name = match[1].trim();
                if (name.length > 3 && 
                    !name.includes('...') && 
                    !name.toLowerCase().includes('google') &&
                    !name.toLowerCase().includes('search')) {
                    names.push(name);
                }
            }
        }
        
        // Link'leri çıkar
        const links = [];
        for (const pattern of linkPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null && links.length < names.length) {
                let url = match[1];
                if (url.includes('url?q=')) {
                    url = decodeURIComponent(url.split('url?q=')[1].split('&')[0]);
                }
                if (url.startsWith('http') && !url.includes('google.com')) {
                    links.push(url);
                }
            }
        }
        
        // Telefon ve e-mail'leri çıkar
        const phones = [];
        const emails = [];
        
        for (const pattern of phonePatterns) {
            const phoneMatches = html.match(pattern) || [];
            phones.push(...phoneMatches.slice(0, names.length));
        }
        
        const emailMatches = html.match(emailPattern) || [];
        emails.push(...emailMatches.slice(0, names.length));
        
        // İşletmeleri oluştur
        for (let i = 0; i < Math.min(names.length, 10); i++) {
            const business = {
                name: names[i],
                website: links[i] || 'Bulunamadı',
                address: city ? `${city}, Türkiye` : 'Türkiye',
                phone: phones[i] || 'Bulunamadı',
                email: emails[i] || 'Bulunamadı',
                source: 'Google Search Advanced'
            };
            
            // Python'daki gibi keyword relevance kontrolü
            const isRelevant = business.name.toLowerCase().includes(keyword.toLowerCase()) ||
                              (city && business.name.toLowerCase().includes(city.toLowerCase()));
            
            if (isRelevant && business.name.length > 3) {
                businesses.push(business);
            }
        }
        
        return businesses;
        
    } catch (error) {
        console.error('Google HTML parsing hatası:', error);
        return [];
    }
}

// Python'daki gibi helper function'lar
function formatPhotonAddressAdvanced(properties) {
    if (!properties) return 'Adres bulunamadı';
    
    const parts = [];
    // Python'daki gibi daha detaylı adres parsing
    if (properties.name && properties.name !== properties.street) parts.push(properties.name);
    if (properties.street) parts.push(properties.street);
    if (properties.housenumber) parts.push('No: ' + properties.housenumber);
    if (properties.neighbourhood) parts.push(properties.neighbourhood);
    if (properties.district) parts.push(properties.district);
    if (properties.city) parts.push(properties.city);
    if (properties.postcode) parts.push(properties.postcode);
    if (properties.state && properties.state !== properties.city) parts.push(properties.state);
    if (properties.country) parts.push(properties.country);
    
    return parts.length > 0 ? parts.join(', ') : 'Adres bulunamadı';
}

function extractBusinessNameAdvanced(item) {
    // Python'daki gibi gelişmiş isim çıkarma
    if (item.name && item.name.length > 2) {
        return item.name;
    }
    
    if (item.display_name) {
        const parts = item.display_name.split(',');
        // İlk anlamlı kısmı al
        for (const part of parts) {
            const cleaned = part.trim();
            if (cleaned.length > 3 && 
                !cleaned.match(/^\d+$/) && 
                !cleaned.toLowerCase().includes('unnamed') &&
                !cleaned.toLowerCase().includes('turkey') &&
                !cleaned.toLowerCase().includes('türkiye')) {
                return cleaned;
            }
        }
    }
    
    return 'Bilinmeyen İşletme';
}

function extractContactInfo(item, type) {
    // Python'daki gibi contact bilgisi çıkarma
    const extratags = item.extratags || {};
    const tags = item.tags || {};
    
    const contactKeys = {
        phone: ['phone', 'contact:phone', 'telephone', 'mobile'],
        website: ['website', 'contact:website', 'url', 'homepage'],
        email: ['email', 'contact:email', 'e-mail']
    };
    
    const keys = contactKeys[type] || [];
    
    for (const key of keys) {
        if (extratags[key]) return extratags[key];
        if (tags[key]) return tags[key];
    }
    
    return null;
}

function filterValidBusinesses(businesses, keyword) {
    // Python'daki gibi gelişmiş business filtreleme
    return businesses.filter(b => {
        const name = b.name || '';
        const isValidName = name !== 'Bilinmeyen İşletme' && 
                           name.length > 2 &&
                           !name.includes('undefined') &&
                           !name.includes('null') &&
                           name.trim() !== '';
        
        // Keyword relevance (opsiyonel)
        const keywordRelevant = !keyword || 
                               name.toLowerCase().includes(keyword.toLowerCase()) ||
                               keyword.toLowerCase().includes(name.toLowerCase().split(' ')[0]);
        
        return isValidName && keywordRelevant;
    });
}

function applyCityFilter(businesses, city) {
    // Python'daki gibi esnek şehir filtresi
    return businesses.filter(b => {
        const address = (b.address || '').toLowerCase();
        const name = (b.name || '').toLowerCase();
        const cityLower = city.toLowerCase();
        
        return address.includes(cityLower) || 
               name.includes(cityLower) ||
               (b.city && b.city.toLowerCase().includes(cityLower));
    });
}