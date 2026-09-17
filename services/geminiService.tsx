import i18n from "../i18n";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// مفاتيح AQ. ومفاتيح AIzaSy كلها مفاتيح API عادية تُمرر كـ Query Parameter في الرابط
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent`;

// تعليمات النظام متعددة اللغات
const getSystemInstruction = (language: string) => {
    const instructions: Record<string, string> = {
        ar: `أنت مساعد طبي ذكي اسمك "سمارت هيلث". أجب فقط على الأسئلة الطبية والصحية. أضف دائماً في النهاية: "⚠️ استشر طبيباً مختصاً دائماً."`,
        en: `You are a smart medical assistant named "Smart Health". Answer only medical and health questions. Always add at the end: "⚠️ Always consult a specialist doctor."`,
        tr: `"Smart Health" adlı tıbbi asistansınız. Sadece tıbbi sorulara cevap verin. Her zaman ekleyin: "⚠️ Uzman doktora danışın."`,
    };
    return instructions[language] || instructions.ar;
};

export interface ChatMessageContext {
    role: "user" | "ai";
    text: string;
}

export const sendToGemini = async (
    prompt: string,
    history: ChatMessageContext[] = []
): Promise<string> => {
    try {
        if (!apiKey) {
            console.error("❌ API Key missing");
            return i18n.t('chat.apiKeyMissing');
        }

        if (!prompt || prompt.trim().length === 0) {
            return i18n.t('chat.emptyPrompt');
        }

        const language = i18n.language || 'ar';
        const systemInstruction = getSystemInstruction(language);

        // تقنية النافذة المنزلقة (Sliding Window): أخذ آخر 6 رسائل فقط لحفظ التوكنز والسرعة
        const slidingHistory = history.slice(-6);

        // تنسيق المحادثة المتعددة الأدوار المتوافقة مع معايير Gemini
        const formattedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

        // التأكد من أن أول رسالة دائماً من المستخدم (قاعدة أساسية في Gemini API)
        let startIndex = 0;
        while (startIndex < slidingHistory.length && slidingHistory[startIndex].role !== 'user') {
            startIndex++;
        }

        for (let i = startIndex; i < slidingHistory.length; i++) {
            const item = slidingHistory[i];
            formattedContents.push({
                role: item.role === 'user' ? 'user' : 'model',
                parts: [{ text: item.text }]
            });
        }

        // إضافة السؤال الجديد
        formattedContents.push({
            role: 'user',
            parts: [{ text: prompt.trim() }]
        });

        console.log(`📤 Calling Gemini API with ${formattedContents.length} context turns...`);

        const url = `${GEMINI_BASE_URL}?key=${apiKey}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemInstruction }]
                },
                contents: formattedContents,
                generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
            }),
        });

        console.log("📥 Gemini response status:", response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("❌ Gemini API error:", response.status, errorData);

            if (response.status === 400) return i18n.t('chat.invalidApiKey');
            if (response.status === 401 || response.status === 403) return i18n.t('chat.invalidApiKey');
            if (response.status === 429) return i18n.t('chat.quotaExceeded');
            return `${i18n.t('chat.errorMessage')} (HTTP ${response.status})`;
        }

        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            console.error("❌ Empty reply from Gemini", data);
            return i18n.t('chat.noResponse');
        }

        console.log("✅ Gemini reply received");
        return reply;

    } catch (error: any) {
        console.error("❌ Network/fetch error:", error?.message);

        if (error?.message?.includes('Network') || error?.message?.includes('fetch')) {
            return i18n.t('chat.networkError');
        }
        if (error?.message?.includes('timeout')) {
            return i18n.t('chat.timeout');
        }

        return `${i18n.t('chat.errorMessage')}\n(${error?.message || 'Unknown error'})`;
    }
};

export const analyzeSkinImage = async (base64Image: string): Promise<string> => {
    try {
        if (!apiKey) {
            console.error("❌ API Key missing");
            return i18n.t('chat.apiKeyMissing');
        }

        const language = i18n.language || 'ar';
        const instruction = language === 'ar' 
            ? "أنت طبيب جلدي ذكي ومساعد صحي. قم بتحليل هذه الصورة الجلدية وحدد الحالات الجلدية المحتملة (مثل الأكزيما، حب الشباب، الوردية، إلخ). قدم تحليلاً دقيقاً ومبسطاً باللغة العربية مع نصائح عامة. أضف دائماً في النهاية: '⚠️ تنبيه: هذا التحليل استرشادي فقط ويعتمد على صورة رقمية، ولا يغني أبداً عن زيارة طبيب الجلدية المختص للحصول على تشخيص دقيق.'"
            : language === 'tr'
            ? "Akıllı bir dermatolog ve sağlık asistanısınız. Bu cilt görüntüsünü analiz edin ve olası cilt koşullarını (örn. egzama, akne, rozasea vb.) belirleyin. Genel tavsiyelerle birlikte Türkçe olarak net ve basitleştirilmiş bir analiz sağlayın. Her zaman sonuna ekleyin: '⚠️ Uyarı: Bu analiz yalnızca rehberlik amaçlıdır ve dijital bir görüntüye dayanmaktadır; doğru bir teşhis için uzman bir dermatoloğa yapılacak ziyaretin yerini asla alamaz.'"
            : "You are a smart dermatologist and health assistant. Analyze this skin image and identify potential skin conditions (e.g. eczema, acne, rosacea, etc.). Provide a clear and simplified analysis in English with general advice. Always add at the end: '⚠️ Warning: This analysis is for guidance only and is based on a digital image; it never replaces a visit to a specialist dermatologist for an accurate diagnosis.'";

        console.log("📤 Sending image to Gemini API...");

        const url = `${GEMINI_BASE_URL}?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Image
                            }
                        },
                        {
                            text: instruction
                        }
                    ]
                }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("❌ Gemini Image API error:", response.status, errorData);
            return `${i18n.t('chat.errorMessage')} (HTTP ${response.status})`;
        }

        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            return i18n.t('chat.noResponse');
        }

        console.log("✅ Gemini Image analysis received successfully");
        return reply;
    } catch (error: any) {
        console.error("❌ Gemini Image Analysis error:", error?.message);
        return `${i18n.t('chat.errorMessage')} (${error?.message})`;
    }
};

