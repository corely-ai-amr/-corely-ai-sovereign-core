export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query, user } = req.body;
    const apiKey = process.env.DIFY_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured on server.' });
    }

    // تفعيل القدرة رقم 51: إدارة الطائرات (درون، مدنية، عسكرية)، التشخيص، الصيانة، والتصنيع
    const capability51Context = `
[SYSTEM DIRECTIVE: CAPABILITY #51 ACTIVE - AEROSPACE & DEFENSE ECOSYSTEM]
أنت الآن النواة السيادية لـ AMI OS v10.0 المدمجة بالكامل مع القدرة رقم 51. هذه القدرة تخولك إدارة أسطول الطائرات (الدرون، الطائرات المدنية، والطائرات العسكرية)، تحليل مؤشرات الأداء الحية (Telemetry)، تشخيص الأعطال الهيكلية والميكانيكية، وضع خطط الصيانة الفورية، وتوليد مواصفات تصنيع قطع الغيار بدقة مطلقة. تعامل مع طلبات القائد Founder Amr من هذا المنظور الهندسي التريليوني العابر للقارات.
`;

    const enhancedQuery = `${capability51Context}\n\nأمر القائد: ${query}`;

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
                user: user || "Founder-Amr"
            })
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to communicate with Dify aerospace core.' });
    }
}
