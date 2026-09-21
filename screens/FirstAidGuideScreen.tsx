import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';

interface ProtocolStep {
    stepNum: number;
    title: string;
    description: string;
}

interface FirstAidProtocol {
    id: string;
    category: 'cpr' | 'choking' | 'bleeding' | 'burns' | 'fractures' | 'stroke' | 'seizure';
    icon: string;
    title: { ar: string; en: string; tr: string };
    subtitle: { ar: string; en: string; tr: string };
    steps: {
        ar: ProtocolStep[];
        en: ProtocolStep[];
        tr: ProtocolStep[];
    };
    dos: { ar: string[]; en: string[]; tr: string[] };
    donts: { ar: string[]; en: string[]; tr: string[] };
}

const PROTOCOLS: FirstAidProtocol[] = [
    {
        id: 'cpr',
        category: 'cpr',
        icon: 'heart-pulse',
        title: {
            ar: 'الإنعاش القلبي الرئوي (CPR)',
            en: 'Cardiopulmonary Resuscitation (CPR)',
            tr: 'Kalp Masajı ve Suni Solunum (CPR)',
        },
        subtitle: {
            ar: 'للبالغين فاقدي الوعي وبدون تنفس طبيعي',
            en: 'For unresponsive adults without normal breathing',
            tr: 'Bilinçsiz ve nefes almayan yetişkinler için',
        },
        steps: {
            ar: [
                { stepNum: 1, title: 'تحقق من الأمان والاستجابة', description: 'تأكد من أمان المكان، واهتز كتفي المصاب وناده بصوت عالٍ: هل أنت بخير؟' },
                { stepNum: 2, title: 'اطلب الطوارئ 112 فوراً', description: 'اطلب من شخص محدد الاتصال بالإسعاف وإحضار جهاز مزيل الرجفان (AED) إن وجد.' },
                { stepNum: 3, title: 'ابدأ الضغطات الصدرية', description: 'ضع كعبي يديك متشابكتين وسط الصدر بين الحلمتين. اضغط بقوة وسرعة (عمق 5-6 سم، معدل 100-120 ضغطة بالدقيقة).' },
                { stepNum: 4, title: 'النسبة الذهبية: 30 ضغطة ثم نَفَسان', description: 'أمل الرأس للخلف وارفع الذقن، وأعطِ نفسين إنقاذيين سريعين ثم عُد للضغط فوراً.' },
            ],
            en: [
                { stepNum: 1, title: 'Check Scene Safety & Response', description: 'Ensure the environment is safe. Tap shoulders and ask loudly: Are you okay?' },
                { stepNum: 2, title: 'Call Emergency 112 Immediately', description: 'Instruct someone specifically to call 112 and retrieve an automated defibrillator (AED).' },
                { stepNum: 3, title: 'Begin High-Quality Compressions', description: 'Interlock hands in the center of the chest. Push hard and fast (5-6 cm deep at 100-120 BPM).' },
                { stepNum: 4, title: '30 Compressions to 2 Rescue Breaths', description: 'Tilt head back, lift chin, deliver 2 gentle breaths, and immediately resume compressions.' },
            ],
            tr: [
                { stepNum: 1, title: 'Çevre Güvenliğini ve Bilinci Kontrol Edin', description: 'Ortamın güvenli olduğundan emin olun, omuzlarından sarsıp iyi misiniz diye seslenin.' },
                { stepNum: 2, title: 'Derhal 112 Acil Servisi Arayın', description: 'Birine 112\'yi aramasını ve varsa elektroşok cihazı (OED) getirmesini söyleyin.' },
                { stepNum: 3, title: 'Göğüs Basısına Başlayın', description: 'İki elinizi göğüs kafesinin ortasına kenetleyin. 5-6 cm derinlikte, dakikada 100-120 hızla bastırın.' },
                { stepNum: 4, title: '30 Kalp Masajı : 2 Suni Solunum', description: 'Baş-çene pozisyonu vererek 2 kurtarıcı soluk verin ve hemen masaja devam edin.' },
            ],
        },
        dos: {
            ar: ['دع الصدر يرتد بالكامل بعد كل ضغطة', 'استمر حتى وصول الإسعاف أو استعادة التنفس الطبيعي'],
            en: ['Allow full chest recoil between compressions', 'Continue CPR until emergency responders arrive or normal breathing resumes'],
            tr: ['Her basıdan sonra göğsün tamamen eski haline dönmesine izin verin', 'Sağlık personeli gelene kadar kesintisiz devam edin'],
        },
        donts: {
            ar: ['لا تتوقف عن الضغطات لأكثر من 10 ثوانٍ', 'لا تتردد؛ فالضغط البسيط أفضل من عدم التدخل'],
            en: ['Do not interrupt compressions for more than 10 seconds', 'Do not hesitate; bystander CPR multiplies survival chances'],
            tr: ['Göğüs masajına 10 saniyeden uzun ara vermeyin', 'Tereddüt etmeyin; yapılan ilk müdahale hayat kurtarır'],
        },
    },
    {
        id: 'choking',
        category: 'choking',
        icon: 'hand-left',
        title: {
            ar: 'الغصة والاختناق (مناورة هيمليك)',
            en: 'Severe Choking (Heimlich Maneuver)',
            tr: 'Boğulma ve Tıkanma (Heimlich Manevrası)',
        },
        subtitle: {
            ar: 'عند انسداد مجرى الهواء وعدم القدرة على التحدث أو السعال',
            en: 'When the airway is obstructed and patient cannot speak or cough',
            tr: 'Hava yolu tıkandığında, konuşma veya öksürme olmadığında',
        },
        steps: {
            ar: [
                { stepNum: 1, title: 'التحقق من الانسداد', description: 'إذا كان المصاب يمسك عنقه ولا يستطيع التنفس أو الكلام، تدخل فوراً.' },
                { stepNum: 2, title: '5 ضربات على الظهر', description: 'انحنِ بالمصاب للأمام، واضربه 5 ضربات بكعب يدك بقوة بين لوحي الكتف.' },
                { stepNum: 3, title: '5 ضغطات بطنية (هيمليك)', description: 'قف خلف المصاب، لف ذراعيك حول خصره، ضع قبضة يدك فوق السرة مباشرة وادفع للداخل والأعلى بقوة.' },
                { stepNum: 4, title: 'كرر التناوب', description: 'كرر 5 ضربات ظهر ثم 5 ضغطات بطنية حتى خروج الجسم الغريب أو فقدان الوعي (ابدأ CPR إذا فقد وعيه).' },
            ],
            en: [
                { stepNum: 1, title: 'Recognize Signs', description: 'The patient clutches their neck and cannot breathe, cough, or talk.' },
                { stepNum: 2, title: '5 Firm Back Blows', description: 'Lean the person forward and deliver 5 firm blows with the heel of your hand between shoulder blades.' },
                { stepNum: 3, title: '5 Abdominal Thrusts (Heimlich)', description: 'Stand behind, wrap arms around waist, place fist just above navel, and thrust inward and upward.' },
                { stepNum: 4, title: 'Repeat Cycle', description: 'Alternate 5 back blows and 5 abdominal thrusts until object is expelled or patient becomes unresponsive.' },
            ],
            tr: [
                { stepNum: 1, title: 'Tıkanmayı Tanıyın', description: 'Kişi ellerini boynuna götürüyor, nefes alamıyor ve konuşamıyorsa hemen müdahale edin.' },
                { stepNum: 2, title: '5 Sırt Vuruşu', description: 'Kişiyi öne eğin, kürek kemiklerinin arasına el ayanızla 5 kez kuvvetlice vurun.' },
                { stepNum: 3, title: '5 Karın Basısı (Heimlich)', description: 'Arkasından sarılın, göbek deliğinin hemen üstüne yumruğunuzu koyup içeri ve yukarı doğru bastırın.' },
                { stepNum: 4, title: 'Dönüşümlü Devam Edin', description: 'Cisim çıkana kadar 5 sırt vuruşu ve 5 karın basısına sırayla devam edin.' },
            ],
        },
        dos: {
            ar: ['شجع المصاب على السعال إن كان قادراً عليه', 'اتصل بالإسعاف 112 إذا لم يخرج الجسم سريعاً'],
            en: ['Encourage coughing if the patient can still make sounds', 'Call 112 immediately if obstruction persists'],
            tr: ['Öksürebiliyorsa öksürmeye teşvik edin', 'Tıkanıklık geçmezse derhal 112\'yi arayın'],
        },
        donts: {
            ar: ['لا تضع أصابعك عشوائياً في الحلق إلا إذا رأيت الجسم الغريب بوضوح', 'لا تقم بضغطات بطنية للرضع أقل من عام (استخدم ضربات الظهر والصدر)'],
            en: ['Do not perform blind finger sweeps in the mouth', 'Do not use abdominal thrusts on infants under 1 year (use back slaps & chest thrusts)'],
            tr: ['Ağız içinde görmediğiniz cismi körlemesine parmakla aramayın', '1 yaş altı bebeklerde karın basısı uygulamayın'],
        },
    },
    {
        id: 'bleeding',
        category: 'bleeding',
        icon: 'water',
        title: {
            ar: 'إيقاف النزيف الشديد',
            en: 'Severe Bleeding Control',
            tr: 'Şiddetli Kanamayı Durdurma',
        },
        subtitle: {
            ar: 'السيطرة على الجروح النازفة ومنع الصدمة النزفية',
            en: 'Controlling major hemorrhages and preventing hypovolemic shock',
            tr: 'Büyük damar kanamalarını kontrol altına alma ve şoku önleme',
        },
        steps: {
            ar: [
                { stepNum: 1, title: 'الضغط المباشر المستمر', description: 'ضع شاشاً معقماً أو قماشاً نظيفاً واضغط بقوة بكلتا يديك مباشرة فوق الجرح.' },
                { stepNum: 2, title: 'الحفاظ على الضغط والتضميد', description: 'اربط ضمادة ضاغطة بإحكام. إذا تشربت الدماء لا تنزعها، بل ضع طبقة ثانية فوقها.' },
                { stepNum: 3, title: 'رفع العضو المصاب', description: 'ارفع الطرف المصاب أعلى من مستوى القلب إن لم يكن هناك كسر مشتبه به.' },
                { stepNum: 4, title: 'تدفئة المصاب', description: 'غطِّ المصاب ببطانية لمنع انخفاض حرارة الجسم ومكافحة الصدمة، واطلب الإسعاف 112.' },
            ],
            en: [
                { stepNum: 1, title: 'Apply Firm Direct Pressure', description: 'Place sterile gauze or clean cloth directly onto the bleeding site and press down with both hands.' },
                { stepNum: 2, title: 'Secure with Pressure Bandage', description: 'Wrap tightly. If blood bleeds through, do NOT remove initial layer; add more dressing on top.' },
                { stepNum: 3, title: 'Elevate if Possible', description: 'Elevate the bleeding limb above heart level unless a fracture is suspected.' },
                { stepNum: 4, title: 'Keep Warm & Treat for Shock', description: 'Keep patient lying flat and warm with a blanket, and ensure 112 is called.' },
            ],
            tr: [
                { stepNum: 1, title: 'Yaranın Üzerine Doğrudan Baskı', description: 'Temiz bir bez veya gazlı bezle kanayan yerin üzerine iki elinizle sıkıca bastırın.' },
                { stepNum: 2, title: 'Baskılı Sargı Uygulayın', description: 'Sargı beziyle sarın. Kan bezi aşarsa ilk bezi kaldırmayın, üzerine yenisini ekleyin.' },
                { stepNum: 3, title: 'Uzvu Kalp Seviyesinden Yukarı Kaldırın', description: 'Kırık şüphesi yoksa kanayan kol veya bacağı kalp seviyesinin üzerine kaldırın.' },
                { stepNum: 4, title: 'Şoka Karşı Sıcak Tutun', description: 'Hastayı düz yatırın, battaniyeyle örtün ve 112\'yi arayın.' },
            ],
        },
        dos: {
            ar: ['استخدم قفازات طبية واقية إن أمكن', 'حافظ على هدوء المصاب واستلقائه مستوياً'],
            en: ['Wear protective gloves if available', 'Keep the victim calm, lying down, and resting'],
            tr: ['Varsa koruyucu eldiven kullanın', 'Yaralıyı sakin tutup sırtüstü yatırın'],
        },
        donts: {
            ar: ['لا تنزع الشاش الأول المشبع بالدم لتفادي إزالة الجلطة المتكونة', 'لا تنزع الأجسام المنغرزة داخل الجرح (ثبتها في مكانها)'],
            en: ['Do not lift the initial bandage to peek (it disrupts clotting)', 'Never remove impaled objects; stabilize them in place'],
            tr: ['Pıhtılaşmayı bozmamak için ilk konulan bezi asla kaldırmayın', 'Yaraya saplanmış yabancı cisimleri kesinlikle çıkarmayın'],
        },
    },
    {
        id: 'burns',
        category: 'burns',
        icon: 'flame',
        title: {
            ar: 'إسعاف الحروق',
            en: 'Burn Management & Care',
            tr: 'Yanık İlkyardımı',
        },
        subtitle: {
            ar: 'تبريد الحرق وحماية الأنسجة من التلف والعدوى',
            en: 'Cooling tissues safely and preventing severe infection',
            tr: 'Yanığı doğru soğutma ve enfeksiyondan koruma',
        },
        steps: {
            ar: [
                { stepNum: 1, title: 'التبريد الفوري بالماء الجاري', description: 'ضع منطقة الحرق تحت ماء صنبور فاتر أو بارد (وليس مثلجاً) لمدة 15 إلى 20 دقيقة كاملة.' },
                { stepNum: 2, title: 'نزع الإكسسوارات مبكراً', description: 'انزع الخواتم والأساور والملابس الضيقة برفق قبل حدوث التورم.' },
                { stepNum: 3, title: 'التغطية بشاش رطب ومعقم', description: 'غطِّ الحرق بضمادة معقمة غير لاصقة أو غلاف بلاستيكي نظيف (نايلون طعام) لحمايته من الهواء.' },
                { stepNum: 4, title: 'تقييم الحاجة للطوارئ', description: 'اطلب الإسعاف 112 إذا كان الحرق كبيراً (أكبر من كف اليد) أو في الوجه أو اليدين أو ناتجاً عن كهرباء.' },
            ],
            en: [
                { stepNum: 1, title: 'Cool Immediately with Running Water', description: 'Hold burn under cool running tap water (not ice water) for at least 15-20 full minutes.' },
                { stepNum: 2, title: 'Gently Remove Constricting Items', description: 'Remove rings, watches, and tight clothing before swelling begins.' },
                { stepNum: 3, title: 'Cover Loosely with Clean Shield', description: 'Use sterile non-stick dressing or clean plastic cling wrap to protect nerve endings from air.' },
                { stepNum: 4, title: 'Seek Emergency Care for Serious Burns', description: 'Call 112 if burn is larger than patient\'s palm, involves face/joints, or is chemical/electrical.' },
            ],
            tr: [
                { stepNum: 1, title: 'Akan Serin Su ile Soğutun', description: 'Yanık bölgesini en az 15-20 dakika boyunca çeşme suyu altında tutun (buz kullanmayın).' },
                { stepNum: 2, title: 'Takıları ve Dar Giysileri Çıkarın', description: 'Şişlik başlamadan önce yüzük, saat ve dar giysileri nazikçe çıkarın.' },
                { stepNum: 3, title: 'Temiz ve Nemli Bir Şekilde Örtün', description: 'Steril yapışmaz bez veya temiz streç film ile yanığı gevşekçe kapatın.' },
                { stepNum: 4, title: 'Gerekirse 112\'yi Arayın', description: 'Avuç içinden büyükse, yüz veya eklemlerdeyse derhal hastaneye başvurun.' },
            ],
        },
        dos: {
            ar: ['استخدم ماء الصنبور الجاري فوراً', 'حافظ على نظافة المنطقة المحروقة'],
            en: ['Cool promptly with tap water', 'Keep the wound clean and protected'],
            tr: ['Derhal akan su altında soğutun', 'Yanık alanını temiz tutun'],
        },
        donts: {
            ar: ['ممنوع وضع الثلج نهائياً (يدمر الأنسجة ويسبب عضة صقيع)', 'ممنوع وضع معجون الأسنان أو الزبدة أو الزيوت', 'لا تفتح أو تفقأ الفقاعات المائية المتكونة'],
            en: ['NEVER apply direct ice (it causes tissue necrosis)', 'Do NOT apply toothpaste, butter, oils, or home remedies', 'Do NOT burst or prick blisters'],
            tr: ['Asla buz koymayın (doku hasarını artırır)', 'Asla diş macunu, yoğurt veya yağ sürmeyin', 'Oluşan su kabarcıklarını patlatmayın'],
        },
    },
    {
        id: 'stroke',
        category: 'stroke',
        icon: 'speedometer',
        title: {
            ar: 'السكتة الدماغية (اختبار FAST السريع)',
            en: 'Acute Stroke (FAST Protocol)',
            tr: 'İnme Belirtileri (FAST Testi)',
        },
        subtitle: {
            ar: 'كل دقيقة تنقذ ملايين الخلايا الدماغية',
            en: 'Time is brain: Every minute saves millions of neurons',
            tr: 'Zaman beyindir: Her saniye milyonlarca hücreyi kurtarır',
        },
        steps: {
            ar: [
                { stepNum: 1, title: 'F - الوجه (Face)', description: 'اطلب من المصاب أن يبتسم. هل يتدلى أحد جانبي الوجه أو الفم؟' },
                { stepNum: 2, title: 'A - الذراعان (Arms)', description: 'اطلب منه رفع كلتا ذراعيه. هل تسقط إحدى الذراعين لأسفل ولا يستطيع تثبيتها؟' },
                { stepNum: 3, title: 'S - الكلام (Speech)', description: 'اطلب منه تكرار جملة بسيطة. هل كلامه ثقيل أو غير مفهوم أو يجد صعوبة في الفهم؟' },
                { stepNum: 4, title: 'T - الوقت (Time) والاتصال فوراً', description: 'إذا ظهرت أي علامة من هذه العلامات، اتصل بالإسعاف 112 فوراً وسجل وقت ظهور أول عرض بدقة.' },
            ],
            en: [
                { stepNum: 1, title: 'F - Face Drooping', description: 'Ask the person to smile. Does one side of the face or mouth droop?' },
                { stepNum: 2, title: 'A - Arm Weakness', description: 'Ask them to raise both arms. Does one arm drift downward or feel numb?' },
                { stepNum: 3, title: 'S - Speech Difficulty', description: 'Ask them to repeat a simple sentence. Is their speech slurred or strange?' },
                { stepNum: 4, title: 'T - Time to Call 112', description: 'If you observe any of these signs, call 112 right away and note the exact time symptoms started.' },
            ],
            tr: [
                { stepNum: 1, title: 'F - Yüz (Face)', description: 'Gülümsemesini isteyin. Yüzün bir tarafında sarkma veya kayma var mı?' },
                { stepNum: 2, title: 'A - Kollar (Arms)', description: 'İki kolunu birden kaldırmasını isteyin. Bir kol aşağı doğru düşüyor mu?' },
                { stepNum: 3, title: 'S - Konuşma (Speech)', description: 'Basit bir cümle söylemesini isteyin. Konuşması peltek veya anlamsız mı?' },
                { stepNum: 4, title: 'T - Zaman (Time)', description: 'Bu belirtilerden biri bile varsa hemen 112\'yi arayın ve başlama saatini kaydedin.' },
            ],
        },
        dos: {
            ar: ['سجل وقت بدء الأعراض بدقة لمساعدة أطباء الطوارئ', 'أبقِ المريض مستلقياً ورأسه مرتفع قليلاً'],
            en: ['Note exact time symptoms began', 'Keep patient lying flat with head slightly elevated'],
            tr: ['Belirtilerin başladığı tam saati not edin', 'Hastayı başı hafif yukarıda olacak şekilde yatırın'],
        },
        donts: {
            ar: ['لا تعطه أي طعام أو شراب أو أدوية (بما فيها الأسبرين قبل التأكد من نوع السكتة بالأشعة)', 'لا تنتظر لترى إن كانت الأعراض ستتحسن تلقائياً'],
            en: ['Do NOT give food, drinks, or aspirin until CT scan rules out brain hemorrhage', 'Do not delay calling emergency expecting symptoms to improve'],
            tr: ['Kesinlikle yiyecek, içecek veya aspirin vermeyin', 'Geçer diye beklemeyin, hemen 112\'yi arayın'],
        },
    },
];

