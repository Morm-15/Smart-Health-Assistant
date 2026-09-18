import * as ImageManipulator from 'expo-image-manipulator';
import i18n from '../i18n';

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

export interface LabTestItem {
    name: string;
    code: string;
    value: string;
    unit: string;
    referenceRange: string;
    status: 'normal' | 'high' | 'low' | 'abnormal' | 'unknown';
    meaning: string;
    clinicalTip: string;
}

export interface LabReportAnalysis {
    reportType: 'lab_test' | 'prescription' | 'medical_report' | 'other';
    reportTitle: string;
    patientName?: string;
    reportDate?: string;
    labOrDoctorName?: string;
    overallSummary: string;
    urgencyLevel: 'normal' | 'attention' | 'urgent';
    urgencyReason: string;
    totalTestsCount: number;
    abnormalTestsCount: number;
    normalTestsCount: number;
    tests: LabTestItem[];
    keyFindings: string[];
    doctorQuestions: string[];
    disclaimer: string;
}

/**
 * تجهيز وضغط صورة التقرير الطبي بدقة عالية لقراءة الجداول والأرقام
 */
export const prepareLabImageBase64 = async (uri: string): Promise<string> => {
    try {
        const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1280 } }],
            { base64: true, format: ImageManipulator.SaveFormat.JPEG, compress: 0.85 }
        );
        return manipulated.base64 || '';
    } catch (e) {
        console.error('Error preparing image for lab analysis:', e);
        throw e;
    }
};

/**
 * تحليل صورة التحليل الطبي عبر Gemini 2.5 Flash Multimodal
 */
