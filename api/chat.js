export default async function handler(req, res) {
    // تفعيل الـ CORS لدعم الاتصال السليم بين الواجهة والخادم
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
    }

    try {
        const { query, user, conversation_id } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'الاستعلام (query) مطلوب.' });
        }

        // سحب مفتاح ورابط Dify من متغيرات البيئة السرية في Vercel
        const DIFY_API_KEY = process.env.DIFY_API_KEY;
        const DIFY_API_URL = process.env.DIFY_API_URL || 'https://api.dify.ai/v1/chat-messages';

        if (!DIFY_API_KEY) {
            return res.status(500).json({ 
                error: 'خطأ إعدادات السيرفر: مفتاح DIFY_API_KEY غير مضاف في لوحة تحكم Vercel.' 
            });
        }

        // إرسال الطلب بشكل حي ومباشر إلى Dify Chatflow (الذي يدير الـ Workflow والقدرات الداخلية)
        const difyResponse = await fetch(DIFY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: {},
                query: query,
                response_mode: "blocking",
                user: user || "sovereign-system-user",
                conversation_id: conversation_id || ""
            })
        });

        const difyData = await difyResponse.json();

        if (!difyResponse.ok) {
            throw new Error(difyData.message || 'فشل الاتصال بمنصة Dify Chatflow');
        }

        // إرجاع الإجابة الحقيقية ومعرف المحادثة للواجهة
        return res.status(200).json({
            success: true,
            answer: difyData.answer,
            conversation_id: difyData.conversation_id
        });

    } catch (error) {
        console.error('Dify API Execution Error:', error);
        return res.status(500).json({ 
            error: 'حدث خطأ داخلي أثناء معالجة الطلب عبر النواة.',
            details: error.message 
        });
    }
}
