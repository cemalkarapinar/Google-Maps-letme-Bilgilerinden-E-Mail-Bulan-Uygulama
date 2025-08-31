class GoogleMapsScraperWeb {
    constructor() {
        this.businesses = [];
        this.isScrapingActive = false;
        this.progressInterval = null;
        this.scrapingStartTime = null;
        this.scrapingEndTime = null;
        this.webmailSettings = this.loadWebmailSettings();
        this.mailTemplates = this.loadMailTemplates();
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadTurkishCities();
        this.updateStatistics();
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

        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            this.elements.city.appendChild(option);
        });
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
            const realBusinesses = await this.tryAdvancedRealDataScraping(keyword, country, city);
            if (realBusinesses && realBusinesses.length > 0) {
                this.displayRealData(realBusinesses, 'Çoklu Kaynak');
                
                this.scrapingEndTime = Date.now();
                const totalTime = Math.floor((this.scrapingEndTime - this.scrapingStartTime) / 1000);
                const minutes = Math.floor(totalTime / 60);
                const seconds = totalTime % 60;
                
                this.updateStatus(`✅ ${realBusinesses.length} gerçek işletme bulundu! Süre: ${minutes}:${seconds.toString().padStart(2, '0')}`);
                
                this.elements.startBtn.disabled = false;
                this.elements.stopBtn.disabled = true;
                this.elements.sendMailBtn.disabled = false;
                this.isScrapingActive = false;
                
                if (this.progressInterval) {
                    clearInterval(this.progressInterval);
                }
                
                return;
            }
            
            console.log('Gerçek veri çekilemedi, demo veri gösteriliyor...');
            this.updateStatus('⚠️ Gerçek veri çekilemedi. Demo veriler gösteriliyor...');
            
            await this.showDemoData(keyword, country, city);
        } catch (error) {
            console.error('Veri çekme hatası:', error);
            this.updateStatus('❌ Hata oluştu, demo veriler gösteriliyor...');
            await this.showDemoData(keyword, country, city);
        }
    }

    // Gelişmiş gerçek veri çekme - tüm kaynakları dene
    async tryAdvancedRealDataScraping(keyword, country, city) {
        const allBusinesses = [];
        const sources = [];

        try {
            // 1. OpenStreetMap Nominatim
            const osmData = await this.tryOpenStreetMapAPI(keyword, country, city);
            if (osmData && osmData.length > 0) {
                allBusinesses.push(...osmData);
                sources.push('OpenStreetMap');
            }

            // 2. Overpass API (POI)
            const poiData = await this.tryOverpassAPI(keyword, country, city);
            if (poiData && poiData.length > 0) {
                allBusinesses.push(...poiData);
                sources.push('OSM POI');
            }

            // 3. Web Scraping
            const webData = await this.tryWebScraping(keyword, country, city);
            if (webData && webData.length > 0) {
                allBusinesses.push(...webData);
                sources.push('Web Scraping');
            }

            // Duplicate'ları temizle
            const uniqueBusinesses = this.removeDuplicateBusinesses(allBusinesses);

            if (uniqueBusinesses.length > 0) {
                this.updateStatus(`✅ ${uniqueBusinesses.length} gerçek işletme bulundu! (Kaynaklar: ${sources.join(', ')})`);
                
                // E-mail adresleri için ek arama yap
                await this.enhanceBusinessesWithEmails(uniqueBusinesses);
                
                return uniqueBusinesses;
            }

            return null;
        } catch (error) {
            console.error('Gelişmiş veri çekme hatası:', error);
            return null;
        }
    }

    // OpenStreetMap Nominatim API
    async tryOpenStreetMapAPI(keyword, country, city) {
        try {
            this.updateStatus('🔍 OpenStreetMap API kontrol ediliyor...');
            
            const location = city ? `${city}, ${country}` : country;
            const query = `${keyword} ${location}`;
            const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=20`;
            
            const response = await fetch(nominatimUrl, {
                headers: {
                    'User-Agent': 'GoogleMapsScraperWeb/1.0'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const businesses = data.map(item => ({
                        name: item.display_name.split(',')[0] || 'Bilinmeyen İşletme',
                        address: item.display_name || 'Adres bulunamadı',
                        phone: 'Bulunamadı',
                        website: 'Bulunamadı',
                        email: 'Bulunamadı',
                        source: 'OpenStreetMap'
                    }));
                    
                    return businesses;
                }
            }
            
            return null;
        } catch (error) {
            console.error('OpenStreetMap API hatası:', error);
            return null;
        }
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

    // Web scraping yaklaşımı
    async tryWebScraping(keyword, country, city) {
        try {
            this.updateStatus('🔍 Web scraping ile veri aranıyor...');
            
            const query = `${keyword} ${city} ${country}`.trim();
            const corsProxies = [
                'https://api.allorigins.win/get?url=',
                'https://api.codetabs.com/v1/proxy?quest='
            ];
            
            for (const proxy of corsProxies) {
                try {
                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query + ' telefon adres')}`;
                    const proxyUrl = proxy + encodeURIComponent(searchUrl);
                    
                    const response = await fetch(proxyUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    
                    if (response.ok) {
                        let html;
                        if (proxy.includes('allorigins')) {
                            const json = await response.json();
                            html = json.contents;
                        } else {
                            html = await response.text();
                        }
                        
                        const businesses = this.parseGoogleSearchResults(html);
                        if (businesses.length > 0) {
                            return businesses;
                        }
                    }
                } catch (error) {
                    console.log(`Proxy ${proxy} çalışmadı:`, error);
                }
            }
            
            return null;
        } catch (error) {
            console.error('Web scraping hatası:', error);
            return null;
        }
    }

    parseGoogleSearchResults(html) {
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
            
            const corsProxy = 'https://api.allorigins.win/get?url=';
            const response = await fetch(corsProxy + encodeURIComponent(url), {
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                const html = data.contents;
                
                const emailPatterns = [
                    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
                    /mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi
                ];
                
                for (const pattern of emailPatterns) {
                    const matches = html.match(pattern);
                    if (matches) {
                        const validEmails = matches.filter(email => {
                            const cleanEmail = email.replace('mailto:', '').toLowerCase();
                            return !cleanEmail.includes('noreply') && 
                                   !cleanEmail.includes('no-reply') && 
                                   !cleanEmail.includes('example.com') &&
                                   !cleanEmail.includes('test.com');
                        });
                        
                        if (validEmails.length > 0) {
                            return validEmails[0].replace('mailto:', '');
                        }
                    }
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

// App'i başlat
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM yüklendi, app başlatılıyor...');
    window.app = new GoogleMapsScraperWeb();
    console.log('App global olarak erişilebilir: window.app');
});