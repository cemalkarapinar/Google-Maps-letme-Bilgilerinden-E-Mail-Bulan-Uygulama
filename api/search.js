// Vercel serverless function
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
        
        // Basit test verisi döndür
        const businesses = [
            {
                name: `${keyword} Test İşletmesi 1 - ${city || 'İstanbul'}`,
                address: `${city || 'İstanbul'}, ${country}`,
                phone: '0555 123 45 67',
                email: 'test1@example.com',
                website: 'www.test1.com',
                source: 'Vercel API Test'
            },
            {
                name: `${keyword} Test İşletmesi 2 - ${city || 'Ankara'}`,
                address: `${city || 'Ankara'}, ${country}`,
                phone: '0555 234 56 78',
                email: 'test2@example.com',
                website: 'www.test2.com',
                source: 'Vercel API Test'
            }
        ];

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