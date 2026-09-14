const requestTracker = new Map();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientIP = req.headers['x-forwarded-for'] || 'secure-client';
    const currentTime = Date.now();
    
    // WAF Rate Limiting المحلي
    if (!requestTracker.has(clientIP)) {
        requestTracker.set(clientIP, { count: 1, startTime: currentTime });
    } else {
        const tracker = requestTracker.get(clientIP);
        if (currentTime - tracker.startTime < 60000) {
            if (tracker.count > 15) {
                return res.status(429).json({ error: 'WAF Security Alert: Rate limit exceeded.' });
            }
            tracker.count++;
        } else {
            requestTracker.set(clientIP, { count: 1, startTime: currentTime });
        }
    }

    const { query, user, hashToken } = req.body;
    const apiKey = process.env.DIFY_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Critical Error: DIFY_API_KEY not configured in environment variables.' });
    }

    if (!hashToken) {
        return res.status(401).json({ error: 'Unauthorized secure enclave access.' });
    }

    const sanitizedQuery = typeof query === 'string' ? query.slice(0, 5000) : '';

    try {
        const dResponse = await fetch('https://api.dify.ai/v1/workflows/run', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: {},
                query: sanitizedQuery,
                response_mode: "blocking",
                user: user || "Secure-Client"
            })
        });

        const data = await dResponse.json();
        
        // إرجاع الرد الحقيقي القادم من Dify Chatflow بنجاح
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Secure enclave communication error with AI core.' });
    }
}
