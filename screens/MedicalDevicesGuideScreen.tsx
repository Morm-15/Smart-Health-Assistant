import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Image,
    Linking,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '../components/ScreenHeader';

interface DeviceGuide {
    id: string;
    title: string;
    englishTitle: string;
    icon: string;
    color: string;
    tag: string;
    imageUrl: string;
    videoUrl: string;
    videoTitle: string;
    videoDuration: string;
    videoSource: string;
    summary: string;
    preparation: string[];
    steps: string[];
    normalRanges: string;
    commonMistakes: string[];
}

const DEVICES: DeviceGuide[] = [
    {
        id: 'bp',
        title: 'جهاز قياس ضغط الدم الرقمي',
        englishTitle: 'Digital Blood Pressure Monitor',
        icon: 'heart-circle-outline',
        color: '#EF4444',
        tag: 'صحة القلب والشرايين',
        imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80',
        videoUrl: 'https://www.youtube.com/results?search_query=how+to+measure+blood+pressure+at+home+mayo+clinic',
        videoTitle: 'طريقة قياس ضغط الدم الصحيحة منزلياً خطوة بخطوة',
        videoDuration: '3 دقائق',
        videoSource: 'Mayo Clinic / British Heart Foundation',
        summary: 'يقيس الضغط الانقباضي والانبساطي ونبضات القلب بدقة وأمان منزلياً.',
        preparation: [
            'الجلوس بهدوء واسترخاء لمدة 5 دقائق كاملة قبل البدء.',
            'تجنب تناول الكافيين (القهوة/الشاي) أو التدخين أو ممارسة الرياضة قبل القياس بـ 30 دقيقة.',
            'تفريغ المثانة قبل الفحص لتجنب ارتفاع القراءة الوهمي.',
            'الجلوس على كرسي مع إسناد الظهر ووضع القدمين مستويتين على الأرض (بدون تقاطع الساقين).',
        ],
        steps: [
            'ضع سوار الجهاز (Cuff) على الذراع العارية، بحيث يكون أسفل السوار أعلى مفصل المرفق بحوالي 2-3 سم.',
            'تأكد من أن السوار في نفس مستوى ارتفاع القلب تماماً.',
            'اربط السوار بحيث يتسع لإدخال إصبعين تحته براحة (ليس ضيقاً جداً ولا مرتخياً).',
            'اضغط زر التشغيل (Start) وابدأ القياس دون حركة أو كلام حتى ينتهي الجهاز تماماً.',
            'سجل الرقمين: العلوي (الانقباضي Systolic) والسفلي (الانبساطي Diastolic).',
        ],
        normalRanges: 'الضغط الطبيعي المثالي للبالغين: أقل من 120/80 مم زئبق.',
        commonMistakes: [
            'وضع السوار فوق الملابس السميكة.',
            'الكلام أو الضحك أثناء قياس الجهاز.',
            'وضع الذراع أسفل أو أعلى من مستوى القلب.',
        ],
    },
    {
        id: 'glucometer',
        title: 'جهاز قياس السكر بالدم',
        englishTitle: 'Blood Glucose Meter (Glucometer)',
        icon: 'water-outline',
        color: '#F59E0B',
        tag: 'داء السكري والغدد',
        imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
        videoUrl: 'https://www.youtube.com/results?search_query=how+to+use+glucometer+blood+sugar+test',
        videoTitle: 'طريقة استخدام جهاز قياس السكر وتجنب ألم الوخز',
        videoDuration: '2 دقيقة',
        videoSource: 'Diabetes UK / التوجيه الإكلينيكي',
        summary: 'يقيس تركيز الجلوكوز في الدم عبر قطرة دم صغيرة من طرف الإصبع.',
        preparation: [
            'غسل اليدين جيداً بالماء الدافئ والصابون وتجفيفهما تماماً (تجنب الكحول المعطر لأنه قد يؤثر على النتيجة).',
            'تدفئة اليد وتدليك الإصبع بلطف لتحفيز تدفق الدم.',
            'تجهيز شريط قياس غير منتهي الصلاحية والتأكد من نظافة قلم الوخز.',
        ],
        steps: [
            'أدخل شريط الاختبار في الجهاز حتى يضيء وتظهر أيقونة قطرة الدم.',
            'استخدم قلم الوخز لوخز جانب طرف الإصبع (الجانب أقل ألماً من المنتصف).',
            'اضغط بلطف من قاعدة الإصبع للأعلى لإخراج قطرة دم بحجم رأس الدبوس.',
            'المس حافة شريط الفحص بقطرة الدم حتى يسحبها الشريط تلقائياً.',
            'انتظر العد التنازلي (حوالي 5 ثوانٍ) حتى تظهر القراءة بوحدة mg/dL.',
        ],
        normalRanges: 'الصائم (8 ساعات): 70 - 99 mg/dL | بعد الأكل بساعتين: أقل من 140 mg/dL.',
        commonMistakes: [
            'استخدام أصابع رطبة أو عليها بقايا طعام/عصير.',
            'عصر طرف الإصبع بقوة شديدة مما يخفف عينة الدم بسوائل الأنسجة.',
            'استخدام أشرطة فحص قديمة أو معرضة للرطوبة والحرارة.',
        ],
    },
    {
        id: 'oximeter',
        title: 'مقياس الأكسجين النبضي',
        englishTitle: 'Pulse Oximeter',
        icon: 'speedometer-outline',
        color: '#06B6D4',
        tag: 'الجهاز التنفسي والأكسجين',
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
        videoUrl: 'https://www.youtube.com/results?search_query=how+to+use+pulse+oximeter+correctly',
        videoTitle: 'شرح عملي: كيفية استخدام جهاز قياس الأكسجين وقراءة النتائج',
        videoDuration: '2 دقيقة',
        videoSource: 'NHS / منظمة الصحة العالمية',
        summary: 'يقيس نسبة تشبع الدم بالأكسجين (SpO2) ومعدل نبضات القلب بدون وخز.',
        preparation: [
            'إزالة طلاء الأظافر (المانيكير) والأظافر الاصطناعية لأنها تحجب الأشعة الضوئية.',
            'تدفئة اليدين؛ فالأيدي الباردة جداً تسبب قراءات خاطئة بسبب انقباض الأوعية الدموية.',
            'الجلوس في وضع مستقر ومريح.',
        ],
        steps: [
            'افتح مشبك الجهاز وضعه على الإصبع الأوسط أو السبابة بحيث يكون الظفر للأعلى.',
            'تأكد من أن الإصبع ممتد ومستقر داخل الجهاز تماماً.',
            'شغل الجهاز وانتظر من 10 إلى 20 ثانية حتى يستقر الرقم وتظهر الموجة النبضية بانتظام.',
            'اقرأ النتيجة: SpO2 يمثل نسبة الأكسجين، وPR يمثل النبض بالدقيقة.',
        ],
        normalRanges: 'المعدل الطبيعي للأكسجين: 95% إلى 100% (أقل من 92% يستدعي استشارة عاجلة).',
        commonMistakes: [
            'تحريك اليد أو الرجفان أثناء القراءة.',
            'وجود طلاء أظافر داكن.',
            'استخدام الجهاز تحت ضوء شمس مباشر أو إضاءة قوية ساطعة جداً.',
        ],
    },
    {
        id: 'inhaler',
        title: 'بخاخات وأجهزة الاستنشاق للربو',
        englishTitle: 'Inhalers & Spacer Devices',
        icon: 'cloud-outline',
        color: '#8B5CF6',
        tag: 'الحساسية الصدرية والربو',
        imageUrl: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=800&q=80',
        videoUrl: 'https://www.youtube.com/results?search_query=how+to+use+inhaler+with+spacer',
        videoTitle: 'التقنية الصحيحة لاستنشاق دواء الربو مع أنبوب المباعدة (Spacer)',
        videoDuration: '3 دقائق',
        videoSource: 'Asthma + Lung UK',
        summary: 'توصل الأدوية الموسعة للشعب الهوائية مباشرة إلى الرئتين بسرعة وفاعلية.',
        preparation: [
            'التأكد من تاريخ صلاحية البخاخ ووجود جرعات متبقية.',
            'الجلوس أو الوقوف بشكل مستقيم لتوسيع القفص الصدري والرئتين.',
            'استخدام أنبوب المباعدة (Spacer) يضاعف وصول الدواء للرئتين بنسبة تفوق 70%.',
        ],
        steps: [
            'انزع الغطاء ورج البخاخ جيداً للأعلى والأسفل لمدة 5 ثوانٍ.',
            'أفرغ الهواء من رئتيك تماماً بزفير عميق بعيداً عن البخاخ.',
            'ضع فوهة البخاخ (أو أنبوب المباعدة) بإحكام بين شفتيك وأغلقها جيداً.',
            'اضغط على البخاخ مرة واحدة وابدأ في نفس اللحظة بالاستنشاق ببطء وعمق شديد لمدة 3-5 ثوانٍ.',
            'أخرج البخاخ واحبس نفسك لمدة 10 ثوانٍ كاملة (أو لأطول فترة مريحة) ليستقر الدواء داخل الرئتين.',
            'أخرج الهواء ببطء، وإذا كنت تستخدم بخاخ كورتيزون، تمضمض بالماء وابصقه لمنع الفطريات.',
        ],
        normalRanges: 'الجرعة العلاجية حسب وصفة الطبيب المعالج فقط.',
        commonMistakes: [
            'الاستنشاق السريع المتعجل بدلاً من البطيء والعميق.',
            'عدم حبس النفس بعد استنشاق الجرعة.',
            'عدم رج البخاخ قبل كل بخة.',
        ],
    },
    {
        id: 'thermometer',
        title: 'ميزان الحرارة الرقمي الطبي',
        englishTitle: 'Digital Medical Thermometer',
        icon: 'thermometer-outline',
        color: '#10B981',
        tag: 'مراقبة العلامات الحيوية',
        imageUrl: 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=800&q=80',
        videoUrl: 'https://www.youtube.com/results?search_query=how+to+use+digital+thermometer+properly',
        videoTitle: 'كيفية قياس درجة الحرارة بدقة بالميزان الرقمي الفموي والجبيني',
        videoDuration: '2 دقيقة',
        videoSource: 'Cleveland Clinic / الأكاديمية الأمريكية',
        summary: 'يقيس درجة حرارة الجسم بدقة للكشف المبكر عن الحمى والالتهابات.',
        preparation: [
            'تجنب تناول المشروبات الساخنة أو الباردة قبل القياس الفموي بـ 15 دقيقة.',
            'تنظيف طرف الميزان بمسحة كحولية وتركه ليجف.',
            'الجلوس في درجة حرارة غرفة معتدلة ومستقرة.',
        ],
        steps: [
            'القياس تحت اللسان: ضع الطرف الحساس في أقصى الجزء الخلفي تحت اللسان وأغلق الفم تماماً.',
            'القياس تحت الإبط: تأكد من جفاف الإبط، وضع الطرف في منتصف الإبط واضم الذراع بقوة للصدر (أضف 0.5°C للنتيجة).',
            'قياس الجبهة بالأشعة تحت الحمراء: اجعل المسافة 2-5 سم عن منتصف الجبهة واضغط زر المسح.',
            'انتظر حتى تسمع صوت الصافرة (Beep) ثم اقرأ النتيجة على الشاشة.',
        ],
        normalRanges: 'الحرارة الطبيعية: 36.5°C إلى 37.5°C (الحمى السريرية تبدأ من 38.0°C فأكثر).',
        commonMistakes: [
            'فتح الفم أو الكلام أثناء القياس الفموي.',
            'وجود عرق على الجبهة أثناء القياس بالأشعة تحت الحمراء.',
            'إخراج الميزان قبل سماع صوت اكتمال القياس.',
        ],
    },
];

