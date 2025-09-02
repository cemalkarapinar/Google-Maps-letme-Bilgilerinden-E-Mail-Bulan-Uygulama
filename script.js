class GoogleMapsScraperWeb {
    constructor() {
        this.businesses = [];
        this.isScrapingActive = false;
        this.progressInterval = null;
        this.scrapingStartTime = null;
        this.scrapingEndTime = null;
        this.webmailSettings = this.loadWebmailSettings();
        this.mailTemplates = this.loadMailTemplates();
        
        // DOM hazır olana kadar bekle
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initialize();
            });
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadTurkishCities();
        this.updateStatistics();
        console.log('Google Maps Scraper başarıyla başlatıldı');
    }

    initializeElements() {
        this.elements = {
            keyword: document.getElementById('keyword'),
            country: document.getElementById('country'),
            city: document.getElementById('city'),
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            webmailBtn: document.getElementById('webmailBtn'),
            templateBtn: document.getElementById('templateBtn'),
            sendMailBtn: document.getElementById('sendMailBtn'),
            status: document.getElementById('status'),
            stats: document.getElementById('stats'),
            tableBody: document.getElementById('businessTableBody'),
            settingsModal: document.getElementById('settingsModal'),
            templateModal: document.getElementById('templateModal')
        };
    }

    setupEventListeners() {
        console.log('Event listener\'lar kuruluyor...');
        
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => {
                console.log('Start butonu tıklandı');
                this.startScraping();
            });
        } else {
            console.error('Start butonu bulunamadı!');
        }
        
        if (this.elements.stopBtn) {
            this.elements.stopBtn.addEventListener('click', () => this.stopScraping());
        }
        
        if (this.elements.webmailBtn) {
            this.elements.webmailBtn.addEventListener('click', () => this.openWebmailSettings());
        }
        
        if (this.elements.templateBtn) {
            this.elements.templateBtn.addEventListener('click', () => this.openMailTemplates());
        }
        
        if (this.elements.sendMailBtn) {
            this.elements.sendMailBtn.addEventListener('click', () => this.openSendMailDialog());
        }

        // Modal close events
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Webmail form submit
        document.getElementById('webmailForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveWebmailSettings();
        });
    }

    loadTurkishCities() {
        const cities = [
            "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", 
            "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", 
            "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", 
            "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", 
            "Hakkari", "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", 
            "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", 
            "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", 
            "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", 
            "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", 
            "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", 
            "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
        ].sort();

        // Güvenli şehir yükleme
        const citySelect = this.elements.city || document.getElementById('city');
        if (!citySelect) {
            console.error('Şehir select elementi bulunamadı!');
            return;
        }

        // Mevcut seçenekleri temizle (Tüm şehirler hariç)
        const options = citySelect.querySelectorAll('option');
        options.forEach((option, index) => {
            if (index > 0) { // İlk option'ı (Tüm şehirler) koru
                option.remove();
            }
        });

        // Şehirleri ekle
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });

        console.log(`${cities.length} şehir yüklendi`);
    }

    updateStatus(message) {
        if (message.startsWith('Durum:')) {
            this.elements.status.textContent = message;
        } else {
            this.elements.status.textContent = `Durum: ${message}`;
        }
    }

    updateStatistics() {
        const totalBusinesses = this.businesses.length;
        const emailCount = this.businesses.filter(b => b.email && b.email !== 'Bulunamadı').length;
        this.elements.stats.textContent = `Toplam İşletme: ${totalBusinesses} | E-mail Bulunan: ${emailCount}`;
        
        this.elements.sendMailBtn.disabled = emailCount === 0;
    }

    addBusinessToTable(business) {
        const row = document.createElement('tr');
        
        const emailClass = business.email && business.email !== 'Bulunamadı' ? 'email-found' : 'email-not-found';
        const websiteLink = business.website && business.website !== 'Bulunamadı' 
            ? `<a href="${business.website}" target="_blank" class="website-link">${business.website}</a>`
            : business.website;

        row.innerHTML = `
            <td>${business.name}</td>
            <td class="${emailClass}">${business.email}</td>
            <td>${websiteLink}</td>
            <td>${business.address}</td>
            <td>${business.phone}</td>
            <td>
                <button class="btn btn-export" onclick="app.removeBusinessFromTable(${this.businesses.length - 1})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        this.elements.tableBody.appendChild(row);
        this.updateStatistics();
    }

    async startScraping() {
        console.log('Arama başlatılıyor...');
        
        const keyword = this.elements.keyword.value.trim();
        const country = this.elements.country.value.trim();
        const city = this.elements.city.value;

        if (!keyword || !country) {
            alert('Lütfen "Aranacak Kelime" ve "Ülke" alanlarını doldurun.');
            return;
        }

        this.isScrapingActive = true;
        this.scrapingStartTime = Date.now();
        this.elements.startBtn.disabled = true;
        this.elements.stopBtn.disabled = false;
        this.elements.sendMailBtn.disabled = true;
        
        // Clear previous results
        this.businesses = [];
        this.elements.tableBody.innerHTML = '';
        this.updateStatistics();

        this.updateStatus('🔍 Gerçek veri kaynakları taranıyor...');

        // Gerçek veri çekmeye çalış
        await this.attemptRealDataScraping(keyword, country, city);
    }

    async attemptRealDataScraping(keyword, country, city) {
        try {
            this.updateStatus('🔍 Python mantığıyla geliştirilmiş veri arama başlatılıyor...');
            
            // 1. Önce Vercel API'yi dene (Python tarzı geliştirilmiş)
            const vercelData = await this.tryAdvancedVercelAPI(keyword, country, city);
            if (vercelData && vercelData.length > 0) {
                this.displayRealData(vercelData, 'Vercel Advanced API');
                this.finishScraping(vercelData.length, 'Vercel Advanced API');
                return;
            }
            
            // 2. Doğrudan OpenStreetMap API'larini dene (geliştirilmiş)
            const osmBusinesses = await this.tryOpenStreetMapAPIAdvanced(keyword, country, city);
            if (osmBusinesses && osmBusinesses.length > 0) {
                // E-mail adreslerini geliştir
                await this.enhanceBusinessesWithEmailsAdvanced(osmBusinesses);
                
                this.displayRealData(osmBusinesses, 'OpenStreetMap Advanced');
                this.finishScraping(osmBusinesses.length, 'OpenStreetMap Advanced');
                return;
            }
            
            // 3. Gelişmiş web scraping dene
            const webData = await this.tryAdvancedWebScrapingFrontend(keyword, country, city);
            if (webData && webData.length > 0) {
                await this.enhanceBusinessesWithEmailsAdvanced(webData);
                
                this.displayRealData(webData, 'Advanced Web Scraping');
                this.finishScraping(webData.length, 'Advanced Web Scraping');
                return;
            }
            
            console.log('Hiçbir kaynaktan gerçek veri bulunamadı');
            this.updateStatus('❌ Gerçek veri bulunamadı. Farklı bir anahtar kelime deneyin.');
            
            this.elements.startBtn.disabled = false;
            this.elements.stopBtn.disabled = true;
            this.isScrapingActive = false;
            
            if (this.progressInterval) {
                clearInterval(this.progressInterval);
            }
            
        } catch (error) {
            console.error('Gelişmiş veri çekme hatası:', error);
            this.updateStatus('❌ Hata oluştu. Farklı bir kelime deneyin.');
            
            this.elements.startBtn.disabled = false;
            this.elements.stopBtn.disabled = true;
            this.isScrapingActive = false;
            
            if (this.progressInterval) {
                clearInterval(this.progressInterval);
            }
        }
    }

    // Gelişmiş gerçek veri çekme - tüm kaynakları dene
    async tryAdvancedRealDataScraping(keyword, country, city) {
        const allBusinesses = [];
        const sources = [];

        try {
            this.updateStatus('🔍 Çoklu API kaynaklarından veri çekiliyor...');

            // 1. Yeni güçlü veri kaynakları
            const realData = await this.tryRealBusinessData(keyword, country, city);
            if (realData && realData.length > 0) {
                allBusinesses.push(...realData);
                sources.push('Real Business APIs');
            }

            // 2. OpenStreetMap Nominatim (geliştirilmiş)
            const osmData = await this.tryOpenStreetMapAPI(keyword, country, city);
            if (osmData && osmData.length > 0) {
                allBusinesses.push(...osmData);
                sources.push('OpenStreetMap');
            }

            // 3. Overpass API (POI)
            const poiData = await this.tryOverpassAPI(keyword, country, city);
            if (poiData && poiData.length > 0) {
                allBusinesses.push(...poiData);
                sources.push('OSM POI');
            }

            // 4. Web Scraping (geliştirilmiş)
            const webData = await this.tryWebScraping(keyword, country, city);
            if (webData && webData.length > 0) {
                allBusinesses.push(...webData);
                sources.push('Web Scraping');
            }

            // Duplicate'ları temizle
            const uniqueBusinesses = this.removeDuplicateBusinesses(allBusinesses);

            if (uniqueBusinesses.length > 0) {
                console.log(`Gerçek veri bulundu: ${uniqueBusinesses.length} işletme`);
                this.updateStatus(`✅ ${uniqueBusinesses.length} gerçek işletme bulundu! (Kaynaklar: ${sources.join(', ')})`);
                
                // E-mail adresleri için ek arama yap
                await this.enhanceBusinessesWithEmails(uniqueBusinesses);
                
                return uniqueBusinesses;
            }

            console.log('Hiç gerçek veri bulunamadı, demo verilere geçiliyor');
            return null;
        } catch (error) {
            console.error('Gelişmiş veri çekme hatası:', error);
            return null;
        }
    }

    // OpenStreetMap Nominatim API - Geliştirilmiş
    async tryOpenStreetMapAPI(keyword, country, city) {
        try {
            this.updateStatus('🔍 OpenStreetMap API kontrol ediliyor...');
            
            const location = city ? `${city}, ${country}` : country;
            const query = `${keyword} ${location}`;
            
            // Orijinal çalışan endpoint'ler (bilgisayardaki gibi)
            const endpoints = [
                // Şehir + anahtar kelime (en spesifik)
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword + ' ' + city)}&countrycodes=tr&format=json&addressdetails=1&limit=15&extratags=1`,
                // Photon API şehir odaklı
                `https://photon.komoot.io/api/?q=${encodeURIComponent(keyword + ' ' + city)}&limit=15`,
                // Nominatim genel
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=15&extratags=1`
            ];
            
            for (const url of endpoints) {
                try {
                    console.log(`OSM API deneniyor: ${url}`);
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'GoogleMapsScraperWeb/1.0 (Educational Purpose)',
                            'Accept': 'application/json'
                        },
                        timeout: 10000
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`OSM API yanıt: ${data?.length || data?.features?.length || 0} sonuç`);
                        
                        if (data && (data.length > 0 || (data.features && data.features.length > 0))) {
                            let businesses;
                            
                            if (url.includes('photon.komoot.io')) {
                                // Photon API format
                                businesses = data.features?.map(item => ({
                                    name: item.properties?.name || item.properties?.street || 'Bilinmeyen İşletme',
                                    address: this.formatPhotonAddress(item.properties),
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
                                    console.log(`${city} şehrinde ${cityFiltered.length} işletme bulundu`);
                                } else {
                                    // Şehir filtresi sonuç vermezse genel sonuçları kullan
                                    console.log(`${city} şehrinde spesifik sonuç yok, genel sonuçlar: ${validBusinesses.length}`);
                                }
                            }
                            
                            if (validBusinesses.length > 0) {
                                console.log(`OSM API başarılı: ${validBusinesses.length} işletme bulundu`);
                                return validBusinesses;
                            }
                        }
                    }
                } catch (endpointError) {
                    console.log(`Endpoint hatası (${url}):`, endpointError);
                }
            }
            
            return null;
        } catch (error) {
            console.error('OpenStreetMap API hatası:', error);
            return null;
        }
    }

    formatPhotonAddress(properties) {
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
    async tryOverpassAPI(keyword, country, city) {
        try {
            this.updateStatus('🔍 OpenStreetMap POI verileri kontrol ediliyor...');
            
            const query = `
                [out:json][timeout:25];
                (
                  node["name"~"${keyword}",i]["addr:country"~"${country}",i];
                  way["name"~"${keyword}",i]["addr:country"~"${country}",i];
                  relation["name"~"${keyword}",i]["addr:country"~"${country}",i];
                );
                out center meta;
            `;
            
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
                        address: this.formatOSMAddress(element.tags),
                        phone: element.tags?.phone || element.tags?.['contact:phone'] || 'Bulunamadı',
                        website: element.tags?.website || element.tags?.['contact:website'] || 'Bulunamadı',
                        email: element.tags?.email || element.tags?.['contact:email'] || 'Bulunamadı',
                        source: 'OpenStreetMap POI'
                    }));
                    
                    return businesses;
                }
            }
            return null;
        } catch (error) {
            console.error('Overpass API hatası:', error);
            return null;
        }
    }

    formatOSMAddress(tags) {
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

    // Gelişmiş Web Scraping + Alternatif API'ler
    async tryWebScraping(keyword, country, city) {
        try {
            this.updateStatus('🔍 Çoklu kaynaklardan veri aranıyor...');
            
            // 1. Foursquare Places API (ücretsiz tier)
            const foursquareData = await this.tryFoursquareAPI(keyword, city, country);
            if (foursquareData && foursquareData.length > 0) {
                return foursquareData;
            }

            // 2. HERE Places API (ücretsiz tier)
            const hereData = await this.tryHereAPI(keyword, city, country);
            if (hereData && hereData.length > 0) {
                return hereData;
            }

            // 3. MapBox Places API
            const mapboxData = await this.tryMapboxAPI(keyword, city, country);
            if (mapboxData && mapboxData.length > 0) {
                return mapboxData;
            }

            // 4. Web scraping (orijinal mantık - şehir odaklı)
            const searchQueries = [
                `${keyword} ${city}`, // En spesifik
                `${keyword} ${city} ${country}`, // Orta spesifik
                `${keyword} firması ${city}`, // Alternatif
            ];
            const corsProxies = [
                'https://corsproxy.io/?',
                'https://proxy.cors.sh/',
                'https://api.codetabs.com/v1/proxy?quest=',
                'https://thingproxy.freeboard.io/fetch/',
            ];
            
            for (const searchQuery of searchQueries) {
                for (const proxy of corsProxies) {
                    try {
                        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' telefon adres email')}`;
                        const proxyUrl = proxy + encodeURIComponent(searchUrl);
                    
                        const response = await fetch(proxyUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            },
                            timeout: 10000
                        });
                        
                        if (response.ok) {
                            let html;
                            if (proxy.includes('allorigins')) {
                                const json = await response.json();
                                html = json.contents;
                            } else {
                                html = await response.text();
                            }
                            
                            if (html) {
                                const businesses = this.parseGoogleSearchResults(html, city);
                                if (businesses.length > 0) {
                                    console.log(`Web scraping başarılı: ${businesses.length} işletme (${searchQuery})`);
                                    return businesses;
                                }
                            }
                        }
                    } catch (error) {
                        console.log(`Proxy ${proxy} çalışmadı:`, error);
                        continue;
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.error('Web scraping hatası:', error);
            return null;
        }
    }

    // Foursquare Places API (ücretsiz)
    async tryFoursquareAPI(keyword, city, country) {
        try {
            // Foursquare API key gerektirmeden çalışan endpoint
            const location = city ? `${city}, ${country}` : country;
            const query = encodeURIComponent(`${keyword} near ${location}`);
            
            // Public Foursquare endpoint (sınırlı)
            const url = `https://api.foursquare.com/v2/venues/search?query=${keyword}&near=${encodeURIComponent(location)}&limit=20&v=20220101`;
            
            // Bu API key gerektirir, şimdilik null döndür
            return null;
        } catch (error) {
            return null;
        }
    }

    // HERE Places API
    async tryHereAPI(keyword, city, country) {
        try {
            // HERE API key gerektirir
            return null;
        } catch (error) {
            return null;
        }
    }

    // MapBox Places API
    async tryMapboxAPI(keyword, city, country) {
        try {
            // MapBox API key gerektirir
            return null;
        } catch (error) {
            return null;
        }
    }

    parseGoogleSearchResults(html, city = null) {
        const businesses = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const results = doc.querySelectorAll('.g, .tF2Cxc, .MjjYud');
        
        results.forEach((result, index) => {
            if (index >= 15) return;
            
            const titleEl = result.querySelector('h3, .DKV0Md');
            const linkEl = result.querySelector('a');
            const snippetEl = result.querySelector('.VwiC3b, .s3v9rd, .st');
            
            if (titleEl && linkEl) {
                const business = {
                    name: titleEl.textContent.trim(),
                    website: this.cleanUrl(linkEl.href),
                    address: 'Bulunamadı',
                    phone: 'Bulunamadı',
                    email: 'Bulunamadı',
                    source: 'Google Search'
                };
                
                if (snippetEl) {
                    const snippet = snippetEl.textContent;
                    
                    // Telefon numarası ara
                    const phonePatterns = [
                        /(\+90[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/g,
                        /(0\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/g
                    ];
                    
                    for (const pattern of phonePatterns) {
                        const phoneMatch = snippet.match(pattern);
                        if (phoneMatch) {
                            business.phone = phoneMatch[0].trim();
                            break;
                        }
                    }
                    
                    // E-mail adresi ara
                    const emailMatch = snippet.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
                    if (emailMatch) {
                        business.email = emailMatch[0];
                    }
                }
                
                if (business.name.length > 3 && !business.name.includes('...')) {
                    businesses.push(business);
                }
            }
        });
        
        // Şehir filtresi uygula (esnek)
        if (city && businesses.length > 0) {
            const cityFiltered = businesses.filter(b => 
                b.name.toLowerCase().includes(city.toLowerCase()) ||
                (b.address && b.address.toLowerCase().includes(city.toLowerCase()))
            );
            
            // Eğer şehir filtresi sonuç verirse kullan, yoksa tüm sonuçları al
            if (cityFiltered.length > 0) {
                console.log(`Google sonuçlarında şehir filtresi: ${cityFiltered.length}/${businesses.length}`);
                return cityFiltered;
            } else {
                console.log(`Google sonuçlarında şehir filtresi sonuç vermedi, tüm sonuçlar: ${businesses.length}`);
            }
        }
        
        return businesses;
    }

    cleanUrl(url) {
        try {
            if (url.includes('/url?q=')) {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                return urlParams.get('q') || url;
            }
            return url;
        } catch (error) {
            return url;
        }
    }

    // Duplicate işletmeleri temizle
    removeDuplicateBusinesses(businesses) {
        const seen = new Set();
        return businesses.filter(business => {
            const key = business.name.toLowerCase().trim();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // İşletmelerin e-mail adreslerini geliştir
    async enhanceBusinessesWithEmails(businesses) {
        this.updateStatus('📧 E-mail adresleri aranıyor...');
        
        for (let i = 0; i < businesses.length; i++) {
            const business = businesses[i];
            
            if (business.email === 'Bulunamadı' && business.website !== 'Bulunamadı') {
                try {
                    const email = await this.findEmailFromWebsite(business.website);
                    if (email) {
                        business.email = email;
                    }
                } catch (error) {
                    console.error(`E-mail arama hatası (${business.website}):`, error);
                }
            }
            
            if (i % 3 === 0) {
                this.updateStatus(`📧 E-mail adresleri aranıyor... ${i + 1}/${businesses.length}`);
            }
        }
    }

    // Website'den e-mail adresi bul
    async findEmailFromWebsite(websiteUrl) {
        try {
            if (!websiteUrl || websiteUrl === 'Bulunamadı') return null;
            
            let url = websiteUrl;
            if (!url.startsWith('http')) {
                url = 'https://' + url;
            }
            
            // Çalışan CORS proxy'leri (güncel liste)
            const corsProxies = [
                'https://api.codetabs.com/v1/proxy?quest=',
                'https://api.allorigins.win/get?url=',
                // Diğer proxy'ler geçici olarak devre dışı (sertifika/erişim sorunları)
                // 'https://cors-anywhere.herokuapp.com/',
                // 'https://thingproxy.freeboard.io/fetch/',
            ];
            
            for (const proxy of corsProxies) {
                try {
                    const proxyUrl = proxy + encodeURIComponent(url);
                    const response = await fetch(proxyUrl, {
                        timeout: 8000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
                            const emailPatterns = [
                                /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
                                /mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi,
                                /"email"\s*:\s*"([^"]+@[^"]+)"/gi,
                                /'email'\s*:\s*'([^']+@[^']+)'/gi
                            ];
                            
                            for (const pattern of emailPatterns) {
                                const matches = html.match(pattern);
                                if (matches) {
                                    const validEmails = matches.filter(email => {
                                        const cleanEmail = email.replace('mailto:', '').toLowerCase();
                                        return !cleanEmail.includes('noreply') && 
                                               !cleanEmail.includes('no-reply') && 
                                               !cleanEmail.includes('example.com') &&
                                               !cleanEmail.includes('test.com') &&
                                               !cleanEmail.includes('placeholder') &&
                                               cleanEmail.includes('@') &&
                                               cleanEmail.includes('.');
                                    });
                                    
                                    if (validEmails.length > 0) {
                                        const foundEmail = validEmails[0].replace('mailto:', '');
                                        console.log(`E-mail bulundu: ${foundEmail} (${url})`);
                                        return foundEmail;
                                    }
                                }
                            }
                        }
                    }
                } catch (proxyError) {
                    console.log(`Proxy ${proxy} başarısız:`, proxyError.message);
                    continue;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Website e-mail arama hatası:', error);
            return null;
        }
    }

    // Gerçek veriyi göster
    displayRealData(businesses, source) {
        this.updateStatus(`✅ ${businesses.length} gerçek işletme bulundu! (Kaynak: ${source})`);
        
        businesses.forEach((business, index) => {
            setTimeout(() => {
                this.businesses.push(business);
                this.addBusinessToTable(business);
                this.updateStatistics();
            }, index * 300);
        });
    }

    async showDemoData(keyword, country, city) {
        const startTime = Date.now();
        this.scrapingStartTime = startTime;
        
        const demoBusinesses = [
            {
                name: `${keyword} Demo İşletmesi 1`,
                email: 'info@demo1.com',
                website: 'https://demo1.com',
                address: `${city || 'İstanbul'}, ${country}`,
                phone: '+90 212 555 0101'
            },
            {
                name: `${keyword} Demo İşletmesi 2`,
                email: 'contact@demo2.com',
                website: 'https://demo2.com',
                address: `${city || 'Ankara'}, ${country}`,
                phone: '+90 312 555 0202'
            },
            {
                name: `${keyword} Demo İşletmesi 3`,
                email: 'hello@demo3.com',
                website: 'https://demo3.com',
                address: `${city || 'İzmir'}, ${country}`,
                phone: '+90 232 555 0303'
            },
            {
                name: `${keyword} Demo İşletmesi 4`,
                email: 'Bulunamadı',
                website: 'https://demo4.com',
                address: `${city || 'Bursa'}, ${country}`,
                phone: '+90 224 555 0404'
            },
            {
                name: `${keyword} Demo İşletmesi 5`,
                email: 'support@demo5.com',
                website: 'Bulunamadı',
                address: `${city || 'Antalya'}, ${country}`,
                phone: 'Bulunamadı'
            }
        ];

        this.progressInterval = setInterval(() => {
            if (!this.isScrapingActive) {
                clearInterval(this.progressInterval);
                return;
            }
            
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            let currentStatus = this.elements.status.textContent;
            if (currentStatus.startsWith('Durum: ')) {
                currentStatus = currentStatus.substring(7);
            }
            currentStatus = currentStatus.split(' | ⏱️')[0];
            
            this.updateStatus(`${currentStatus} | ⏱️ ${timeStr}`);
        }, 1000);

        for (let i = 0; i < demoBusinesses.length; i++) {
            if (!this.isScrapingActive) break;
            
            this.updateStatus(`📊 İşletme ${i + 1}/${demoBusinesses.length} işleniyor... | ⏱️ Demo veri`);
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.businesses.push(demoBusinesses[i]);
            this.addBusinessToTable(demoBusinesses[i]);
            this.updateStatistics();
        }

        if (this.isScrapingActive) {
            this.scrapingEndTime = Date.now();
            const totalTime = Math.floor((this.scrapingEndTime - this.scrapingStartTime) / 1000);
            const minutes = Math.floor(totalTime / 60);
            const seconds = totalTime % 60;
            
            this.updateStatus(`✅ Demo tamamlandı! Süre: ${minutes}:${seconds.toString().padStart(2, '0')} | 💡 Gerçek veri için API'ler kullanılıyor`);
            
            clearInterval(this.progressInterval);
            this.elements.startBtn.disabled = false;
            this.elements.stopBtn.disabled = true;
            this.elements.sendMailBtn.disabled = false;
            this.isScrapingActive = false;
        }
    }

    stopScraping() {
        this.isScrapingActive = false;
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        
        this.updateStatus('Durduruldu');
    }

    // Diğer fonksiyonlar (webmail, export, vb.)
    loadWebmailSettings() {
        const saved = localStorage.getItem('webmailSettings');
        return saved ? JSON.parse(saved) : {};
    }

    loadMailTemplates() {
        const saved = localStorage.getItem('mailTemplates');
        return saved ? JSON.parse(saved) : {};
    }

    openWebmailSettings() {
        this.elements.settingsModal.style.display = 'block';
    }

    openMailTemplates() {
        this.elements.templateModal.style.display = 'block';
    }

    saveWebmailSettings() {
        // Webmail ayarlarını kaydet
        this.elements.settingsModal.style.display = 'none';
    }

    openSendMailDialog() {
        alert('Mail gönderme özelliği geliştirme aşamasında!');
    }

    // OpenStreetMap API'larını doğrudan çağır
    async tryOpenStreetMapAPI(keyword, country, city) {
        try {
            this.updateStatus('🔍 OpenStreetMap API\'lerden veri çekiliyor...');
            
            const endpoints = [
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword + ' ' + city)}&countrycodes=tr&format=json&addressdetails=1&limit=15&extratags=1`,
                `https://photon.komoot.io/api/?q=${encodeURIComponent(keyword + ' ' + city + ' türkiye')}&limit=15`,
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword)}&city=${encodeURIComponent(city || '')}&countrycodes=tr&format=json&addressdetails=1&limit=15&extratags=1`
            ];
            
            for (const url of endpoints) {
                try {
                    console.log(`OSM API deneniyor: ${url.includes('photon') ? 'Photon' : 'Nominatim'}`);
                    
                    const response = await fetch(url, {
                        headers: {
                            'User-Agent': 'GoogleMapsScraperWeb/1.0 (Educational Purpose)',
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`OSM API yanıt: ${data?.length || data?.features?.length || 0} sonuç`);
                        
                        if (data && (data.length > 0 || (data.features && data.features.length > 0))) {
                            let businesses;
                            
                            if (url.includes('photon.komoot.io')) {
                                businesses = data.features?.map(item => ({
                                    name: item.properties?.name || 'Bilinmeyen İşletme',
                                    address: this.formatPhotonAddress(item.properties),
                                    phone: item.properties?.phone || 'Bulunamadı',
                                    website: item.properties?.website || 'Bulunamadı',
                                    email: 'Bulunamadı',
                                    source: 'Photon API'
                                })) || [];
                            } else {
                                businesses = data.map(item => ({
                                    name: item.name || item.display_name?.split(',')[0] || 'Bilinmeyen İşletme',
                                    address: item.display_name || 'Adres bulunamadı',
                                    phone: item.extratags?.phone || item.extratags?.['contact:phone'] || 'Bulunamadı',
                                    website: item.extratags?.website || item.extratags?.['contact:website'] || 'Bulunamadı',
                                    email: 'Bulunamadı',
                                    source: 'OpenStreetMap'
                                }));
                            }
                            
                            const validBusinesses = businesses.filter(b => 
                                b.name !== 'Bilinmeyen İşletme' && 
                                b.name.length > 2 &&
                                !b.name.includes('undefined')
                            );
                            
                            if (validBusinesses.length > 0) {
                                console.log(`OSM API başarılı: ${validBusinesses.length} işletme bulundu`);
                                return validBusinesses;
                            }
                        }
                    }
                } catch (endpointError) {
                    console.log(`Endpoint hatası: ${endpointError.message}`);
                }
            }
            
            return null;
        } catch (error) {
            console.error('OpenStreetMap API hatası:', error);
            return null;
        }
    }

    // Vercel API ile gerçek veri çekme - Geliştirilmiş
    async tryAdvancedVercelAPI(keyword, country, city) {
        try {
            // GitHub Pages kontrolü - statik hosting'de serverless function çalışmaz
            if (window.location.hostname.includes('github.io')) {
                console.log('GitHub Pages tespit edildi, doğrudan API\'lere geçiliyor...');
                this.updateStatus('🔍 GitHub Pages - Doğrudan API\'lerden veri çekiliyor...');
                return null; // Diğer API'lere geç
            }
            
            this.updateStatus('🔍 Vercel Advanced API\'den gerçek veri çekiliyor...');
            
            // Vercel serverless function'ı çağır (geliştirilmiş)
            const apiUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:3000/api/search'  // Local development
                : '/api/search';  // Production (Vercel)
            
            const params = new URLSearchParams({
                keyword: keyword,
                country: country,
                city: city || ''
            });
            
            console.log(`Vercel Advanced API çağrısı: ${apiUrl}?${params.toString()}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 saniye timeout
            
            const response = await fetch(`${apiUrl}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const result = await response.json();
                console.log('Vercel Advanced API yanıtı:', result);
                
                if (result.success && result.data && result.data.length > 0) {
                    console.log(`Vercel Advanced API başarılı: ${result.data.length} işletme bulundu`);
                    return result.data;
                } else {
                    console.log('Vercel Advanced API boş sonuç döndü');
                    return null;
                }
            } else {
                console.error('Vercel Advanced API hatası:', response.status, response.statusText);
                return null;
            }
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Vercel Advanced API timeout');
            } else {
                console.error('Vercel Advanced API çağrı hatası:', error);
            }
            return null;
        }
    }

    // Python'daki gibi gelişmiş OpenStreetMap API
    async tryOpenStreetMapAPIAdvanced(keyword, country, city) {
        try {
            this.updateStatus('🔍 OpenStreetMap Advanced API kontrol ediliyor...');
            
            const location = city ? `${city}, ${country}` : country;
            
            // Python'daki gibi çoklu endpoint stratejisi
            const endpoints = [
                // Şehir + anahtar kelime (en spesifik) - Python'daki gibi
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword + ' ' + city)}&countrycodes=tr&format=json&addressdetails=1&limit=20&extratags=1&dedupe=1`,
                // Photon API şehir odaklı - geliştirilmiş
                `https://photon.komoot.io/api/?q=${encodeURIComponent(keyword + ' ' + city + ' türkiye')}&limit=20&lang=tr`,
                // Nominatim genel - geliştirilmiş filtreler
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(keyword + ' ' + location)}&format=json&addressdetails=1&limit=20&extratags=1&dedupe=1`,
            ];
            
            for (const url of endpoints) {
                try {
                    console.log(`OSM Advanced API deneniyor: ${url.includes('photon') ? 'Photon' : 'Nominatim'}`);
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
                        console.log(`OSM Advanced API yanıt: ${data?.length || data?.features?.length || 0} sonuç`);
                        
                        if (data && (data.length > 0 || (data.features && data.features.length > 0))) {
                            let businesses;
                            
                            if (url.includes('photon.komoot.io')) {
                                // Photon API format - geliştirilmiş
                                businesses = data.features?.map(item => ({
                                    name: item.properties?.name || item.properties?.street || 'Bilinmeyen İşletme',
                                    address: this.formatPhotonAddressAdvanced(item.properties),
                                    phone: item.properties?.phone || item.properties?.['contact:phone'] || 'Bulunamadı',
                                    website: item.properties?.website || item.properties?.['contact:website'] || 'Bulunamadı',
                                    email: item.properties?.email || item.properties?.['contact:email'] || 'Bulunamadı',
                                    source: 'Photon API Advanced',
                                    city: item.properties?.city || item.properties?.state || ''
                                })) || [];
                            } else {
                                // Nominatim format - Python tarzı parsing
                                businesses = data.map(item => ({
                                    name: this.extractBusinessNameAdvanced(item),
                                    address: item.display_name || 'Adres bulunamadı',
                                    phone: this.extractContactInfo(item, 'phone') || 'Bulunamadı',
                                    website: this.extractContactInfo(item, 'website') || 'Bulunamadı',
                                    email: this.extractContactInfo(item, 'email') || 'Bulunamadı',
                                    source: 'OpenStreetMap Advanced'
                                }));
                            }
                            
                            // Python'daki gibi gelişmiş filtreleme
                            let validBusinesses = this.filterValidBusinessesAdvanced(businesses, keyword);
                            
                            // Şehir filtresi uygula (Python mantığı)
                            if (city && validBusinesses.length > 0) {
                                const cityFiltered = this.applyCityFilterAdvanced(validBusinesses, city);
                                
                                if (cityFiltered.length > 0) {
                                    validBusinesses = cityFiltered;
                                    console.log(`${city} şehrinde ${cityFiltered.length} işletme bulundu`);
                                } else {
                                    console.log(`${city} şehrinde spesifik sonuç yok, genel sonuçlar: ${validBusinesses.length}`);
                                }
                            }
                            
                            if (validBusinesses.length > 0) {
                                console.log(`OSM Advanced API başarılı: ${validBusinesses.length} işletme bulundu`);
                                return validBusinesses;
                            }
                        }
                    }
                } catch (endpointError) {
                    console.log(`Endpoint hatası: ${endpointError.message}`);
                }
            }
            
            return null;
        } catch (error) {
            console.error('OpenStreetMap Advanced API hatası:', error);
            return null;
        }
    }

    // Scraping'i bitir - helper function
    finishScraping(count, source) {
        this.scrapingEndTime = Date.now();
        const totalTime = Math.floor((this.scrapingEndTime - this.scrapingStartTime) / 1000);
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        
        this.updateStatus(`✅ ${count} gerçek işletme bulundu! (${source}) Süre: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.elements.sendMailBtn.disabled = false;
        this.isScrapingActive = false;
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    }

    // Python'daki gibi gelişmiş e-mail bulma
    async enhanceBusinessesWithEmailsAdvanced(businesses) {
        this.updateStatus(`📧 ${businesses.length} işletme için e-mail adresleri aranyor...`);
        
        for (let i = 0; i < businesses.length; i++) {
            const business = businesses[i];
            
            if (business.email === 'Bulunamadı' && business.website !== 'Bulunamadı') {
                try {
                    const email = await this.findEmailFromWebsiteAdvanced(business.website);
                    if (email) {
                        business.email = email;
                        console.log(`E-mail bulundu: ${email} (${business.name})`);
                    }
                } catch (error) {
                    console.error(`E-mail arama hatası (${business.website}):`, error);
                }
            }
            
            if (i % 3 === 0) {
                this.updateStatus(`📧 E-mail adresleri aranyor... ${i + 1}/${businesses.length}`);
            }
        }
    }

    // Python'daki gibi gelişmiş web scraping - frontend
    async tryAdvancedWebScrapingFrontend(keyword, city, country) {
        try {
            this.updateStatus('🔍 Python tarzı gelişmiş web scraping deneniyor...');
            
            // Python'daki gibi çoklu arama sorguları
            const searchQueries = [
                `${keyword} ${city} telefon email adres`,
                `${keyword} firması ${city}`,
                `${keyword} ${city} ${country} iletişim`,
                `"${keyword}" ${city} site:*.com`
            ];
            
            // Güvenilir CORS proxy'leri
            const corsProxies = [
                'https://api.allorigins.win/get?url=',
                'https://api.codetabs.com/v1/proxy?quest='
            ];
            
            for (const searchQuery of searchQueries) {
                for (const proxy of corsProxies) {
                    try {
                        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&gl=tr&hl=tr&num=20`;
                        const proxyUrl = proxy + encodeURIComponent(searchUrl);
                        
                        console.log(`Web scraping: ${searchQuery.substring(0, 30)}...`);
                        
                        const response = await fetch(proxyUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            },
                            signal: AbortSignal.timeout(10000)
                        });
                        
                        if (response.ok) {
                            const html = await response.text();
                            
                            if (html && html.length > 1000) {
                                const businesses = this.parseGoogleSearchResultsAdvanced(html, keyword, city);
                                if (businesses.length > 0) {
                                    console.log(`Web scraping başarılı: ${businesses.length} işletme (${searchQuery.substring(0, 20)}...)`);
                                    return businesses;
                                }
                            }
                        }
                    } catch (error) {
                        console.log(`Proxy ${proxy.substring(0, 20)}... hatası: ${error.message}`);
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

    // Python'daki gibi helper function'lar
    formatPhotonAddressAdvanced(properties) {
        if (!properties) return 'Adres bulunamadı';
        
        const parts = [];
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

    extractBusinessNameAdvanced(item) {
        if (item.name && item.name.length > 2) {
            return item.name;
        }
        
        if (item.display_name) {
            const parts = item.display_name.split(',');
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

    extractContactInfo(item, type) {
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

    filterValidBusinessesAdvanced(businesses, keyword) {
        return businesses.filter(b => {
            const name = b.name || '';
            const isValidName = name !== 'Bilinmeyen İşletme' && 
                               name.length > 2 &&
                               !name.includes('undefined') &&
                               !name.includes('null') &&
                               name.trim() !== '';
            
            const keywordRelevant = !keyword || 
                                   name.toLowerCase().includes(keyword.toLowerCase()) ||
                                   keyword.toLowerCase().includes(name.toLowerCase().split(' ')[0]);
            
            return isValidName && keywordRelevant;
        });
    }

    applyCityFilterAdvanced(businesses, city) {
        return businesses.filter(b => {
            const address = (b.address || '').toLowerCase();
            const name = (b.name || '').toLowerCase();
            const cityLower = city.toLowerCase();
            
            return address.includes(cityLower) || 
                   name.includes(cityLower) ||
                   (b.city && b.city.toLowerCase().includes(cityLower));
        });
    }

    // Python'daki gibi gelişmiş e-mail bulma
    async findEmailFromWebsiteAdvanced(websiteUrl) {
        try {
            if (!websiteUrl || websiteUrl === 'Bulunamadı') return null;
            
            let url = websiteUrl;
            if (!url.startsWith('http')) {
                url = 'https://' + url;
            }
            
            const corsProxies = [
                'https://api.codetabs.com/v1/proxy?quest=',
                'https://corsproxy.io/?'
            ];
            
            for (const proxy of corsProxies) {
                try {
                    const proxyUrl = proxy + encodeURIComponent(url);
                    const response = await fetch(proxyUrl, {
                        signal: AbortSignal.timeout(8000),
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    
                    if (response.ok) {
                        const html = await response.text();
                        
                        if (html) {
                            const email = this.extractBestEmailAdvanced(html, url);
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

    extractBestEmailAdvanced(content, domainUrl) {
        try {
            const emailPatterns = [
                /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
                /mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi,
                /"email"\s*:\s*"([^"]+@[^"]+)"/gi,
                /'email'\s*:\s*'([^']+@[^']+)'/gi
            ];
            
            const allEmails = [];
            
            for (const pattern of emailPatterns) {
                const matches = content.match(pattern);
                if (matches) {
                    allEmails.push(...matches.map(email => 
                        email.replace(/^(mailto:|"email"\s*:\s*"|'email'\s*:\s*')/i, '')
                             .replace(/["'\]\)\}>]$/, '')
                             .trim()
                    ));
                }
            }
            
            if (allEmails.length === 0) return null;
            
            const uniqueEmails = [...new Set(allEmails)];
            
            const spamKeywords = [
                'noreply', 'no-reply', 'donotreply', 'example.com', 'test.com',
                'dummy', 'fake', 'sample', 'placeholder', 'your-email'
            ];
            
            const validEmails = uniqueEmails.filter(email => {
                const emailLower = email.toLowerCase();
                return emailLower.length > 5 && 
                       email.includes('@') && 
                       email.includes('.') &&
                       !spamKeywords.some(spam => emailLower.includes(spam));
            });
            
            if (validEmails.length === 0) return null;
            
            return validEmails[0];
            
        } catch (error) {
            console.error('E-mail çıkarma hatası:', error);
            return null;
        }
    }

    parseGoogleSearchResultsAdvanced(html, keyword, city) {
        const businesses = [];
        
        try {
            const resultPatterns = [
                /<h3[^>]*>([^<]+)<\/h3>/g,
                /<div[^>]*class="[^"]*BNeawe[^"]*"[^>]*>([^<]+)<\/div>/g
            ];
            
            const phonePatterns = [
                /(\+90[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/g,
                /(0\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/g
            ];
            
            const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
            
            const names = [];
            for (const pattern of resultPatterns) {
                let match;
                while ((match = pattern.exec(html)) !== null && names.length < 10) {
                    const name = match[1].trim();
                    if (name.length > 3 && !name.includes('...') && !name.toLowerCase().includes('google')) {
                        names.push(name);
                    }
                }
            }
            
            const phones = [];
            const emails = [];
            
            for (const pattern of phonePatterns) {
                const phoneMatches = html.match(pattern) || [];
                phones.push(...phoneMatches.slice(0, names.length));
            }
            
            const emailMatches = html.match(emailPattern) || [];
            emails.push(...emailMatches.slice(0, names.length));
            
            for (let i = 0; i < Math.min(names.length, 8); i++) {
                const business = {
                    name: names[i],
                    website: 'Bulunamadı',
                    address: city ? `${city}, Türkiye` : 'Türkiye',
                    phone: phones[i] || 'Bulunamadı',
                    email: emails[i] || 'Bulunamadı',
                    source: 'Google Search Advanced'
                };
                
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

    // Geonames API
    async tryGeonamesAPI(keyword, city, country) {
        // Geonames API CORS ve HTTPS sorunları nedeniyle devre dışı
        console.log('Geonames API geçici olarak devre dışı (CORS/HTTPS sorunları)');
        return null;
    }

    // Wikipedia Business API
    async tryWikipediaBusinessAPI(keyword, city, country) {
        try {
            const queries = [
                `${keyword} ${city}`,
                `${keyword} ${country}`,
                `${city} ${keyword}`
            ];

            for (const query of queries) {
                try {
                    const url = `https://tr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
                    const response = await fetch(url);
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.extract && !data.extract.includes('may refer to')) {
                            return [{
                                name: data.title || query,
                                address: `${city || ''}, ${country}`.trim(),
                                phone: 'Bulunamadı',
                                website: data.content_urls?.desktop?.page || 'Bulunamadı',
                                email: 'Bulunamadı',
                                source: 'Wikipedia'
                            }];
                        }
                    }
                } catch (error) {
                    console.log(`Wikipedia query failed: ${query}`);
                }
            }
            
            return null;
        } catch (error) {
            console.error('Wikipedia API hatası:', error);
            return null;
        }
    }
}

// Export fonksiyonları
function exportData(format, emailOnly = false) {
    if (!window.app || !window.app.businesses.length) {
        alert('Önce veri toplamanız gerekiyor!');
        return;
    }

    const data = emailOnly 
        ? window.app.businesses.filter(b => b.email && b.email !== 'Bulunamadı')
        : window.app.businesses;

    if (data.length === 0) {
        alert(emailOnly ? 'E-mail adresi bulunan işletme yok!' : 'Hiç veri bulunamadı!');
        return;
    }

    switch (format) {
        case 'excel':
            exportToExcel(data, emailOnly);
            break;
        case 'csv':
            exportToCSV(data, emailOnly);
            break;
        case 'pdf':
            exportToPDF(data, emailOnly);
            break;
        case 'word':
            exportToWord(data, emailOnly);
            break;
    }
}

function exportToCSV(data, emailOnly) {
    const headers = ['İşletme Adı', 'E-Mail Adresi', 'Web Sitesi', 'Adres', 'Telefon Numarası'];
    const csvContent = [
        headers.join(','),
        ...data.map(row => [
            `"${row.name}"`,
            `"${row.email}"`,
            `"${row.website}"`,
            `"${row.address}"`,
            `"${row.phone}"`
        ].join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google_maps_data_${emailOnly ? 'emails_' : ''}${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportToExcel(data, emailOnly) {
    const ws = XLSX.utils.json_to_sheet(data.map(item => ({
        'İşletme Adı': item.name,
        'E-Mail Adresi': item.email,
        'Web Sitesi': item.website,
        'Adres': item.address,
        'Telefon Numarası': item.phone
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'İşletmeler');
    XLSX.writeFile(wb, `google_maps_data_${emailOnly ? 'emails_' : ''}${new Date().toISOString().slice(0,10)}.xlsx`);
}

function exportToPDF(data, emailOnly) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text('Google Maps İşletme Verileri', 20, 20);
    
    const tableData = data.map(item => [
        item.name,
        item.email,
        item.website,
        item.address,
        item.phone
    ]);
    
    doc.autoTable({
        head: [['İşletme Adı', 'E-Mail', 'Website', 'Adres', 'Telefon']],
        body: tableData,
        startY: 30,
        styles: { fontSize: 8 }
    });
    
    doc.save(`google_maps_data_${emailOnly ? 'emails_' : ''}${new Date().toISOString().slice(0,10)}.pdf`);
}

function exportToWord(data, emailOnly) {
    let content = `
        <html>
        <head><meta charset="utf-8"><title>Google Maps İşletme Verileri</title></head>
        <body>
        <h1>Google Maps İşletme Verileri</h1>
        <table border="1" style="border-collapse: collapse; width: 100%;">
        <tr>
            <th>İşletme Adı</th>
            <th>E-Mail Adresi</th>
            <th>Web Sitesi</th>
            <th>Adres</th>
            <th>Telefon Numarası</th>
        </tr>
    `;
    
    data.forEach(item => {
        content += `
        <tr>
            <td>${item.name}</td>
            <td>${item.email}</td>
            <td>${item.website}</td>
            <td>${item.address}</td>
            <td>${item.phone}</td>
        </tr>
        `;
    });
    
    content += '</table></body></html>';
    
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google_maps_data_${emailOnly ? 'emails_' : ''}${new Date().toISOString().slice(0,10)}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// App'i başlat - Güvenli başlatma
function initializeApp() {
    try {
        console.log('DOM yüklendi, app başlatılıyor...');
        window.app = new GoogleMapsScraperWeb();
        console.log('App global olarak erişilebilir: window.app');
    } catch (error) {
        console.error('App başlatma hatası:', error);
        // 1 saniye sonra tekrar dene
        setTimeout(initializeApp, 1000);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}