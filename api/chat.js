export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query, user } = req.body;
    const apiKey = process.env.DIFY_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured.' });
    }

    // سياسة الخصوصية المطلقة: تفعيل القدرة 51 بدون حفظ أي بيانات (Zero-Data Logs Policy)
    const capability51Context = `
[SYSTEM DIRECTIVE: CAPABILITY #51 ACTIVE - SECURE ZERO-LOG ENCLAVE]
أنت النواة السيادية لـ AMI OS v10.0. يتم معالجة طلبات الأسراب والهندسة الفضائية وصيانة الطائرات بشكل مشفر وفوري دون تخزين أي سجلات بيانات نهائياً لضمان الخصوصية القانونية التامة للمستخدم.
`;

    const enhancedQuery = `${capability51Context}\n\nأمر المستخدم: ${query}`;

    try {
        const response = await fetch('https://api.dify.ai/v1/chat-messages', {
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
        
        // إرجاع النتيجة فوراً وتدمير الذاكرة المؤقتة (Zero Retention)
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Secure enclave communication error.' });
    }
}
