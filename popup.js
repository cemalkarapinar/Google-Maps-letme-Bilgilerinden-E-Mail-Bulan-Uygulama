document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startScraping');
    const exportBtn = document.getElementById('exportData');
    const status = document.getElementById('status');
    const results = document.getElementById('results');

    startBtn.addEventListener('click', async () => {
        const keyword = document.getElementById('keyword').value;
        const location = document.getElementById('location').value;

        if (!keyword || !location) {
            status.textContent = 'Lütfen tüm alanları doldurun!';
            return;
        }

        status.textContent = 'Google Maps açılıyor...';
        
        // Google Maps'i aç
        const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(keyword + ' ' + location)}`;
        
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            await chrome.tabs.update(tab.id, {url: searchUrl});
            
            status.textContent = 'Sayfa yükleniyor... 5 saniye bekleyin';
            
            // 5 saniye bekle
            setTimeout(async () => {
                try {
                    await chrome.scripting.executeScript({
                        target: {tabId: tab.id},
                        function: scrapeMapsData
                    });
                    status.textContent = 'Veri toplama başladı...';
                } catch (error) {
                    status.textContent = 'Hata: ' + error.message;
                }
            }, 5000);
            
        } catch (error) {
            status.textContent = 'Hata: ' + error.message;
        }
    });

    exportBtn.addEventListener('click', () => {
        chrome.storage.local.get(['scrapedData'], (result) => {
            if (result.scrapedData && result.scrapedData.length > 0) {
                downloadCSV(result.scrapedData);
            } else {
                status.textContent = 'İndirilecek veri yok!';
            }
        });
    });

    // Sonuçları güncelle
    chrome.storage.local.get(['scrapedData'], (result) => {
        if (result.scrapedData) {
            results.innerHTML = `<strong>${result.scrapedData.length} işletme bulundu</strong>`;
        }
    });
});

function scrapeMapsData() {
    console.log('Maps scraping başladı...');
    
    const businesses = [];
    
    // İşletme kartlarını bul
    const businessCards = document.querySelectorAll('[data-result-index]');
    
    businessCards.forEach((card, index) => {
        try {
            const nameElement = card.querySelector('h3, .qBF1Pd');
            const addressElement = card.querySelector('.W4Efsd:last-child .W4Efsd:first-child');
            const phoneElement = card.querySelector('[data-value="phone"]');
            const websiteElement = card.querySelector('[data-value="website"]');
            
            const business = {
                name: nameElement ? nameElement.textContent.trim() : 'Bulunamadı',
                address: addressElement ? addressElement.textContent.trim() : 'Bulunamadı',
                phone: phoneElement ? phoneElement.textContent.trim() : 'Bulunamadı',
                website: websiteElement ? websiteElement.href : 'Bulunamadı',
                email: 'Bulunamadı' // Email ayrı işlem gerektirir
            };
            
            if (business.name !== 'Bulunamadı') {
                businesses.push(business);
            }
        } catch (error) {
            console.error('İşletme verisi alınamadı:', error);
        }
    });
    
    // Verileri kaydet
    chrome.storage.local.set({scrapedData: businesses}, () => {
        console.log(`${businesses.length} işletme kaydedildi`);
    });
    
    return businesses;
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
    a.click();
    URL.revokeObjectURL(url);
}