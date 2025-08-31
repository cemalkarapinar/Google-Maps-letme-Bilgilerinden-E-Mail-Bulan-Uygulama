// Google Maps sayfasında çalışan script

console.log('Google Maps Scraper yüklendi');

// Sayfa yüklendiğinde çalış
window.addEventListener('load', () => {
    console.log('Google Maps sayfası yüklendi');
    
    // Scraping butonunu ekle
    addScrapingButton();
});

function addScrapingButton() {
    // Eğer buton zaten varsa ekleme
    if (document.getElementById('maps-scraper-btn')) return;
    
    const button = document.createElement('button');
    button.id = 'maps-scraper-btn';
    button.innerHTML = '📊 Verileri Topla';
    button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: #4285f4;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    button.addEventListener('click', startScraping);
    document.body.appendChild(button);
}

async function startScraping() {
    const button = document.getElementById('maps-scraper-btn');
    button.innerHTML = '⏳ Toplaniyor...';
    button.disabled = true;
    
    const businesses = [];
    
    try {
        // Sonuçları scroll ederek yükle
        await scrollToLoadMore();
        
        // İşletme verilerini topla
        const results = document.querySelectorAll('[data-result-index]');
        
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            
            try {
                // İşletme detayına tıkla
                const nameLink = result.querySelector('h3 a, .qBF1Pd');
                if (nameLink) {
                    nameLink.click();
                    await sleep(2000); // 2 saniye bekle
                    
                    // Detay bilgilerini al
                    const business = extractBusinessDetails();
                    if (business.name !== 'Bulunamadı') {
                        businesses.push(business);
                    }
                    
                    // Geri dön
                    const backButton = document.querySelector('[data-value="back"]');
                    if (backButton) {
                        backButton.click();
                        await sleep(1000);
                    }
                }
            } catch (error) {
                console.error('İşletme detayı alınamadı:', error);
            }
            
            // Progress göster
            button.innerHTML = `📊 ${i + 1}/${results.length}`;
        }
        
        // Verileri kaydet
        chrome.storage.local.set({scrapedData: businesses});
        
        button.innerHTML = `✅ ${businesses.length} İşletme`;
        button.style.background = '#34a853';
        
        // CSV olarak indir
        downloadCSV(businesses);
        
    } catch (error) {
        console.error('Scraping hatası:', error);
        button.innerHTML = '❌ Hata';
        button.style.background = '#ea4335';
    }
    
    setTimeout(() => {
        button.disabled = false;
        button.innerHTML = '📊 Verileri Topla';
        button.style.background = '#4285f4';
    }, 3000);
}

function extractBusinessDetails() {
    const business = {
        name: 'Bulunamadı',
        address: 'Bulunamadı',
        phone: 'Bulunamadı',
        website: 'Bulunamadı',
        email: 'Bulunamadı'
    };
    
    // İsim
    const nameElement = document.querySelector('h1');
    if (nameElement) {
        business.name = nameElement.textContent.trim();
    }
    
    // Adres
    const addressElement = document.querySelector('[data-item-id="address"]');
    if (addressElement) {
        business.address = addressElement.textContent.trim();
    }
    
    // Telefon
    const phoneElement = document.querySelector('[data-item-id^="phone"]');
    if (phoneElement) {
        business.phone = phoneElement.textContent.trim();
    }
    
    // Website
    const websiteElement = document.querySelector('[data-item-id="authority"]');
    if (websiteElement) {
        business.website = websiteElement.href || websiteElement.textContent.trim();
    }
    
    return business;
}

async function scrollToLoadMore() {
    const scrollableDiv = document.querySelector('[role="feed"]');
    if (!scrollableDiv) return;
    
    let previousHeight = 0;
    let currentHeight = scrollableDiv.scrollHeight;
    
    while (previousHeight !== currentHeight) {
        previousHeight = currentHeight;
        scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
        await sleep(2000);
        currentHeight = scrollableDiv.scrollHeight;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadCSV(data) {
    const headers = ['İşletme Adı', 'Adres', 'Telefon', 'Website', 'Email'];
    const csvContent = [
        headers.join(','),
        ...data.map(row => [
            `"${row.name}"`,
            `"${row.address}"`,
            `"${row.phone}"`,
            `"${row.website}"`,
            `"${row.email}"`
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google_maps_data_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}