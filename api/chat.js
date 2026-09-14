// /api/chat.js - AMI OS v2.0 Global Sovereign & Autonomous Swarm Enclave
const requestTracker = new Map();
const forensicBlacklist = new Set();

async function executeGlobalSwarmExecution(url, options, retries = 2, delay = 600) {
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return response;
            if (i === retries) return response;
        } catch (error) {
            if (i === retries) throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Enclave-Signature'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Global Enclave Violation: Protocol locked to POST method only.' });
    }

    const clientIP = req.headers['x-forwarded-for'] || 'global-node-origin';
    
    if (forensicBlacklist.has(clientIP)) {
        return res.status(403).json({ 
            error: 'Global Quarantine: IP permanently blacklisted due to malicious probing signatures.',
            node_status: 'Isolated'
        });
    }

    const currentTime = Date.now();
    if (!requestTracker.has(clientIP)) {
        requestTracker.set(clientIP, { count: 1, startTime: currentTime, threatIndex: 0 });
    } else {
        const tracker = requestTracker.get(clientIP);
        if (currentTime - tracker.startTime < 60000) {
            if (tracker.count > 50) {
                tracker.threatIndex += 2;
                if (tracker.threatIndex > 5) {
                    forensicBlacklist.add(clientIP);
                }
                return res.status(429).json({ 
                    error: 'WAF Global Shield Alert: Rate threshold breached. Node temporarily quarantined.',
                    global_telemetry: 'Defensive Mode'
                });
            }
            tracker.count++;
        } else {
            requestTracker.set(clientIP, { count: 1, startTime: currentTime, threatIndex: 0 });
        }
    }

    const { query, user, hashToken, conversation_id, files, sovereign_mode } = req.body;
    const apiKey = process.env.DIFY_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Global Core Fault: DIFY_API_KEY environment variable unconfigured.' });
    }

    if (!hashToken) {
        return res.status(401).json({ error: 'Sovereign Enclave Denied: Cryptographic signature validation failed.' });
    }

    const sanitizedQuery = typeof query === 'string' ? query.slice(0, 10000) : '';
    if (!sanitizedQuery) {
        return res.status(400).json({ error: 'Empty Vector: Provide a valid global execution string.' });
    }

    try {
        const payload = {
            inputs: {
                system_architecture: "AMI OS v2.0 Global Sovereign Enclave",
                global_autonomous_core: "Tier-Infinity Enterprise",
                security_enforced: "Behavioral WAF & Cryptographic Telemetry",
                execution_mode: sovereign_mode || "global_instant_block"
            },
            query: sanitizedQuery,
            response_mode: "blocking",
            user: user || "Global-Sovereign-Admin"
        };

        if (files && Array.isArray(files) && files.length > 0) {
            payload.files = files.map(file => ({
                type: file.type || "document",
                transfer_method: file.transfer_method || "remote_url",
                url: file.url,
                upload_file_id: file.upload_file_id || null
            }));
        }

        if (conversation_id) {
            payload.conversation_id = conversation_id;
        }

        const dResponse = await executeGlobalSwarmExecution('https://api.dify.ai/v1/chat-messages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ` + apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }, 2, 600);

        if (!dResponse.ok) {
            const errorData = await dResponse.json().catch(() => ({}));
            return res.status(dResponse.status).json({ 
                error: 'Global Swarm Bridge Fault', 
                details: errorData.message || 'The AI Core rejected the global processing payload.' 
            });
        }

        const data = await dResponse.json();

        return res.status(200).json({
            status: "success",
            enclave_version: "v2.0-Global-Sovereign",
            response_mode: "global_enterprise_block",
            answer: data.answer || "تمت معالجة أمر التنفيذ بنجاح عبر شبكة العقد السيادية العالمية.",
            conversation_id: data.conversation_id || conversation_id || null,
            metadata: data.metadata || { global_latency: "Optimized" },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Global Enclave Critical Execution Exception:", error);
        return res.status(500).json({ 
            error: 'Fatal Global Enclave Error: Autonomous core communication network ruptured.',
            timestamp: new Date().toISOString()
        });
    }
}
