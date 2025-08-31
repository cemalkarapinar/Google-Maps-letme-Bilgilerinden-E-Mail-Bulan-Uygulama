// Backend örneği - Node.js + Express + Puppeteer
// Bu dosya gerçek scraping için backend implementasyonu örneğidir

const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Frontend dosyaları için - root dizinden serve et

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 10, // Her IP için maksimum 10 istek
    message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.'
});

app.use('/api/', limiter);

class GoogleMapsScraper {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        this.page = await this.browser.newPage();
        
        // User agent ayarla
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // Viewport ayarla
        await this.page.setViewport({ width: 1366, height: 768 });
    }

    async searchBusinesses(keyword, country, city = '') {
        try {
            const query = `${keyword} ${city} ${country}`.trim().replace(/\s+/g, ' ');
            console.log(`Aranıyor: ${query}`);

            // Google Maps'e git
            await this.page.goto('https://www.google.com/maps', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Arama kutusunu bul ve aramayı yap
            await this.page.waitForSelector('input[name="q"]', { timeout: 10000 });
            await this.page.type('input[name="q"]', query);
            await this.page.keyboard.press('Enter');

            // Sonuçların yüklenmesini bekle
            await this.page.waitForSelector('div[role="feed"]', { timeout: 20000 });

            const businesses = await this.scrapeBusinessList();
            return businesses;

        } catch (error) {
            console.error('Arama hatası:', error);
            throw error;
        }
    }

    // Streaming versiyonu
    async searchBusinessesStream(keyword, country, city = '', onBusinessFound, onStatusUpdate, onProgressUpdate) {
        const startTime = Date.now();
        
        try {
            const query = `${keyword} ${city} ${country}`.trim().replace(/\s+/g, ' ');
            console.log(`Streaming arama: ${query}`);
            onStatusUpdate(`Aranıyor: ${query}`);

            // Google Maps'e git
            await this.page.goto('https://www.google.com/maps', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            const elapsed1 = Date.now() - startTime;
            onProgressUpdate('Google Maps yüklendi', 50000 - elapsed1); // 50s tahmini kalan

            // Arama kutusunu bul ve aramayı yap
            await this.page.waitForSelector('input[name="q"]', { timeout: 10000 });
            await this.page.type('input[name="q"]', query);
            await this.page.keyboard.press('Enter');

            const elapsed2 = Date.now() - startTime;
            onProgressUpdate('Arama yapıldı, sonuçlar yükleniyor...', 45000 - elapsed2);

            // Sonuçların yüklenmesini bekle
            await this.page.waitForSelector('div[role="feed"]', { timeout: 20000 });

            const elapsed3 = Date.now() - startTime;
            onProgressUpdate('Sonuçlar bulundu, işletmeler işleniyor...', 40000 - elapsed3);

            await this.scrapeBusinessListStream(onBusinessFound, onStatusUpdate, onProgressUpdate, startTime);

        } catch (error) {
            console.error('Streaming arama hatası:', error);
            onStatusUpdate(`Hata: ${error.message}`);
            throw error;
        }
    }

    async scrapeBusinessList() {
        const businesses = [];
        const processedUrls = new Set();

        try {
            // Sonuçları scroll ederek daha fazla işletme yükle
            await this.scrollResults();

            // İşletme linklerini topla
            const businessLinks = await this.page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
                return links.map(link => link.href).filter(href => href.includes('/maps/place/'));
            });

            console.log(`${businessLinks.length} işletme linki bulundu`);

            // Her işletme için detay bilgilerini al
            for (const link of businessLinks.slice(0, 20)) { // İlk 20 işletme
                if (processedUrls.has(link)) continue;
                processedUrls.add(link);

                try {
                    const businessData = await this.scrapeBusinessDetails(link);
                    if (businessData) {
                        businesses.push(businessData);
                        console.log(`İşletme eklendi: ${businessData.name}`);
                    }
                } catch (error) {
                    console.error(`İşletme detayı alınamadı (${link}):`, error.message);
                }
            }

        } catch (error) {
            console.error('İşletme listesi scraping hatası:', error);
        }

        return businesses;
    }

    // Streaming versiyonu
    async scrapeBusinessListStream(onBusinessFound, onStatusUpdate, onProgressUpdate, startTime) {
        const processedUrls = new Set();

        try {
            // Sonuçları scroll ederek daha fazla işletme yükle
            onProgressUpdate('Sayfa scroll ediliyor...', 35000);
            await this.scrollResults();

            // İşletme linklerini topla
            const businessLinks = await this.page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
                return links.map(link => link.href).filter(href => href.includes('/maps/place/'));
            });

            console.log(`${businessLinks.length} işletme linki bulundu`);
            const totalLinks = Math.min(businessLinks.length, 20);
            onProgressUpdate(`${businessLinks.length} işletme linki bulundu`, 30000);

            // Her işletme için detay bilgilerini al ve anlık gönder
            for (let i = 0; i < totalLinks; i++) {
                const link = businessLinks[i];
                
                if (processedUrls.has(link)) continue;
                processedUrls.add(link);

                try {
                    // Kalan süreyi hesapla
                    const elapsed = Date.now() - startTime;
                    const avgTimePerBusiness = elapsed / (i + 1);
                    const remainingBusinesses = totalLinks - (i + 1);
                    const estimatedRemaining = remainingBusinesses * avgTimePerBusiness;
                    
                    onProgressUpdate(`İşletme ${i + 1}/${totalLinks} işleniyor... Lütfen bekleyin, kapatmayın!`, estimatedRemaining);
                    
                    const businessData = await this.scrapeBusinessDetails(link);
                    if (businessData) {
                        console.log(`İşletme eklendi: ${businessData.name}`);
                        
                        // Anlık olarak frontend'e gönder
                        onBusinessFound(businessData);
                    }
                } catch (error) {
                    console.error(`İşletme detayı alınamadı (${link}):`, error.message);
                    onStatusUpdate(`Hata: ${error.message}`);
                }
            }

        } catch (error) {
            console.error('Streaming işletme listesi hatası:', error);
            onStatusUpdate(`Hata: ${error.message}`);
        }
    }

    async scrollResults() {
        try {
            const scrollableDiv = await this.page.$('div[role="feed"]');
            if (!scrollableDiv) return;

            let previousHeight = 0;
            let currentHeight = await this.page.evaluate(el => el.scrollHeight, scrollableDiv);

            while (previousHeight !== currentHeight) {
                previousHeight = currentHeight;
                
                await this.page.evaluate(el => {
                    el.scrollTop = el.scrollHeight;
                }, scrollableDiv);

                await this.page.waitForTimeout(2000);
                currentHeight = await this.page.evaluate(el => el.scrollHeight, scrollableDiv);
            }
        } catch (error) {
            console.error('Scroll hatası:', error);
        }
    }

    async scrapeBusinessDetails(url) {
        const newPage = await this.browser.newPage();
        
        try {
            await newPage.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
            await newPage.waitForSelector('h1', { timeout: 10000 });

            const businessData = await newPage.evaluate(() => {
                const getName = () => {
                    const h1 = document.querySelector('h1');
                    return h1 ? h1.textContent.trim() : 'Bulunamadı';
                };

                const getAddress = () => {
                    const addressBtn = document.querySelector('button[data-item-id="address"]');
                    if (addressBtn) {
                        const addressText = addressBtn.getAttribute('aria-label');
                        return addressText ? addressText.replace('Adres: ', '').trim() : 'Bulunamadı';
                    }
                    return 'Bulunamadı';
                };

                const getPhone = () => {
                    const phoneBtn = document.querySelector('button[data-item-id^="phone"]');
                    if (phoneBtn) {
                        const phoneText = phoneBtn.getAttribute('aria-label');
                        return phoneText ? phoneText.replace('Telefon: ', '').trim() : 'Bulunamadı';
                    }
                    return 'Bulunamadı';
                };

                const getWebsite = () => {
                    const websiteBtn = document.querySelector('a[data-item-id="authority"]');
                    if (websiteBtn) {
                        return websiteBtn.href || 'Bulunamadı';
                    }
                    return 'Bulunamadı';
                };

                return {
                    name: getName(),
                    address: getAddress(),
                    phone: getPhone(),
                    website: getWebsite(),
                    email: 'Bulunamadı' // E-mail ayrı olarak aranacak
                };
            });

            // E-mail adresi ara
            if (businessData.website && businessData.website !== 'Bulunamadı') {
                businessData.email = await this.findEmailOnWebsite(businessData.website);
            }

            return businessData;

        } catch (error) {
            console.error(`İşletme detayı hatası (${url}):`, error);
            return null;
        } finally {
            await newPage.close();
        }
    }

    async findEmailOnWebsite(websiteUrl) {
        const emailPage = await this.browser.newPage();
        
        try {
            // URL'yi düzelt
            if (!websiteUrl.startsWith('http')) {
                websiteUrl = 'https://' + websiteUrl;
            }

            await emailPage.goto(websiteUrl, { 
                waitUntil: 'networkidle2', 
                timeout: 10000 
            });

            // Sayfada e-mail ara
            const emails = await emailPage.evaluate(() => {
                const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
                const pageText = document.body.innerText;
                const foundEmails = pageText.match(emailRegex) || [];
                
                // Spam e-mailleri filtrele
                const validEmails = foundEmails.filter(email => {
                    const lowerEmail = email.toLowerCase();
                    return !lowerEmail.includes('noreply') && 
                           !lowerEmail.includes('no-reply') && 
                           !lowerEmail.includes('example.com') &&
                           !lowerEmail.includes('test.com');
                });

                return validEmails.length > 0 ? validEmails[0] : null;
            });

            if (emails) return emails;

            // İletişim sayfasını kontrol et
            const contactEmail = await this.checkContactPage(emailPage, websiteUrl);
            return contactEmail;

        } catch (error) {
            console.error(`E-mail arama hatası (${websiteUrl}):`, error);
            return 'Bulunamadı';
        } finally {
            await emailPage.close();
        }
    }

    async checkContactPage(page, baseUrl) {
        try {
            // İletişim linklerini bul
            const contactLinks = await page.evaluate((baseUrl) => {
                const links = Array.from(document.querySelectorAll('a'));
                const contactKeywords = ['contact', 'iletisim', 'iletişim', 'about', 'hakkinda'];
                
                return links
                    .filter(link => {
                        const text = link.textContent.toLowerCase();
                        const href = link.href.toLowerCase();
                        return contactKeywords.some(keyword => 
                            text.includes(keyword) || href.includes(keyword)
                        );
                    })
                    .map(link => {
                        let href = link.href;
                        if (href.startsWith('/')) {
                            href = new URL(href, baseUrl).href;
                        }
                        return href;
                    })
                    .slice(0, 3); // İlk 3 link
            }, baseUrl);

            // İletişim sayfalarında e-mail ara
            for (const contactUrl of contactLinks) {
                try {
                    await page.goto(contactUrl, { waitUntil: 'networkidle2', timeout: 8000 });
                    
                    const email = await page.evaluate(() => {
                        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
                        const pageText = document.body.innerText;
                        const foundEmails = pageText.match(emailRegex) || [];
                        
                        const validEmails = foundEmails.filter(email => {
                            const lowerEmail = email.toLowerCase();
                            return !lowerEmail.includes('noreply') && 
                                   !lowerEmail.includes('no-reply') && 
                                   !lowerEmail.includes('example.com');
                        });

                        return validEmails.length > 0 ? validEmails[0] : null;
                    });

                    if (email) return email;
                } catch (error) {
                    console.error(`İletişim sayfası hatası (${contactUrl}):`, error);
                }
            }

        } catch (error) {
            console.error('İletişim sayfası kontrolü hatası:', error);
        }

        return 'Bulunamadı';
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// API Routes - Streaming Scrape
app.post('/api/scrape-stream', async (req, res) => {
    const { keyword, country, city } = req.body;

    if (!keyword || !country) {
        return res.status(400).json({ 
            error: 'Keyword ve country alanları gereklidir' 
        });
    }

    // Server-Sent Events için header ayarla
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const scraper = new GoogleMapsScraper();
    let businessCount = 0;

    try {
        await scraper.initialize();
        
        // Callback fonksiyonu - her işletme bulunduğunda çağrılır
        const onBusinessFound = (business) => {
            businessCount++;
            const data = {
                type: 'business',
                data: business,
                count: businessCount
            };
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Status callback
        const onStatusUpdate = (status) => {
            const data = {
                type: 'status',
                message: status
            };
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Progress callback
        const onProgressUpdate = (message, estimatedRemaining) => {
            const data = {
                type: 'progress',
                message: message,
                estimatedRemaining: estimatedRemaining
            };
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        await scraper.searchBusinessesStream(keyword, country, city, onBusinessFound, onStatusUpdate, onProgressUpdate);
        
        // Tamamlandı mesajı
        const completeData = {
            type: 'complete',
            totalCount: businessCount
        };
        res.write(`data: ${JSON.stringify(completeData)}\n\n`);
        
    } catch (error) {
        console.error('Streaming scraping hatası:', error);
        const errorData = {
            type: 'error',
            message: error.message
        };
        res.write(`data: ${JSON.stringify(errorData)}\n\n`);
    } finally {
        await scraper.close();
        res.end();
    }
});

// Eski API (geriye uyumluluk için)
app.post('/api/scrape', async (req, res) => {
    const { keyword, country, city } = req.body;

    if (!keyword || !country) {
        return res.status(400).json({ 
            error: 'Keyword ve country alanları gereklidir' 
        });
    }

    const scraper = new GoogleMapsScraper();

    try {
        await scraper.initialize();
        const businesses = await scraper.searchBusinesses(keyword, country, city);
        
        res.json({
            success: true,
            data: businesses,
            count: businesses.length
        });

    } catch (error) {
        console.error('Scraping hatası:', error);
        res.status(500).json({
            error: 'Scraping işlemi sırasında hata oluştu',
            message: error.message
        });
    } finally {
        await scraper.close();
    }
});

// E-mail gönderme endpoint'i
app.post('/api/send-email', async (req, res) => {
    const { recipients, subject, content, smtpSettings } = req.body;

    // Bu kısım nodemailer ile implementasyon gerektirir
    res.json({
        success: true,
        message: 'E-mail gönderme özelliği henüz implementasyonda',
        sent: 0,
        failed: recipients.length
    });
});

// Sağlık kontrolü
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Frontend'i serve et
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// CSS ve JS dosyaları için özel route'lar (MIME type sorununu çözmek için)
app.get('/styles.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'styles.css'));
});

app.get('/script.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'script.js'));
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Sunucu kapatılıyor...');
    process.exit(0);
});

module.exports = app;