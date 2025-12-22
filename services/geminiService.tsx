import { GoogleGenAI } from "@google/genai";
import i18n from "../i18n";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;


const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// تعليمات النظام متعددة اللغات (مختصرة لتوفير tokens)
const getSystemInstruction = (language: string) => {
    const instructions = {
        ar: `أنت مساعد طبي. أجب فقط على الأسئلة الطبية والصحية. إذا سُئلت عن مواضيع أخرى، اعتذر. أضف دائماً: "⚠️ استشر طبيباً مختصاً".`,
        en: `You are a medical assistant. Answer only medical and health questions. If asked about other topics, apologize. Always add: "⚠️ Consult a specialist doctor".`,
        tr: `Tıbbi asistansınız. Sadece tıbbi sorulara cevap verin. Diğer konular sorulursa özür dileyin. Her zaman ekleyin: "⚠️ Uzman doktora danışın".`,
    };
    return instructions[language as keyof typeof instructions] || instructions.ar;
};

export const sendToGemini = async (prompt: string): Promise<string> => {
    try {
        if (!ai) {
            return i18n.t('chat.apiKeyMissing');
        }
        if (!prompt || prompt.trim().length === 0) {
            return i18n.t('chat.emptyPrompt');
        }
        const currentLanguage = i18n.language || 'ar';
        const systemInstruction = getSystemInstruction(currentLanguage);
        const optimizedPrompt = `${systemInstruction}\n\n${prompt}`;

        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: [{ role: "user", parts: [{ text: optimizedPrompt }] }],
        });

        const reply = response?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!reply) {
            return i18n.t('chat.noResponse');
        }
        return reply;
    } catch (error: any) {
        console.error("❌ Error with Gemini API:", error);
        if (error.message?.includes('API key')) {
            return i18n.t('chat.invalidApiKey');
        }
        if (error.message?.includes('quota') || error.message?.includes('limit')) {
            return i18n.t('chat.quotaExceeded');
        }
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
            return i18n.t('chat.networkError');
        }
        if (error.message?.includes('timeout')) {
            return i18n.t('chat.timeout');
        }
        return i18n.t('chat.errorMessage');
    }
};
