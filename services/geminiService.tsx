import { GoogleGenAI } from "@google/genai";

// التحقق من وجود API Key في متغير البيئة
//api

if (!apiKey) {
    throw new Error("EXPO_PUBLIC_GEMINI_API_KEY is not defined in .env file.");
}

// إنشاء العميل
const ai = new GoogleGenAI({ apiKey });

/**
 * إرسال نص للمحادثة مع نموذج Gemini
 * @param prompt نص المستخدم
 * @returns نص الرد من الذكاء الاصطناعي
 */
export const sendToGemini = async (prompt: string): Promise<string> => {
    try {
        // استخدام نموذج مدعوم مباشرة
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // اختر النموذج المدعوم على حسابك
            contents: prompt,
        });

        // إعادة النص الناتج
        return response.text||"لا يوجد رد من الذكاء الاصطناعي." ;
    } catch (error) {
        console.error("❌ Error with Gemini API:", error);
        return "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";
    }
};
