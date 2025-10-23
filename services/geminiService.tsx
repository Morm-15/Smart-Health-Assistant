import { GoogleGenAI } from "@google/genai";

// التحقق من وجود API Key في متغير البيئة

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

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
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        // إعادة النص الناتج
        return response?.candidates?.[0]?.content?.parts?.[0]?.text || "لا يوجد رد من الذكاء الاصطناعي.";
    } catch (error: any) {
        console.error("❌ Error with Gemini API:", error);

        // معالجة أخطاء محددة
        if (error?.message?.includes("429") || error?.message?.includes("Quota exceeded")) {
            return "⚠️ عذراً، تم تجاوز حد الاستخدام المجاني لخدمة الذكاء الاصطناعي.\n\nيمكنك:\n1. الانتظار قليلاً والمحاولة لاحقاً\n2. التحقق من حساب Google Cloud الخاص بك\n3. ترقية حسابك للحصول على حصة أكبر";
        }

        if (error?.message?.includes("API key")) {
            return "⚠️ خطأ في مفتاح API. يرجى التحقق من إعدادات المفتاح.";
        }

        if (error?.message?.includes("network") || error?.message?.includes("timeout")) {
            return "⚠️ خطأ في الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.";
        }

        return "⚠️ حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. يرجى المحاولة لاحقاً.";
    }
};