const MedicalDevicesGuideScreen = () => {
    const { colors, isDarkMode } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
    const { t, i18n } = useTranslation();

    const [selectedDevice, setSelectedDevice] = useState<DeviceGuide>(DEVICES[0]);
    const [activeTab, setActiveTab] = useState<'guide' | 'calculator'>('guide');
    const [imageLoading, setImageLoading] = useState(false);

    // Calculator states
    const [systolic, setSystolic] = useState('');
    const [diastolic, setDiastolic] = useState('');
    const [glucose, setGlucose] = useState('');
    const [glucoseState, setGlucoseState] = useState<'fasting' | 'postprandial'>('fasting');
    const [oxygen, setOxygen] = useState('');

    const openVideoTutorial = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                await Linking.openURL(url);
            }
        } catch (e) {
            console.error("Error opening video URL:", e);
        }
    };

    // Vitals Evaluation Functions
    const getBPEvaluation = () => {
        const sys = parseInt(systolic);
        const dia = parseInt(diastolic);
        if (isNaN(sys) || isNaN(dia)) return null;

        if (sys > 180 || dia > 120) {
            return {
                status: 'أزمة ارتفاع ضغط طارئة (Hypertensive Crisis)',
                color: '#DC2626',
                bg: 'rgba(220, 38, 38, 0.1)',
                level: 5,
                advice: '⚠️ هذه قراءة حرجة جداً! إذا كان هناك ألم بالصدر أو ضيق تنفس أو صداع شديد، توجه فوراً إلى أقرب طوارئ.',
            };
        }
        if (sys >= 140 || dia >= 90) {
            return {
                status: 'ارتفاع ضغط الدم - مرحلة 2 (Stage 2 Hypertension)',
                color: '#EF4444',
                bg: 'rgba(239, 68, 68, 0.1)',
                level: 4,
                advice: 'الضغط مرتفع بشكل ملحوظ. يوصى بمراجعة الطبيب لتقييم الحاجة للعلاج الدوائي وتعديل نمط الحياة.',
            };
        }
        if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
            return {
                status: 'ارتفاع ضغط الدم - مرحلة 1 (Stage 1 Hypertension)',
                color: '#F59E0B',
                bg: 'rgba(245, 158, 11, 0.1)',
                level: 3,
                advice: 'مرحلة تستدعي المراقبة وتقليل الصوديوم في الطعام، وممارسة المشي، واستشارة الطبيب.',
            };
        }
        if (sys >= 120 && sys <= 129 && dia < 80) {
            return {
                status: 'ما قبل ارتفاع ضغط الدم (Elevated BP)',
                color: '#EAB308',
                bg: 'rgba(234, 179, 8, 0.1)',
                level: 2,
                advice: 'قراءة أعلى قليلاً من المثالي. الرياضة وشرب الماء وتقليل الملح كفيل بإعادتها للمعدل المثالي.',
            };
        }
        if (sys >= 90 && sys < 120 && dia >= 60 && dia < 80) {
            return {
                status: 'ضغط دم طبيعي ومثالي (Normal BP)',
                color: '#10B981',
                bg: 'rgba(16, 185, 129, 0.1)',
                level: 1,
                advice: '🟢 صحتك ممتازة! واصل الحفاظ على نمط الحياة الصحي والنشاط البدني.',
            };
        }
        return {
            status: 'ضغط دم منخفض (Low BP)',
            color: '#3B82F6',
            bg: 'rgba(59, 130, 246, 0.1)',
            level: 0,
            advice: 'الضغط منخفض. إذا كنت تشعر بدوخة أو إغماء يرجى الجلوس وشرب سوائل ومراجعة الطبيب.',
        };
    };

    const getGlucoseEvaluation = () => {
        const val = parseInt(glucose);
        if (isNaN(val)) return null;

        if (glucoseState === 'fasting') {
            if (val < 70) return { status: 'هبوط حاد في السكر (Hypoglycemia)', color: '#DC2626', advice: 'تناول 15 غراماً من السكريات السريعة (نصف كوب عصير) فوراً.' };
            if (val <= 99) return { status: 'سكر صائم طبيعي ومثالي', color: '#10B981', advice: 'قراءة صائم ممتازة وسليمة 100%.' };
            if (val <= 125) return { status: 'مرحلة ما قبل السكري (Prediabetes)', color: '#F59E0B', advice: 'ينصح بالحمية الغذائية والنشاط البدني لتفادي تطور السكري.' };
            return { status: 'اشتباه بداء السكري (Diabetes)', color: '#EF4444', advice: 'القراءة مرتفعة. ينصح بإجراء فحص السكر التراكمي (HbA1c) لدى الطبيب.' };
        } else {
            if (val < 70) return { status: 'هبوط في السكر', color: '#DC2626', advice: 'تناول كربوهيدرات أو عصير سريع الامتصاص.' };
            if (val < 140) return { status: 'سكر بعد الأكل طبيعي ومثالي', color: '#10B981', advice: 'استجابة الأنسولين ممتازة ومثالية بعد الوجبة.' };
            if (val <= 199) return { status: 'اضطراب تحمل السكر (Impaired Tolerance)', color: '#F59E0B', advice: 'القراءة فوق الطبيعي بعد الأكل، راقب كمية النشويات.' };
            return { status: 'ارتفاع سكر الدم (High Glucose)', color: '#EF4444', advice: 'القراءة مرتفعة بعد الوجبة، يرجى استشارة الطبيب لتنظيم الجرعات.' };
        }
    };

    const getOxygenEvaluation = () => {
        const val = parseInt(oxygen);
        if (isNaN(val)) return null;

        if (val >= 95 && val <= 100) return { status: 'أكسجين طبيعي وممتاز (Normal)', color: '#10B981', advice: 'كفاءة الرئتين وتوزيع الأكسجين في الجسم ممتازة.' };
        if (val >= 91 && val <= 94) return { status: 'نقص خفيف في الأكسجين (Mild Hypoxia)', color: '#F59E0B', advice: 'راقب النفس؛ إذا كان هناك ضيق أو تعب، استرح واستشر الطبيب.' };
        return { status: 'نقص حاد بالأكسجين (Severe Hypoxia)', color: '#DC2626', advice: '⚠️ قراءة غير آمنة! توجه إلى الطوارئ فوراً أو اطلب الإسعاف.' };
    };

    const bpEval = getBPEvaluation();
    const glucoseEval = getGlucoseEvaluation();
    const oxyEval = getOxygenEvaluation();

    const consultWithAI = (summaryText: string) => {
        const prompt = `لقد قمت بإجراء فحص حيوي منزلي وظهرت القراءة كالتالي:\n"${summaryText}"\nما هي النصائح والتوجيهات الطبية المناسبة؟`;
        navigation.navigate('ChatAI', { initialPrompt: prompt });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={colors.surface}
                translucent={false}
            />

            {/* Header */}
            <ScreenHeader
                title={i18n.language === 'en' ? 'Medical Devices Guide' : i18n.language === 'tr' ? 'Tıbbi Cihazlar Rehberi' : 'دليل الأجهزة الطبية المصور'}
                subtitle={i18n.language === 'en' ? 'Visual guides & clinical calculator' : i18n.language === 'tr' ? 'Görsel rehberler ve klinik hesaplayıcı' : 'شروحات مصورة وحاسبة سريرية'}
            />

            {/* Tabs */}
            <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'guide' && [styles.tabButtonActive, { borderBottomColor: '#4F46E5' }]]}
                    onPress={() => setActiveTab('guide')}
                >
                    <Ionicons
                        name="images-outline"
                        size={18}
                        color={activeTab === 'guide' ? '#4F46E5' : colors.textSecondary}
                    />
                    <Text style={[styles.tabText, { color: activeTab === 'guide' ? '#4F46E5' : colors.textSecondary }]}>
                        الشرح المصور والفيديو 🎬
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'calculator' && [styles.tabButtonActive, { borderBottomColor: '#4F46E5' }]]}
                    onPress={() => setActiveTab('calculator')}
                >
                    <Ionicons
                        name="calculator-outline"
                        size={18}
                        color={activeTab === 'calculator' ? '#4F46E5' : colors.textSecondary}
                    />
                    <Text style={[styles.tabText, { color: activeTab === 'calculator' ? '#4F46E5' : colors.textSecondary }]}>
                        حاسبة القراءات الذكية 🧮
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'guide' ? (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Device Selector Chips */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.deviceChipsScroll}
                    >
                        {DEVICES.map(device => {
                            const isSelected = selectedDevice.id === device.id;
                            return (
                                <TouchableOpacity
                                    key={device.id}
                                    style={[
                                        styles.deviceChip,
                                        {
                                            backgroundColor: isSelected
                                                ? device.color
                                                : isDarkMode ? '#1E293B' : '#FFFFFF',
                                            borderColor: isSelected ? device.color : (isDarkMode ? '#334155' : '#E2E8F0'),
                                        }
                                    ]}
                                    onPress={() => setSelectedDevice(device)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons
                                        name={device.icon as any}
                                        size={20}
                                        color={isSelected ? '#fff' : device.color}
                                    />
                                    <Text
                                        style={[
                                            styles.deviceChipText,
                                            { color: isSelected ? '#fff' : colors.text }
                                        ]}
                                    >
                                        {device.title.split(' ')[0]} {device.title.split(' ')[1]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Main Card with Image and Video */}
                    <View style={[styles.mainCard, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                        {/* 1. الصورة التوضيحية عالية الجودة للجهاز (Device Hero Image) */}
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: selectedDevice.imageUrl }}
                                style={styles.heroImage}
                                resizeMode="cover"
                                onLoadStart={() => setImageLoading(true)}
                                onLoadEnd={() => setImageLoading(false)}
                            />
                            {imageLoading && (
                                <View style={styles.imageLoadingOverlay}>
                                    <ActivityIndicator size="small" color="#fff" />
                                </View>
                            )}
                            <View style={[styles.imageTagBadge, { backgroundColor: selectedDevice.color }]}>
                                <Ionicons name="camera" size={14} color="#fff" style={{ marginRight: 4 }} />
                                <Text style={styles.imageTagText}>صورة الفحص السريري المعتمد</Text>
                            </View>
                        </View>

                        {/* Device Titles */}
                        <View style={styles.cardHeaderRow}>
                            <View style={[styles.deviceIconBox, { backgroundColor: selectedDevice.color + '18' }]}>
                                <Ionicons name={selectedDevice.icon as any} size={28} color={selectedDevice.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>
                                    {selectedDevice.title}
                                </Text>
                                <Text style={[styles.cardEnglishTitle, { color: colors.textSecondary }]}>
                                    {selectedDevice.englishTitle}
                                </Text>
                            </View>
                        </View>

                        <Text style={[styles.cardSummary, { color: colors.textSecondary }]}>
                            {selectedDevice.summary}
                        </Text>

                        {/* 2. بطاقة الفيديو التعليمي التفاعلي (Video Tutorial Showcase Card) */}
                        <TouchableOpacity
                            style={styles.videoCard}
                            onPress={() => openVideoTutorial(selectedDevice.videoUrl)}
                            activeOpacity={0.88}
                        >
                            <View style={styles.videoCardBackground}>
                                <View style={styles.playIconCircle}>
                                    <Ionicons name="play" size={24} color="#FFFFFF" style={{ marginLeft: 3 }} />
                                </View>
                                <View style={styles.videoInfo}>
                                    <View style={styles.videoBadgeRow}>
                                        <View style={styles.youtubeBadge}>
                                            <Ionicons name="logo-youtube" size={14} color="#EF4444" />
                                            <Text style={styles.youtubeBadgeText}>فيديو تدريبي عملي</Text>
                                        </View>
                                        <Text style={styles.videoDurationText}>⏱️ {selectedDevice.videoDuration}</Text>
                                    </View>
                                    <Text style={styles.videoTitleText} numberOfLines={2}>
                                        {selectedDevice.videoTitle}
                                    </Text>
                                    <Text style={styles.videoSourceText}>
                                        المصدر المعتمد: {selectedDevice.videoSource}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.videoCardFooter}>
                                <Text style={styles.videoCardFooterText}>
                                    اضغط هنا لتشغيل الشرح بالفيديو الآن 🎬
                                </Text>
                                <Ionicons name="arrow-forward" size={16} color="#fff" />
                            </View>
                        </TouchableOpacity>

                        {/* Normal Range Banner */}
                        <View style={[styles.normalRangeBox, { backgroundColor: isDarkMode ? '#0F2A28' : '#F0FDF4', borderColor: '#22C55E' }]}>
                            <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
                            <Text style={styles.normalRangeText}>
                                {selectedDevice.normalRanges}
                            </Text>
                        </View>

                        {/* Step 1: Preparation */}
                        <View style={styles.sectionBlock}>
                            <View style={styles.sectionHeaderLine}>
                                <Ionicons name="time" size={18} color="#4F46E5" />
                                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                                    1. شروط الاستعداد قبل الفحص:
                                </Text>
                            </View>
                            {selectedDevice.preparation.map((prep, pIdx) => (
                                <View key={pIdx} style={styles.listItemRow}>
                                    <View style={[styles.bulletPoint, { backgroundColor: '#4F46E5' }]} />
                                    <Text style={[styles.listItemText, { color: colors.text }]}>{prep}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Step 2: Accurate Usage Steps */}
                        <View style={styles.sectionBlock}>
                            <View style={styles.sectionHeaderLine}>
                                <Ionicons name="checkmark-done-circle" size={18} color="#10B981" />
                                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                                    2. خطوات الاستخدام الصحيحة خطوة بخطوة:
                                </Text>
                            </View>
                            {selectedDevice.steps.map((step, sIdx) => (
                                <View key={sIdx} style={styles.stepCardRow}>
                                    <View style={[styles.stepNumberCircle, { backgroundColor: selectedDevice.color }]}>
                                        <Text style={styles.stepNumberText}>{sIdx + 1}</Text>
                                    </View>
                                    <Text style={[styles.stepContentText, { color: colors.text }]}>{step}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Step 3: Common Mistakes */}
                        <View style={styles.sectionBlock}>
                            <View style={styles.sectionHeaderLine}>
                                <Ionicons name="warning" size={18} color="#EF4444" />
                                <Text style={[styles.sectionHeading, { color: '#EF4444' }]}>
                                    3. أخطاء شائعة تؤدي لنتائج غير دقيقة:
                                </Text>
                            </View>
                            {selectedDevice.commonMistakes.map((mistake, mIdx) => (
                                <View key={mIdx} style={styles.mistakeRow}>
                                    <Ionicons name="close-circle" size={16} color="#EF4444" style={{ marginTop: 2 }} />
                                    <Text style={[styles.mistakeText, { color: colors.textSecondary }]}>{mistake}</Text>
                                </View>
                            ))}
                        </View>

                        {/* CTA Button to Chat Doctor */}
                        <TouchableOpacity
                            style={[styles.askDoctorBtn, { backgroundColor: selectedDevice.color }]}
                            onPress={() => {
                                const prompt = `أريد استشارتك الطبية بخصوص استخدام ${selectedDevice.title}. ما هي النصائح الأهم للحصول على أدق نتيجة؟`;
                                navigation.navigate('ChatAI', { initialPrompt: prompt });
                            }}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="chatbubbles" size={20} color="#fff" />
                            <Text style={styles.askDoctorBtnText}>
                                اسأل المساعد الطبي حول هذا الجهاز 💬
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            ) : (
                /* Live Calculator & Vitals Interpreter */
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* BP Interpreter */}
                    <View style={[styles.calculatorCard, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                        <View style={styles.calcHeaderRow}>
                            <Ionicons name="heart" size={24} color="#EF4444" />
                            <Text style={[styles.calcCardTitle, { color: colors.text }]}>
                                فاحص ومفسر ضغط الدم (Blood Pressure)
                            </Text>
                        </View>
                        <Text style={[styles.calcSub, { color: colors.textSecondary }]}>
                            أدخل قراءة الضغط الانقباضي والانبساطي للحصول على تقييم سريري فوري:
                        </Text>

                        {/* Spectrum Visual Bar */}
                        <View style={styles.spectrumBar}>
                            <View style={[styles.spectrumSegment, { backgroundColor: '#10B981' }]} />
                            <View style={[styles.spectrumSegment, { backgroundColor: '#EAB308' }]} />
                            <View style={[styles.spectrumSegment, { backgroundColor: '#F59E0B' }]} />
                            <View style={[styles.spectrumSegment, { backgroundColor: '#EF4444' }]} />
                            <View style={[styles.spectrumSegment, { backgroundColor: '#DC2626' }]} />
                        </View>
                        <View style={styles.spectrumLabels}>
                            <Text style={styles.spectrumLabelText}>طبيعي</Text>
                            <Text style={styles.spectrumLabelText}>مرتفع</Text>
                            <Text style={styles.spectrumLabelText}>حرج</Text>
                        </View>

                        <View style={styles.twoInputsRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>العلوي (الانقباضي Systolic):</Text>
                                <TextInput
                                    style={[styles.numericInput, { color: colors.text, borderColor: isDarkMode ? '#334155' : '#E2E8F0', backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}
                                    placeholder="مثال: 120"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                    value={systolic}
                                    onChangeText={setSystolic}
                                    maxLength={3}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>السفلي (الانبساطي Diastolic):</Text>
                                <TextInput
                                    style={[styles.numericInput, { color: colors.text, borderColor: isDarkMode ? '#334155' : '#E2E8F0', backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}
                                    placeholder="مثال: 80"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                    value={diastolic}
                                    onChangeText={setDiastolic}
                                    maxLength={3}
                                />
                            </View>
                        </View>

                        {bpEval && (
                            <View style={[styles.evaluationBox, { backgroundColor: bpEval.bg, borderColor: bpEval.color }]}>
                                <Text style={[styles.evalStatusText, { color: bpEval.color }]}>
                                    {bpEval.status}
                                </Text>
                                <Text style={[styles.evalAdviceText, { color: colors.text }]}>
                                    {bpEval.advice}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.evalChatButton, { backgroundColor: bpEval.color }]}
                                    onPress={() => consultWithAI(`قراءة ضغط دمي هي ${systolic}/${diastolic} مم زئبق، وتقييمها: ${bpEval.status}.`)}
                                >
                                    <Text style={styles.evalChatButtonText}>ناقش هذه القراءة مع الطبيب الذكي 🩺</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Blood Glucose Interpreter */}
                    <View style={[styles.calculatorCard, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                        <View style={styles.calcHeaderRow}>
                            <Ionicons name="water" size={24} color="#F59E0B" />
                            <Text style={[styles.calcCardTitle, { color: colors.text }]}>
                                مفسر سكر الدم (Glucose Interpreter)
                            </Text>
                        </View>
                        <Text style={[styles.calcSub, { color: colors.textSecondary }]}>
                            اختر حالة القياس وأدخل النتيجة بوحدة mg/dL:
                        </Text>

                        <View style={styles.toggleRow}>
                            <TouchableOpacity
                                style={[styles.toggleBtn, glucoseState === 'fasting' && styles.toggleBtnActive]}
                                onPress={() => setGlucoseState('fasting')}
                            >
                                <Text style={[styles.toggleBtnText, glucoseState === 'fasting' && styles.toggleBtnTextActive]}>
                                    فحص صائم (8 ساعات)
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.toggleBtn, glucoseState === 'postprandial' && styles.toggleBtnActive]}
                                onPress={() => setGlucoseState('postprandial')}
                            >
                                <Text style={[styles.toggleBtnText, glucoseState === 'postprandial' && styles.toggleBtnTextActive]}>
                                    بعد الأكل بساعتين
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={[styles.numericInput, { color: colors.text, borderColor: isDarkMode ? '#334155' : '#E2E8F0', backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}
                            placeholder="أدخل قراءة السكر (مثلاً: 110)"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="numeric"
                            value={glucose}
                            onChangeText={setGlucose}
                            maxLength={3}
                        />

                        {glucoseEval && (
                            <View style={[styles.evaluationBox, { backgroundColor: glucoseEval.color + '15', borderColor: glucoseEval.color }]}>
                                <Text style={[styles.evalStatusText, { color: glucoseEval.color }]}>
                                    {glucoseEval.status}
                                </Text>
                                <Text style={[styles.evalAdviceText, { color: colors.text }]}>
                                    {glucoseEval.advice}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.evalChatButton, { backgroundColor: glucoseEval.color }]}
                                    onPress={() => consultWithAI(`قراءة سكر دمي (${glucoseState === 'fasting' ? 'صائم' : 'بعد الأكل'}) هي ${glucose} mg/dL، وتقييمها: ${glucoseEval.status}.`)}
                                >
                                    <Text style={styles.evalChatButtonText}>ناقش قراءة السكر مع الطبيب الذكي 🩺</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Oxygen Interpreter */}
                    <View style={[styles.calculatorCard, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                        <View style={styles.calcHeaderRow}>
                            <Ionicons name="speedometer" size={24} color="#06B6D4" />
                            <Text style={[styles.calcCardTitle, { color: colors.text }]}>
                                مفسر أكسجين الدم (SpO2)
                            </Text>
                        </View>
                        <Text style={[styles.calcSub, { color: colors.textSecondary }]}>
                            أدخل نسبة الأكسجين المئوية الظاهرة على جهازك:
                        </Text>

                        <TextInput
                            style={[styles.numericInput, { color: colors.text, borderColor: isDarkMode ? '#334155' : '#E2E8F0', backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' }]}
                            placeholder="مثال: 98%"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="numeric"
                            value={oxygen}
                            onChangeText={setOxygen}
                            maxLength={3}
                        />

                        {oxyEval && (
                            <View style={[styles.evaluationBox, { backgroundColor: oxyEval.color + '15', borderColor: oxyEval.color }]}>
                                <Text style={[styles.evalStatusText, { color: oxyEval.color }]}>
                                    {oxyEval.status}
                                </Text>
                                <Text style={[styles.evalAdviceText, { color: colors.text }]}>
                                    {oxyEval.advice}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.evalChatButton, { backgroundColor: oxyEval.color }]}
                                    onPress={() => consultWithAI(`نسبة الأكسجين لدي هي ${oxygen}%، والتقييم: ${oxyEval.status}.`)}
                                >
                                    <Text style={styles.evalChatButtonText}>ناقش نسبة الأكسجين مع الطبيب الذكي 🩺</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    headerSubtitle: {
        fontSize: 11,
        marginTop: 2,
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderBottomWidth: 2.5,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomWidth: 2.5,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
    },
    content: {
        padding: 16,
        paddingBottom: 30,
    },
    deviceChipsScroll: {
        gap: 8,
        paddingBottom: 14,
    },
    deviceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    deviceChipText: {
        fontSize: 12.5,
        fontWeight: '700',
    },
    mainCard: {
        borderRadius: 20,
        borderWidth: 1.5,
        padding: 18,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    imageContainer: {
        width: '100%',
        height: 190,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        position: 'relative',
        backgroundColor: '#0F172A',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    imageLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageTagBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    imageTagText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    videoCard: {
        borderRadius: 16,
        backgroundColor: '#1E1B4B',
        overflow: 'hidden',
        marginBottom: 18,
        borderWidth: 1.5,
        borderColor: '#4338CA',
        shadowColor: '#4338CA',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    videoCardBackground: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    playIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#EF4444',
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
    videoInfo: {
        flex: 1,
    },
    videoBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    youtubeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    youtubeBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    videoDurationText: {
        color: '#A5B4FC',
        fontSize: 11,
        fontWeight: '600',
    },
    videoTitleText: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700',
        lineHeight: 18,
        marginBottom: 2,
    },
    videoSourceText: {
        color: '#94A3B8',
        fontSize: 11,
    },
    videoCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#3730A3',
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    videoCardFooterText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    deviceIconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16.5,
        fontWeight: '800',
    },
    cardEnglishTitle: {
        fontSize: 11.5,
        marginTop: 2,
    },
    cardSummary: {
        fontSize: 13.5,
        lineHeight: 21,
        marginBottom: 14,
    },
    normalRangeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 18,
    },
    normalRangeText: {
        flex: 1,
        fontSize: 13,
        color: '#16A34A',
        fontWeight: '700',
    },
    sectionBlock: {
        marginBottom: 18,
    },
    sectionHeaderLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    sectionHeading: {
        fontSize: 14.5,
        fontWeight: '800',
    },
    listItemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 8,
        paddingRight: 6,
    },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 7,
    },
    listItemText: {
        flex: 1,
        fontSize: 13.5,
        lineHeight: 21,
    },
    stepCardRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 10,
        paddingRight: 4,
    },
    stepNumberCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    stepNumberText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },
    stepContentText: {
        flex: 1,
        fontSize: 13.5,
        lineHeight: 21,
        fontWeight: '500',
    },
    mistakeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 6,
        paddingRight: 6,
    },
    mistakeText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
    },
    askDoctorBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 16,
        marginTop: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    askDoctorBtnText: {
        color: '#fff',
        fontSize: 14.5,
        fontWeight: '700',
    },
    calculatorCard: {
        borderRadius: 20,
        borderWidth: 1.5,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    calcHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    calcCardTitle: {
        fontSize: 15.5,
        fontWeight: '800',
    },
    calcSub: {
        fontSize: 12.5,
        marginBottom: 10,
        lineHeight: 18,
    },
    spectrumBar: {
        flexDirection: 'row',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 4,
    },
    spectrumSegment: {
        flex: 1,
    },
    spectrumLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    spectrumLabelText: {
        fontSize: 10.5,
        color: '#94A3B8',
        fontWeight: '600',
    },
    twoInputsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    numericInput: {
        height: 48,
        borderRadius: 14,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 12,
    },
    toggleRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(148, 163, 184, 0.15)',
        alignItems: 'center',
    },
    toggleBtnActive: {
        backgroundColor: '#F59E0B',
    },
    toggleBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    toggleBtnTextActive: {
        color: '#fff',
    },
    evaluationBox: {
        padding: 14,
        borderRadius: 16,
        borderWidth: 1.5,
        marginTop: 6,
    },
    evalStatusText: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 4,
    },
    evalAdviceText: {
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 12,
    },
    evalChatButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    evalChatButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
});

export default MedicalDevicesGuideScreen;