export const analyzeLabReportImage = async (
    base64Image: string,
    language: 'ar' | 'en' | 'tr' = 'ar'
): Promise<LabReportAnalysis> => {
    if (!apiKey) {
        throw new Error(i18n.t('chat.apiKeyMissing') || 'Gemini API Key missing');
    }

    const languagePrompts = {
        ar: 'اللغة العربية الفصحى الطبية والواضحة والمبسطة للمريض.',
        en: 'Clear, empathetic and professional clinical English for patients.',
        tr: 'Hasta için net, empatik ve profesyonel klinik Türkçe.',
    };

    const targetLangDesc = languagePrompts[language] || languagePrompts.ar;

    const systemPrompt = `You are a Senior Clinical Pathologist and Medical Laboratory AI Consultant.
Your task is to analyze the provided photo of a medical laboratory report, blood test, or doctor prescription.
Carefully read all visible tables, test codes, numbers, reference ranges, and units.

CRITICAL INSTRUCTION: You MUST return ONLY a valid JSON object matching the schema below. Do NOT output markdown code blocks (\`\`\`json), do NOT include any introductory or concluding text outside the JSON.

SCHEMA:
{
  "reportType": "lab_test" | "prescription" | "medical_report" | "other",
  "reportTitle": "Title of the test or panel (e.g. صورة دم كاملة (CBC) / Tam Kan Sayımı / Complete Blood Count)",
  "patientName": "Patient name if clearly visible, otherwise omit",
  "reportDate": "Date of the report if visible, otherwise omit",
  "labOrDoctorName": "Laboratory or hospital name if visible, otherwise omit",
  "overallSummary": "Comprehensive, compassionate summary of the overall findings in 3-4 sentences in the requested language",
  "urgencyLevel": "normal" | "attention" | "urgent",
  "urgencyReason": "Short explanation of urgency level in the requested language",
  "totalTestsCount": 5,
  "abnormalTestsCount": 2,
  "normalTestsCount": 3,
  "tests": [
    {
      "name": "Test name in requested language (e.g. الهيموجلوبين / Hemoglobin)",
      "code": "Medical standard code (e.g. Hb, WBC, RBC, PLT, TSH, ALT, Cr)",
      "value": "Patient's measured value as string (e.g. 10.4)",
      "unit": "Unit of measurement (e.g. g/dL, mg/dL, 10^3/uL)",
      "referenceRange": "Normal reference range printed or standard (e.g. 12.0 - 16.0)",
      "status": "normal" | "high" | "low" | "abnormal",
      "meaning": "Clear, friendly explanation of what this marker does in the human body",
      "clinicalTip": "Practical lifestyle, nutrition or medical step regarding this test"
    }
  ],
  "keyFindings": [
    "Key finding 1 (highlighting any high or low results)",
    "Key finding 2"
  ],
  "doctorQuestions": [
    "Question 1 to ask the doctor during next visit",
    "Question 2 to ask the doctor",
    "Question 3 to ask the doctor"
  ],
  "disclaimer": "Clinical disclaimer stating this is an AI interpretation and requires doctor review"
}

Language for all textual explanations, summaries, tips, and questions: ${targetLangDesc}
ISO language code: ${language}.
Ensure all numbers and medical values match the image with extreme clinical precision.`;

    const url = `${GEMINI_BASE_URL}?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            inlineData: {
                                mimeType: 'image/jpeg',
                                data: base64Image,
                            },
                        },
                        {
                            text: systemPrompt,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 3072,
                responseMimeType: 'application/json',
            },
        }),
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error('Gemini Lab Analysis Error:', response.status, errText);
        throw new Error(`Failed to analyze lab report (HTTP ${response.status})`);
    }

    const resData = await response.json();
    const rawText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
        throw new Error('Empty response from AI analysis');
    }

    try {
        const cleaned = rawText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

        const parsed: LabReportAnalysis = JSON.parse(cleaned);

        if (parsed.tests && Array.isArray(parsed.tests)) {
            parsed.totalTestsCount = parsed.tests.length;
            parsed.abnormalTestsCount = parsed.tests.filter(
                t => t.status === 'high' || t.status === 'low' || t.status === 'abnormal'
            ).length;
            parsed.normalTestsCount = parsed.tests.filter(t => t.status === 'normal').length;
        }

        return parsed;
    } catch (parseErr) {
        console.error('Failed to parse Gemini JSON:', rawText);
        throw new Error('Failed to parse clinical report data');
    }
};

/**
 * نموذج تحليل مخبري تجريبي متكامل للتحقق الفوري بدون الحاجة لورقة فحص حقيقية
 */
export const getDemoLabReport = (lang: 'ar' | 'en' | 'tr'): LabReportAnalysis => {
    if (lang === 'en') {
        return {
            reportType: 'lab_test',
            reportTitle: 'Complete Blood Count (CBC) & Metabolic Panel',
            patientName: 'John Doe',
            reportDate: '18 Sep 2026',
            labOrDoctorName: 'Central Clinical Diagnostic Lab',
            overallSummary:
                'The analysis reveals mild microcytic anemia due to reduced Hemoglobin and Hematocrit levels. White blood cell count and platelets are within optimal reference ranges, indicating no acute infection or bleeding disorder.',
            urgencyLevel: 'attention',
            urgencyReason: 'Hemoglobin is mildly below normal range, requiring dietary iron review and medical consultation.',
            totalTestsCount: 6,
            abnormalTestsCount: 2,
            normalTestsCount: 4,
            tests: [
                {
                    name: 'Hemoglobin',
                    code: 'Hb',
                    value: '10.8',
                    unit: 'g/dL',
                    referenceRange: '13.5 - 17.5',
                    status: 'low',
                    meaning: 'Oxygen-carrying protein in red blood cells.',
                    clinicalTip: 'Consume iron-rich foods such as spinach, lentils, and lean meat, accompanied by Vitamin C.',
                },
                {
                    name: 'White Blood Cells',
                    code: 'WBC',
                    value: '6.4',
                    unit: '10^3/µL',
                    referenceRange: '4.5 - 11.0',
                    status: 'normal',
                    meaning: 'Key immune cells defending the body against bacterial and viral infections.',
                    clinicalTip: 'Healthy immune status with no signs of acute infection.',
                },
                {
                    name: 'Platelets',
                    code: 'PLT',
                    value: '240',
                    unit: '10^3/µL',
                    referenceRange: '150 - 450',
                    status: 'normal',
                    meaning: 'Cell fragments essential for proper blood clotting and wound healing.',
                    clinicalTip: 'Optimal clotting potential with no spontaneous bleeding risk.',
                },
                {
                    name: 'Fasting Blood Glucose',
                    code: 'FBG',
                    value: '92',
                    unit: 'mg/dL',
                    referenceRange: '70 - 99',
                    status: 'normal',
                    meaning: 'Sugar level in bloodstream following 8 hours of overnight fasting.',
                    clinicalTip: 'Excellent glucose metabolism and low diabetes risk.',
                },
                {
                    name: 'Serum Ferritin',
                    code: 'FER',
                    value: '14.2',
                    unit: 'ng/mL',
                    referenceRange: '20.0 - 250.0',
                    status: 'low',
                    meaning: 'Primary intracellular protein that stores iron for future blood production.',
                    clinicalTip: 'Indicates depleted iron stores; physician may prescribe oral iron supplements.',
                },
                {
                    name: 'Serum Creatinine',
                    code: 'Cr',
                    value: '0.9',
                    unit: 'mg/dL',
                    referenceRange: '0.7 - 1.3',
                    status: 'normal',
                    meaning: 'Metabolic waste product filtered by the kidneys to evaluate kidney function.',
                    clinicalTip: 'Kidneys are filtering properly. Maintain good hydration.',
                },
            ],
            keyFindings: [
                'Mildly low Hemoglobin (10.8 g/dL) suggestive of iron deficiency.',
                'Depleted Ferritin reserves (14.2 ng/mL) requiring clinical attention.',
                'Normal kidney function and healthy blood sugar levels.',
            ],
            doctorQuestions: [
                'Should I undergo an iron panel (TIBC / Transferrin) to confirm iron deficiency anemia?',
                'Do you recommend oral iron supplementation, and for how many months?',
                'Are there any gastrointestinal or dietary evaluations needed for low ferritin?',
            ],
            disclaimer: 'This is an AI-assisted clinical report summary. It does not replace professional medical diagnosis by your doctor.',
        };
    }

    if (lang === 'tr') {
        return {
            reportType: 'lab_test',
            reportTitle: 'Tam Kan Sayımı (CBC) ve Biyokimya Paneli',
            patientName: 'Ahmet Yılmaz',
            reportDate: '18 Eylül 2026',
            labOrDoctorName: 'Merkez Klinik Laboratuvarı',
            overallSummary:
                'Analiz, düşük Hemoglobin ve Ferritin seviyelerine bağlı olarak hafif mikrositik anemiyi göstermektedir. Beyaz kan hücreleri ve trombositler optimal sınırlar içindedir; bu da akut enfeksiyon olmadığını gösterir.',
            urgencyLevel: 'attention',
            urgencyReason: 'Hemoglobin referans aralığının biraz altında, tıbbi değerlendirme gerektirir.',
            totalTestsCount: 6,
            abnormalTestsCount: 2,
            normalTestsCount: 4,
            tests: [
                {
                    name: 'Hemoglobin',
                    code: 'Hb',
                    value: '10.8',
                    unit: 'g/dL',
                    referenceRange: '13.5 - 17.5',
                    status: 'low',
                    meaning: 'Kırmızı kan hücrelerinde oksijen taşıyan ana protein.',
                    clinicalTip: 'Ispanak, mercimek ve kırmızı et gibi demir açısından zengin gıdalar tüketin; C vitamini ile destekleyin.',
                },
                {
                    name: 'Beyaz Kan Hücreleri (Lökosit)',
                    code: 'WBC',
                    value: '6.4',
                    unit: '10^3/µL',
                    referenceRange: '4.5 - 11.0',
                    status: 'normal',
                    meaning: 'Vücudu enfeksiyonlara karşı koruyan bağışıklık sistemi hücreleri.',
                    clinicalTip: 'Bağışıklık göstergeleri sağlıklı ve normal aralıktadır.',
                },
                {
                    name: 'Trombosit (Platelet)',
                    code: 'PLT',
                    value: '240',
                    unit: '10^3/µL',
                    referenceRange: '150 - 450',
                    status: 'normal',
                    meaning: 'Kanın pıhtılaşmasını sağlayan ve kanamayı durduran hücre parçacıkları.',
                    clinicalTip: 'Pıhtılaşma seviyesi tamamen normal ve dengeli.',
                },
                {
                    name: 'Açlık Kan Şekeri',
                    code: 'AKŞ / FBG',
                    value: '92',
                    unit: 'mg/dL',
                    referenceRange: '70 - 99',
                    status: 'normal',
                    meaning: '8 saatlik açlık sonrası kanda ölçülen glukoz miktarı.',
                    clinicalTip: 'Kan şekeri regülasyonu mükemmel, diyabet riski düşük.',
                },
                {
                    name: 'Ferritin (Demir Deposu)',
                    code: 'FER',
                    value: '14.2',
                    unit: 'ng/mL',
                    referenceRange: '20.0 - 250.0',
                    status: 'low',
                    meaning: 'Vücutta demiri depolayan protein; demir rezervini gösterir.',
                    clinicalTip: 'Demir depoları azalmış; doktorunuz demir takviyesi önerebilir.',
                },
                {
                    name: 'Kreatinin',
                    code: 'Cr',
                    value: '0.9',
                    unit: 'mg/dL',
                    referenceRange: '0.7 - 1.3',
                    status: 'normal',
                    meaning: 'Böbrek süzme fonksiyonunu değerlendiren metabolik atık.',
                    clinicalTip: 'Böbrek fonksiyonları sağlıklı çalışıyor. Bol su için.',
                },
            ],
            keyFindings: [
                'Demir eksikliğine işaret eden hafif düşük Hemoglobin (10.8 g/dL).',
                'Azalmış Ferritin rezervleri (14.2 ng/mL).',
                'Normal böbrek fonksiyonları ve ideal açlık kan şekeri.',
            ],
            doctorQuestions: [
                'Demir eksikliği anemisi için ek bir tetkik (Transferrin saturasyonu vb.) yapmalı mıyız?',
                'Ağızdan demir takviyesi kullanmamı önerir misiniz, ne kadar süreyle?',
                'Beslenmemde dikkat etmem gereken özel noktalar nelerdir?',
            ],
            disclaimer: 'Bu rapor yapay zeka destekli bir ön değerlendirmedir. Kesin tanı ve tedavi için mutlaka doktorunuza başvurun.',
        };
    }

    // Default: Arabic
    return {
        reportType: 'lab_test',
        reportTitle: 'تحليل صورة الدم الكاملة (CBC) والوظائف الحيوية',
        patientName: 'محمد أحمد',
        reportDate: '18 سبتمبر 2026',
        labOrDoctorName: 'مختبرات الرعاية الطبية المركزية',
        overallSummary:
            'يُظهر التحليل وجود أنيميا طفيفة (فقر دم خفيف) ناتجة عن انخفاض مستوى الهيموجلوبين ومخزون الحديد (الفيريتين)، بينما تعمل كريات الدم البيضاء والصفائح الدموية ووظائف الكلى بمعدلات ممتازة ومثالية دون أي مؤشر على التهاب حاد.',
        urgencyLevel: 'attention',
        urgencyReason: 'الهيموجلوبين أقل من المعدل الطبيعي بشكل طفيف ويستدعي مراجعة طبية للتغذية ودعم الحديد.',
        totalTestsCount: 6,
        abnormalTestsCount: 2,
        normalTestsCount: 4,
        tests: [
            {
                name: 'الهيموجلوبين',
                code: 'Hb',
                value: '10.8',
                unit: 'g/dL',
                referenceRange: '13.5 - 17.5',
                status: 'low',
                meaning: 'البروتين الرئيسي داخل كريات الدم الحمراء المسؤول عن نقل الأكسجين إلى خلايا الجسم.',
                clinicalTip: 'تناول الأغذية الغنية بالحديد كالسبانخ، العدس، واللحوم الحمراء مدعومة بفيتامين C لتحسين الامتصاص.',
            },
            {
                name: 'كريات الدم البيضاء',
                code: 'WBC',
                value: '6.4',
                unit: '10^3/µL',
                referenceRange: '4.5 - 11.0',
                status: 'normal',
                meaning: 'الخلايا الدفاعية لجهاز المناعة المسؤولة عن مقاومة العدوى البكتيرية والفيروسية.',
                clinicalTip: 'مؤشر ممتاز يدل على عدم وجود التهاب بكتيري أو عدوى نشطة بالجسم.',
            },
            {
                name: 'الصفائح الدموية',
                code: 'PLT',
                value: '240',
                unit: '10^3/µL',
                referenceRange: '150 - 450',
                status: 'normal',
                meaning: 'أجزاء خلوية مسؤولة عن تخثر الدم والتئام الجروح ومنع النزيف.',
                clinicalTip: 'معدل التجلط طبيعي تماماً ولا يوجد خطر نزيف أو سيولة مفرطة.',
            },
            {
                name: 'سكر الدم الصائم',
                code: 'FBG',
                value: '92',
                unit: 'mg/dL',
                referenceRange: '70 - 99',
                status: 'normal',
                meaning: 'مستوى الجلوكوز في الدم بعد صيام 8 ساعات متواصلة.',
                clinicalTip: 'قراءة ممتازة تدل على حساسية إنسولين جيدة وغياب مؤشرات السكري.',
            },
            {
                name: 'مخزون الحديد (الفيريتين)',
                code: 'FER',
                value: '14.2',
                unit: 'ng/mL',
                referenceRange: '20.0 - 250.0',
                status: 'low',
                meaning: 'البروتين المسؤول عن تخزين الحديد في الكبد ونخاع العظم لصنع كريات دم جديدة.',
                clinicalTip: 'استشر الطبيب حول إمكانية البدء بكورس مكملات حديد علاجية مع فحص الامتصاص.',
            },
            {
                name: 'الكرياتينين',
                code: 'Cr',
                value: '0.9',
                unit: 'mg/dL',
                referenceRange: '0.7 - 1.3',
                status: 'normal',
                meaning: 'ناتج الأيض العضلي الذي تقوم الكليتان بتصفيته لتقييم كفاءة عمل الكلى.',
                clinicalTip: 'وظائف الكلى سليمة وتصفي الفضلات بكفاءة. احرص على شرب 2 لتر ماء يومياً.',
            },
        ],
        keyFindings: [
            'انخفاض خفيف في الهيموجلوبين (10.8 g/dL) يشير إلى أنيميا نقص حديد مبكرة.',
            'مخزون الحديد (الفيريتين) منخفض ويحتاج إلى تعويض علاجي.',
            'وظائف الكلى والسكر والمناعة ضمن المعدلات الطبيعية والآمنة.',
        ],
        doctorQuestions: [
            'هل أحتاج إلى كورس حبوب حديد معينة لا تسبب اضطراباً في المعدة؟',
            'متى يجب إعادة تحليل الهيموجلوبين والفيريتين لمتابعة التحسن؟',
            'هل توجد أي أسباب أخرى لنقص الحديد ينبغي فحصها؟',
        ],
        disclaimer: 'هذا التقرير هو تحليل ومساعد إرشادي بالذكاء الاصطناعي، ولا يغني عن استشارة الطبيب المعالج والتشخيص السريري المباشر.',
    };
};
