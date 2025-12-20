import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("EXPO_PUBLIC_GEMINI_API_KEY is not defined in .env file.");
}

const ai = new GoogleGenAI({ apiKey });

// 1. تعريف تعليمات النظام (System Instructions) هنا
const medicalSystemInstruction = `
أنت مساعد طبي ذكي ومتخصص. 
قواعدك الصارمة:
1. أجب فقط على الأسئلة المتعلقة بالطب، الصحة، الأدوية، والوقاية.
2. إذا سألك المستخدم عن أي موضوع خارج المجال الطبي (مثل البرمجة، الطبخ، الرياضة، أو الأسئلة العامة)، اعتذر بأدب وقل: "عذراً، أنا مصمم للإجابة على الاستفسارات الطبية والصحية فقط".
3. دائماً أضف جملة "يرجى استشارة طبيب مختص قبل اتخاذ أي قرار طبي" في نهاية ردودك.
`;

export const sendToGemini = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            // 2. إضافة التعديل هنا: نمرر تعليمات النظام للموديل
            systemInstruction: medicalSystemInstruction,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        return response?.candidates?.[0]?.content?.parts?.[0]?.text || "لا يوجد رد من الذكاء الاصطناعي.";
    } catch (error: any) {
        console.error("❌ Error with Gemini API:", error);
        // ... (بقية معالجة الأخطاء كما هي في كودك)
        return "⚠️ حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";
    }
};