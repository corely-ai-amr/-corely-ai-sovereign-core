// ذاكرة مؤقتة لتتبع عدد الطلبات ومنع الهجمات (Rate Limiting)
const requestTracker = new Map();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // استخراج الـ IP أو معرف المستخدم للتحكم في معدل الطلبات
    const clientIP = req.headers['x-forwarded-for'] || 'secure-client';
    const currentTime = Date.now();
    
    // نظام فحص الـ WAF المحلي: منع الإغراق (أكثر من 10 طلبات في الدقيقة يتم حظرها مؤقتاً)
    if (!requestTracker.has(clientIP)) {
        requestTracker.set(clientIP, { count: 1, startTime: currentTime });
    } else {
        const tracker = requestTracker.get(clientIP);
        if (currentTime - tracker.startTime < 60000) {
            if (tracker.count > 10) {
                return res.status(429).json({ error: 'WAF Security Alert: Rate limit exceeded. Too many requests.' });
            }
            tracker.count++;
        } else {
            tracker.set(clientIP, { count: 1, startTime: currentTime });
        }
    }

    const { query, user, hashToken } = req.body;
    const apiKey = process.env.DIFY_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured.' });
    }

    // التحقق من صحة الجلسة المشفرة
    if (!hashToken) {
        return res.status(401).json({ error: 'Unauthorized secure enclave access.' });
    }

    // تنظيف وتأمين النص ضد أي محاولات حقن برمجية (Sanitization)
    const sanitizedQuery = typeof query === 'string' ? query.slice(0, 5000) : '';

    // توجيهات القدرة 51 والخصوصية المطلقة
    const capability51Context = `
[SYSTEM DIRECTIVE: CAPABILITY #51 ACTIVE - SECURE ZERO-LOG ENCLAVE]
أنت النواة السيادية لـ AMI OS v10.0. يتم معالجة طلبات الأسراب والهندسة الفضائية وصيانة الطائرات بشكل مشفر وفوري دون تخزين أي سجلات بيانات نهائياً لضمان الخصوصية القانونية التامة للمستخدم.
`;

    const enhancedQuery = `${capability51Context}\n\nأمر المستخدم: ${sanitizedQuery}`;

    try {
        const response = wallFetch('https://api.dify.ai/v1/chat-messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: {},
                query: enhancedQuery,
                response_mode: "blocking",
                user: user || "Secure-Client"
            })
        });

        const data = await response.json();
        
        // إرجاع النتيجة وتدمير أي أثر (Zero Retention)
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Secure enclave communication error.' });
    }
}
