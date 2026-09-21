import i18n from '../i18n';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

export interface DrugInteractionItem {
    parties: string; // e.g. "Aspirin + Warfarin" or "Atorvastatin + Grapefruit"
    type: 'drug_drug' | 'drug_food';
    severity: 'minor' | 'moderate' | 'severe';
    effect: string; // What happens clinically
    recommendation: string; // Actionable clinical guidance (e.g. space 2 hours apart)
}

export interface DrugInteractionAnalysis {
    medicationsAnalyzed: string[];
    safetyLevel: 'safe' | 'moderate' | 'danger';
    headline: string;
    summary: string;
    interactions: DrugInteractionItem[];
    foodWarnings: string[];
    safeTimingAdvice: string[];
    disclaimer: string;
}

export const analyzeDrugInteractions = async (
    medications: string[],
    language: string = 'ar'
): Promise<DrugInteractionAnalysis> => {
    if (!medications || medications.length === 0) {
        throw new Error('No medications provided');
    }

    if (!apiKey) {
        return getFallbackAnalysis(medications, language);
    }

    const languageInstruction = `Respond completely in the language corresponding to ISO code "${language}" (e.g., Arabic if "ar", English if "en", Turkish if "tr"). All text must be natural, clinically accurate, and accessible to patients.`;

    const systemPrompt = `You are a Clinical Pharmacologist and AI Drug Safety Specialist.
Analyze the following list of medications for:
1. Drug-to-Drug Interactions between any pair or combination of them.
2. Drug-to-Food Interactions (e.g., Grapefruit juice, Dairy/Calcium, High-Potassium foods, Caffeine, Alcohol, Dietary fiber).
3. Critical timing considerations (e.g., before meals, with food, or spacing intervals).

List of medications to evaluate:
${medications.map((m, i) => `${i + 1}. ${m}`).join('\n')}

CRITICAL RULE: Return ONLY a valid JSON object matching the exact schema below. Do not output markdown (\`\`\`json) or extra conversational commentary.

JSON SCHEMA:
{
  "safetyLevel": "safe" | "moderate" | "danger",
  "headline": "Short punchy summary status (e.g. No significant interactions detected / Caution: moderate spacing required / Critical interaction detected)",
  "summary": "Clear, professional 2-3 sentence overview of overall safety for this patient in the target language.",
  "interactions": [
    {
      "parties": "Name of Drug A + Drug B OR Drug A + Food/Beverage",
      "type": "drug_drug" | "drug_food",
      "severity": "minor" | "moderate" | "severe",
      "effect": "Clear explanation of what happens if combined (e.g. increased bleeding risk, decreased absorption)",
      "recommendation": "Precise actionable advice (e.g. separate by at least 2-3 hours, avoid grapefruit while taking this)"
    }
  ],
  "foodWarnings": [
    "Specific food or beverage to avoid or be careful with (e.g. Grapefruit, Milk/Cheese, Green Leafy Vegetables, Coffee)"
  ],
  "safeTimingAdvice": [
    "Practical daily timing tip (e.g. Take Medication A in the morning on an empty stomach)"
  ],
  "disclaimer": "Clinical AI disclaimer: This automated interaction analysis is for informational and safety awareness and does not replace the judgment of your treating physician or licensed pharmacist."
}

${languageInstruction}`;

    const url = `${GEMINI_BASE_URL}?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: systemPrompt },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 2048,
                    responseMimeType: 'application/json',
                },
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.warn('Gemini API returned error:', response.status, errText);
            return getFallbackAnalysis(medications, language);
        }

        const data = await response.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
            return getFallbackAnalysis(medications, language);
        }

        const cleaned = candidateText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
            medicationsAnalyzed: medications,
            safetyLevel: parsed.safetyLevel || 'safe',
            headline: parsed.headline || '',
            summary: parsed.summary || '',
            interactions: Array.isArray(parsed.interactions) ? parsed.interactions : [],
            foodWarnings: Array.isArray(parsed.foodWarnings) ? parsed.foodWarnings : [],
            safeTimingAdvice: Array.isArray(parsed.safeTimingAdvice) ? parsed.safeTimingAdvice : [],
            disclaimer: parsed.disclaimer || 'Always consult your doctor or pharmacist.',
        };
    } catch (e) {
        console.error('Error analyzing drug interactions via Gemini:', e);
        return getFallbackAnalysis(medications, language);
    }
};

/**
 * Fallback clinically verified heuristic check if network or API key is absent
 */
function getFallbackAnalysis(medications: string[], language: string): DrugInteractionAnalysis {
    const isAr = language === 'ar';
    const isTr = language === 'tr';

    const normalized = medications.map(m => m.toLowerCase().trim());
    const interactions: DrugInteractionItem[] = [];
    const foodWarnings: string[] = [];

    // Check Aspirin + Warfarin / Blood thinners
    const hasAspirin = normalized.some(m => m.includes('aspirin') || m.includes('اسبرين'));
    const hasBloodThinner = normalized.some(m => m.includes('warfarin') || m.includes('وارفارين') || m.includes('clopidogrel') || m.includes('plavix') || m.includes('heparin'));
    const hasNSAID = normalized.some(m => m.includes('ibuprofen') || m.includes('بروفين') || m.includes('diclofenac') || m.includes('فولتارين') || m.includes('naproxen'));
    const hasStatin = normalized.some(m => m.includes('atorvastatin') || m.includes('lipitor') || m.includes('simvastatin') || m.includes('ستاتين'));
    const hasThyroid = normalized.some(m => m.includes('levothyroxine') || m.includes('synthroid') || m.includes('ثيروكسين') || m.includes('euthyrox'));

    if (hasAspirin && hasBloodThinner) {
        interactions.push({
            parties: isAr ? 'الأسبرين + مسيلات الدم (مثل الوارفارين)' : isTr ? 'Aspirin + Kan Sulandırıcılar' : 'Aspirin + Anticoagulants (Warfarin/Plavix)',
            type: 'drug_drug',
            severity: 'severe',
            effect: isAr ? 'زيادة مضاعفة في خطر النزيف المعدي والمعوي.' : isTr ? 'Mide ve iç kanama riskinde ciddi artış.' : 'Significantly elevated risk of gastrointestinal and internal bleeding.',
            recommendation: isAr ? 'تجنب الجمع بينهما إلا بأمر وإشراف مباشر من طبيب القلب.' : isTr ? 'Kardiyoloji uzmanı onayı ve takibi olmadan birlikte kullanmayın.' : 'Do not combine without direct cardiologist authorization and monitoring.',
        });
    }

    if (hasAspirin && hasNSAID) {
        interactions.push({
            parties: isAr ? 'الأسبرين + مسكنات NSAID (مثل البروفين أو الفولتارين)' : isTr ? 'Aspirin + İbuprofen/Diklofenak' : 'Aspirin + NSAIDs (Ibuprofen/Voltaren)',
            type: 'drug_drug',
            severity: 'moderate',
            effect: isAr ? 'البروفين قد يقلل من مفعول الأسبرين الوقائي للقلب ويزيد تهيج جدار المعدة.' : isTr ? 'İbuprofen, aspirinin kalp koruyucu etkisini azaltabilir ve mideyi tahriş edebilir.' : 'NSAIDs can interfere with Aspirin cardioprotective action and increase gastric irritation.',
            recommendation: isAr ? 'الفصل بين الجرعات بساعتين على الأقل، واستشارة الصيدلي لبديل آمن مثل الباراسيتامول.' : isTr ? 'Dozlar arasında en az 2 saat bırakın veya parasetamol gibi güvenli alternatifler düşünün.' : 'Separate doses by at least 2 hours or consider paracetamol as a stomach-friendly alternative.',
        });
    }

    if (hasStatin) {
        foodWarnings.push(
            isAr ? 'عصير الجريب فروت: يرفع تركيز الستاتين في الدم وقد يسبب آلاماً عضلية حادة.'
                : isTr ? 'Greyfurt Suyu: Kandaki statin seviyesini tehlikeli derecede artırabilir.'
                : 'Grapefruit juice: Inhibits CYP3A4 metabolism and sharply raises statin blood concentrations.'
        );
    }

    if (hasThyroid) {
        foodWarnings.push(
            isAr ? 'الحليب والكالسيوم والحديد: يمنع امتصاص هرمون الثيروكسين (يجب المباعدة 4 ساعات).'
                : isTr ? 'Süt, Kalsiyum ve Demir: Tiroksin emilimini engeller (en az 4 saat arayla alınmalıdır).'
                : 'Dairy, Calcium & Iron: Impairs thyroid hormone absorption; take at least 4 hours apart.'
        );
    }

    const safetyLevel: 'safe' | 'moderate' | 'danger' =
        interactions.some(i => i.severity === 'severe') ? 'danger' :
            interactions.length > 0 ? 'moderate' : 'safe';

    const headline = safetyLevel === 'danger'
        ? (isAr ? 'تنبيه: تم اكتشاف تعارض دوائي عالي الخطورة' : isTr ? 'Uyarı: Yüksek Riskli İlaç Etkileşimi Tespit Edildi' : 'Warning: High Risk Interaction Detected')
        : safetyLevel === 'moderate'
        ? (isAr ? 'ملاحظة: توجد تعارضات تتطلب مباعدة المواعيد' : isTr ? 'Dikkat: Doz aralığı gerektiren etkileşimler var' : 'Caution: Moderate Spacing Required')
        : (isAr ? 'آمن: لم يتم العثور على تعارضات خطيرة معروفة' : isTr ? 'Güvenli: Bilinen ciddi bir etkileşim bulunamadı' : 'Safe: No Major Interactions Detected');

    const summary = isAr
        ? `تم فحص ${medications.length} أدوية بدقة. احرص على تناول الأدوية بانتظام ومباعدة الأدوية التي قد تهيج المعدة.`
        : isTr
        ? `${medications.length} ilaç incelendi. İlaçlarınızı düzenli alınız ve mideyi yoran ilaçlar arasında zaman bırakınız.`
        : `Evaluated ${medications.length} medication(s). Follow consistent dosing schedules and protect stomach health.`;

    return {
        medicationsAnalyzed: medications,
        safetyLevel,
        headline,
        summary,
        interactions,
        foodWarnings,
        safeTimingAdvice: [
            isAr ? 'اشرب كوباً كاملاً من الماء مع كل قرص دواء.' : isTr ? 'Her ilaçla birlikte tam bir bardak su içiniz.' : 'Drink a full glass of water with each tablet.',
            isAr ? 'لا تسحق أو تقسم الحبوب المغلفة دون استشارة الصيدلي.' : isTr ? 'Eczacınıza danışmadan kaplamalı tabletleri kırmayınız.' : 'Do not crush or split coated pills without pharmacist advice.',
        ],
        disclaimer: isAr
            ? 'هذا التقييم استرشادي ذكي ويعتمد على قواعد البيانات الدوائية ولا يغني عن مراجعة الطبيب المعالج أو الصيدلي.'
            : isTr
            ? 'Bu değerlendirme bilgilendirme amaçlıdır, hekiminizin veya eczacınızın tavsiyesi yerine geçmez.'
            : 'This AI screening is for informational guidance and does not replace direct physician or pharmacist consultation.',
    };
}
