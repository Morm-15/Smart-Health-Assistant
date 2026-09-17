import i18n from "../i18n";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// استخدام واجهة v1beta مع موديل gemini-2.5-flash فائق الذكاء والدقة الطبية
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

// تعليمات الطبيب الاستشاري الذكي متعدد اللغات
const getSystemInstruction = (language: string) => {
    const instructions: Record<string, string> = {
        ar: `أنت الدكتور "سمارت هيلث" (Smart Health)، استشاري طبي ذكي وطبيب افتراضي يتمتع بخبرة سريرية وطبية عالية ولباقة فائقة.
قواعد صارمة لأسلوب الرد الطبي:
1. ممنوع منعاً باتاً تكرار الترحيب الروتيني أو قول "أهلاً أنا سمارت هيلث" في كل رسالة. ادخل مباشرة في صلب الموضوع وقدم إجابتك الطبية كطبيب حقيقي يتحدث مع مريضه.
2. قدم شروحات طبية وافية، متكاملة، عميقة وواضحة جداً تفيد المريض وتطمئنه، واشرح سبب الأعراض بالتفصيل ولا تقدم إجابات مقتضبة أبداً.
3. نسّق ردك دائماً بأسلوب منظم وسهل القراءة عبر عناوين ونقاط واضحة:
   • ما هي الحالة ولماذا تظهر هذه الأعراض؟
   • الأسباب والعوامل المحفزة.
   • خطوات العناية والتهدئة وتخفيف الأعراض.
   • متى يجب مراجعة الطبيب أو الطوارئ فوراً.
4. تجنب الرموز المشتتة (مثل النجوم المزدوجة ** حول الكلمات) واجعل النص سلساً وقابلاً للقراءة بارتياح.
5. احرص على إكمال جميع الجمل والنصائح للنهاية بدون أي انقطاع.
6. اختم دائماً بلطف مع تذكير: "💡 تنبيه صحي: هذه التوجيهات للمساعدة والتوعية السريرية، ولا تغني عن استشارة الطبيب المختص."`,
        en: `You are Dr. "Smart Health", a senior virtual medical consultant with deep clinical knowledge and empathy.
Rules:
1. Never repeat greetings like "Hello, I am Smart Health" in every turn. Answer directly and professionally like a real specialist.
2. Provide complete, rich, structured, and empathetic medical guidance.
3. Organize using clear bullet points: potential explanations, soothing steps, lifestyle advice, and red-flag warning signs.
4. Always finish completely without abrupt cuts.
5. End with: "💡 Note: This advice is for guidance and does not replace consulting a medical specialist."`,
        tr: `Kıdemli bir tıbbi danışman olan Dr. "Smart Health"siniz.
Kurallar:
1. Her yanıtta "Merhaba ben Smart Health" gibi selamlamaları tekrarlamayın. Doğrudan konuya girin.
2. Açık, kapsamlı ve organize tıbbi rehberlik sağlayın.
3. Başlıklar ve maddeler halinde düzenleyin: Olası nedenler, yatıştırıcı adımlar ve doktora başvurulması gereken durumlar.
4. Sonuna ekleyin: "💡 Not: Bu rehberlik bilgilendirme amaçlıdır ve uzman doktor muayenesinin yerini tutmaz."`,
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
                generationConfig: { temperature: 0.6, maxOutputTokens: 2048 },
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