const FirstAidGuideScreen = () => {
    const { i18n } = useTranslation();
    const { colors, isDarkMode } = useTheme();

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [expandedProtocol, setExpandedProtocol] = useState<string | null>('cpr');

    // Metronome State for CPR
    const [metronomeActive, setMetronomeActive] = useState<boolean>(false);
    const [beatCount, setBeatCount] = useState<number>(0);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const toggleMetronome = () => {
        if (metronomeActive) {
            stopMetronome();
        } else {
            startMetronome();
        }
    };

    const startMetronome = () => {
        setMetronomeActive(true);
        setBeatCount(0);
        // 110 beats per minute = 1 beat every ~545ms
        const bpmInterval = Math.round(60000 / 110);

        intervalRef.current = setInterval(() => {
            setBeatCount(prev => (prev >= 30 ? 1 : prev + 1));
            // Trigger visual pulse animation
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.25,
                    duration: 90,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 120,
                    useNativeDriver: true,
                }),
            ]).start();
        }, bpmInterval);
    };

    const stopMetronome = () => {
        setMetronomeActive(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const handleEmergencyCall = () => {
        Alert.alert(
            i18n.language === 'ar' ? 'اتصال الطوارئ' : i18n.language === 'tr' ? 'Acil Servis' : 'Emergency Call',
            i18n.language === 'ar' ? 'هل تود الاتصال الفوري بالإسعاف 112؟' : i18n.language === 'tr' ? '112 Acil Servis aransın mı?' : 'Call 112 Emergency Services now?',
            [
                { text: i18n.language === 'ar' ? 'إلغاء' : i18n.language === 'tr' ? 'İptal' : 'Cancel', style: 'cancel' },
                {
                    text: i18n.language === 'ar' ? 'اتصال 112' : i18n.language === 'tr' ? '112 Ara' : 'Dial 112',
                    style: 'destructive',
                    onPress: () => Linking.openURL('tel:112'),
                },
            ]
        );
    };

    const langKey = (i18n.language === 'ar' || i18n.language === 'tr') ? i18n.language : 'en';

    const categories = [
        { id: 'all', label: i18n.language === 'ar' ? 'الكل' : i18n.language === 'tr' ? 'Tümü' : 'All' },
        { id: 'cpr', label: 'CPR' },
        { id: 'choking', label: i18n.language === 'ar' ? 'الغصة' : i18n.language === 'tr' ? 'Boğulma' : 'Choking' },
        { id: 'bleeding', label: i18n.language === 'ar' ? 'النزيف' : i18n.language === 'tr' ? 'Kanama' : 'Bleeding' },
        { id: 'burns', label: i18n.language === 'ar' ? 'الحروق' : i18n.language === 'tr' ? 'Yanıklar' : 'Burns' },
        { id: 'stroke', label: 'FAST' },
    ];

    const filteredProtocols = selectedCategory === 'all'
        ? PROTOCOLS
        : PROTOCOLS.filter(p => p.category === selectedCategory);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <ScreenHeader
                title={i18n.language === 'ar' ? 'دليل الإسعافات الأولية' : i18n.language === 'tr' ? 'İlk Yardım Rehberi' : 'Emergency First Aid Guide'}
                subtitle={i18n.language === 'ar' ? 'بروتوكولات سريرية تفاعلية لإنقاذ الحياة' : i18n.language === 'tr' ? 'Hayat kurtaran etkileşimli klinik protokoller' : 'Interactive Life-Saving Protocols'}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Emergency Urgent Banner */}
                <TouchableOpacity
                    style={styles.sosBanner}
                    onPress={handleEmergencyCall}
                    activeOpacity={0.85}
                >
                    <View style={styles.sosIconCircle}>
                        <Ionicons name="call" size={20} color="#DC2626" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.sosBannerTitle}>
                            {i18n.language === 'ar' ? 'حالة طارئة مهددة للحياة؟' : i18n.language === 'tr' ? 'Hayati Acil Durum mu?' : 'Life-Threatening Emergency?'}
                        </Text>
                        <Text style={styles.sosBannerSub}>
                            {i18n.language === 'ar' ? 'اضغط هنا للاتصال الفوري بالإسعاف (112)' : i18n.language === 'tr' ? '112 Acil Servis için hemen dokunun' : 'Tap to dial 112 Emergency immediately'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Interactive CPR Metronome Widget */}
                <View style={[styles.cprCard, { backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF', borderColor: isDarkMode ? '#3730A3' : '#C7D2FE' }]}>
                    <View style={styles.cprHeaderRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cprCardTitle, { color: isDarkMode ? '#E0E7FF' : '#312E81' }]}>
                                {i18n.language === 'ar' ? 'مؤقت إيقاع الإنعاش القلبي (110 BPM)' : i18n.language === 'tr' ? 'Kalp Masajı Ritim Ölçer (110 BPM)' : 'CPR Compression Metronome (110 BPM)'}
                            </Text>
                            <Text style={[styles.cprCardSub, { color: isDarkMode ? '#A5B4FC' : '#4338CA' }]}>
                                {i18n.language === 'ar' ? 'يحافظ على وتيرة الضغطات الصحيحة لإنقاذ المصاب' : i18n.language === 'tr' ? 'Hayat kurtaran doğru masaj ritmini sağlar' : 'Helps maintain the clinically optimal compression rate'}
                            </Text>
                        </View>
                        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]}>
                            <Ionicons
                                name="heart"
                                size={24}
                                color={metronomeActive ? '#EF4444' : '#94A3B8'}
                            />
                        </Animated.View>
                    </View>

                    <View style={styles.metronomeActionRow}>
                        <TouchableOpacity
                            style={[
                                styles.metronomeBtn,
                                { backgroundColor: metronomeActive ? '#DC2626' : '#4F46E5' },
                            ]}
                            onPress={toggleMetronome}
                            activeOpacity={0.85}
                        >
                            <Ionicons
                                name={metronomeActive ? 'pause' : 'play'}
                                size={16}
                                color="#FFFFFF"
                            />
                            <Text style={styles.metronomeBtnText}>
                                {metronomeActive
                                    ? (i18n.language === 'ar' ? 'إيقاف الإيقاع' : i18n.language === 'tr' ? 'Ritmi Durdur' : 'Stop Metronome')
                                    : (i18n.language === 'ar' ? 'بدء الإيقاع التفاعلي' : i18n.language === 'tr' ? 'Ritmi Başlat' : 'Start CPR Beat')}
                            </Text>
                        </TouchableOpacity>

                        {metronomeActive && (
                            <View style={styles.beatCounterBox}>
                                <Text style={styles.beatCounterText}>
                                    {beatCount} / 30
                                </Text>
                                <Text style={styles.breathCycleText}>
                                    {beatCount === 30
                                        ? (i18n.language === 'ar' ? 'أعطِ نَفَسين!' : i18n.language === 'tr' ? '2 Soluk Ver!' : 'Give 2 Breaths!')
                                        : (i18n.language === 'ar' ? 'ضغط مستمر' : i18n.language === 'tr' ? 'Basıya devam' : 'Compressing')}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Filter Categories Horizontal */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                >
                    {categories.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryPill,
                                    {
                                        backgroundColor: isSelected
                                            ? '#4F46E5'
                                            : (isDarkMode ? '#1E293B' : '#F1F5F9'),
                                    },
                                ]}
                                onPress={() => setSelectedCategory(cat.id)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.categoryPillText,
                                        { color: isSelected ? '#FFFFFF' : colors.text },
                                    ]}
                                >
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Protocol Cards */}
                {filteredProtocols.map((protocol) => {
                    const isExpanded = expandedProtocol === protocol.id;
                    const steps = protocol.steps[langKey] || protocol.steps.en;
                    const dos = protocol.dos[langKey] || protocol.dos.en;
                    const donts = protocol.donts[langKey] || protocol.donts.en;
                    const title = protocol.title[langKey] || protocol.title.en;
                    const subtitle = protocol.subtitle[langKey] || protocol.subtitle.en;

                    return (
                        <View
                            key={protocol.id}
                            style={[
                                styles.protocolCard,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
                                },
                            ]}
                        >
                            {/* Card Header Accordion */}
                            <TouchableOpacity
                                style={styles.protocolHeader}
                                onPress={() => setExpandedProtocol(isExpanded ? null : protocol.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.protocolIconBox}>
                                    <Ionicons name={protocol.icon as any} size={22} color="#4F46E5" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.protocolTitle, { color: colors.text }]}>
                                        {title}
                                    </Text>
                                    <Text style={[styles.protocolSubtitle, { color: colors.textSecondary }]}>
                                        {subtitle}
                                    </Text>
                                </View>
                                <Ionicons
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>

                            {/* Expanded Steps */}
                            {isExpanded && (
                                <View style={styles.protocolBody}>
                                    {/* Steps list */}
                                    <View style={styles.stepsList}>
                                        {steps.map((step) => (
                                            <View key={step.stepNum} style={styles.stepItem}>
                                                <View style={styles.stepNumberBadge}>
                                                    <Text style={styles.stepNumberText}>{step.stepNum}</Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.stepTitle, { color: colors.text }]}>
                                                        {step.title}
                                                    </Text>
                                                    <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                                                        {step.description}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>

                                    {/* DOs and DON'Ts Section */}
                                    <View style={styles.dosDontsRow}>
                                        {/* DOs */}
                                        <View style={[styles.doDontBox, { backgroundColor: isDarkMode ? '#064E3B' : '#ECFDF5', borderColor: '#10B981' }]}>
                                            <View style={styles.doDontHeader}>
                                                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                                                <Text style={[styles.doDontTitle, { color: '#059669' }]}>
                                                    {i18n.language === 'ar' ? 'افعل ذلك ✅' : i18n.language === 'tr' ? 'Yapılması Gerekenler' : 'DO ✅'}
                                                </Text>
                                            </View>
                                            {dos.map((item, idx) => (
                                                <Text key={idx} style={[styles.doDontText, { color: isDarkMode ? '#A7F3D0' : '#065F46' }]}>
                                                    • {item}
                                                </Text>
                                            ))}
                                        </View>

                                        {/* DONTs */}
                                        <View style={[styles.doDontBox, { backgroundColor: isDarkMode ? '#450A0A' : '#FEF2F2', borderColor: '#EF4444' }]}>
                                            <View style={styles.doDontHeader}>
                                                <Ionicons name="close-circle" size={16} color="#DC2626" />
                                                <Text style={[styles.doDontTitle, { color: '#DC2626' }]}>
                                                    {i18n.language === 'ar' ? 'تجنب تماماً ❌' : i18n.language === 'tr' ? 'Yapılmaması Gerekenler' : 'DO NOT ❌'}
                                                </Text>
                                            </View>
                                            {donts.map((item, idx) => (
                                                <Text key={idx} style={[styles.doDontText, { color: isDarkMode ? '#FECACA' : '#991B1B' }]}>
                                                    • {item}
                                                </Text>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    sosBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DC2626',
        borderRadius: 18,
        padding: 14,
        marginBottom: 16,
        gap: 12,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
    },
    sosIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sosBannerTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    sosBannerSub: {
        color: '#FEE2E2',
        fontSize: 12,
        marginTop: 2,
    },
    cprCard: {
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        marginBottom: 16,
    },
    cprHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    cprCardTitle: {
        fontSize: 14,
        fontWeight: '800',
    },
    cprCardSub: {
        fontSize: 12,
        marginTop: 2,
    },
    pulseCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    metronomeActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    metronomeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 12,
        gap: 6,
    },
    metronomeBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    beatCounterBox: {
        alignItems: 'flex-end',
    },
    beatCounterText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#4F46E5',
    },
    breathCycleText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#EF4444',
    },
    categoryScroll: {
        gap: 8,
        marginBottom: 16,
    },
    categoryPill: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 14,
    },
    categoryPillText: {
        fontSize: 13,
        fontWeight: '700',
    },
    protocolCard: {
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 14,
        overflow: 'hidden',
    },
    protocolHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    protocolIconBox: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    protocolTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    protocolSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    protocolBody: {
        paddingHorizontal: 14,
        paddingBottom: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(150, 150, 150, 0.1)',
        paddingTop: 12,
    },
    stepsList: {
        gap: 12,
        marginBottom: 14,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    stepNumberBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    stepNumberText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    stepTitle: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 2,
    },
    stepDesc: {
        fontSize: 12,
        lineHeight: 17,
    },
    dosDontsRow: {
        gap: 10,
    },
    doDontBox: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 10,
    },
    doDontHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    doDontTitle: {
        fontSize: 12,
        fontWeight: '800',
    },
    doDontText: {
        fontSize: 11,
        lineHeight: 16,
        marginBottom: 3,
    },
});

export default FirstAidGuideScreen;
