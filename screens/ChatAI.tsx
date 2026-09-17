import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    ScrollView,
    StyleSheet,
    Keyboard,
    StatusBar,
    Animated,
    Alert,
    Share,
    Platform,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/types';
import { sendToGemini } from "../services/geminiService";
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const CHAT_STORAGE_KEY = "@smart_health_ai_chat_v1";

interface Message {
    id: string;
    role: "user" | "ai";
    text: string;
    timestamp: number;
}

// Typing dots animation
const TypingDots = ({ color }: { color: string }) => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: -5, duration: 280, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
                    Animated.delay(500),
                ])
            ).start();

        animate(dot1, 0);
        animate(dot2, 140);
        animate(dot3, 280);
    }, []);

    return (
        <View style={typingStyles.container}>
            {[dot1, dot2, dot3].map((dot, i) => (
                <Animated.View
                    key={i}
                    style={[typingStyles.dot, { backgroundColor: color, transform: [{ translateY: dot }] }]}
                />
            ))}
        </View>
    );
};

const typingStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 4 },
    dot: { width: 8, height: 8, borderRadius: 4 },
});

// مكوّن تنسيق النصوص الطبية بجمالية واحترافية عالية (بدون نجوم مشوهة وبتنظيم رائع للنقاط)
const FormattedMessage = ({ text, isAI, textColor }: { text: string; isAI: boolean; textColor: string }) => {
    if (!isAI) {
        return <Text style={[styles.bubbleText, { color: '#FFFFFF' }]}>{text}</Text>;
    }

    const lines = text.split('\n');
    return (
        <View style={styles.formattedContainer}>
            {lines.map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) {
                    return <View key={idx} style={{ height: 6 }} />;
                }

                // كشف تنبيهات وإخلاء المسؤولية الطبية لتنسيقها في صندوق حماية طبي ملون
                if (
                    trimmed.startsWith('⚠️') ||
                    trimmed.startsWith('💡') ||
                    trimmed.includes('تنبيه صحي') ||
                    trimmed.includes('إخلاء مسؤولية') ||
                    trimmed.includes('استشارة الطبيب المختص')
                ) {
                    return (
                        <View key={idx} style={styles.calloutCard}>
                            <Ionicons name="shield-checkmark" size={16} color="#0D9488" style={{ marginTop: 2 }} />
                            <Text style={styles.calloutText}>
                                {trimmed.replace(/\*\*/g, '')}
                            </Text>
                        </View>
                    );
                }

                // كشف عناصر القوائم والنقاط (Bullets)
                if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('* ')) {
                    const cleanContent = trimmed.replace(/^[•\-\*]\s*/, '').replace(/\*\*/g, '');
                    return (
                        <View key={idx} style={styles.bulletRow}>
                            <View style={styles.bulletDot} />
                            <Text style={[styles.bulletText, { color: textColor }]}>
                                {cleanContent}
                            </Text>
                        </View>
                    );
                }

                // كشف الخطوات المرقمة (Numbered Steps)
                const numMatch = trimmed.match(/^(\d+)[\.\)]\s*(.*)/);
                if (numMatch) {
                    return (
                        <View key={idx} style={styles.numberRow}>
                            <View style={styles.numberBadge}>
                                <Text style={styles.numberBadgeText}>{numMatch[1]}</Text>
                            </View>
                            <Text style={[styles.numberText, { color: textColor }]}>
                                {numMatch[2].replace(/\*\*/g, '')}
                            </Text>
                        </View>
                    );
                }

                // كشف العناوين الفرعية (التي تنتهي بنقطتين أو كانت محاطة بنجوم)
                const isHeading = (line.includes('**') && trimmed.endsWith(':')) || trimmed.endsWith(':');
                if (isHeading) {
                    return (
                        <Text key={idx} style={[styles.headingText, { color: textColor }]}>
                            {trimmed.replace(/\*\*/g, '')}
                        </Text>
                    );
                }

                // نص عادي منسق ومريح للعين
                return (
                    <Text key={idx} style={[styles.bubbleText, { color: textColor }]}>
                        {trimmed.replace(/\*\*/g, '')}
                    </Text>
                );
            })}
        </View>
    );
};

const ChatAI = () => {
    const { t, i18n } = useTranslation();
    const { colors, isDarkMode } = useTheme();
    const navigation = useNavigation();
    const route = useRoute<RouteProp<AuthStackParamList, 'ChatAI'>>();

    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

    const scrollViewRef = useRef<ScrollView>(null);
    const inputRef = useRef<TextInput>(null);
    const sendScale = useRef(new Animated.Value(1)).current;
    const initialPromptHandled = useRef(false);

    useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, []);

    // 1. استرجاع المحادثة المحفوظة من AsyncStorage
    useEffect(() => {
        const loadSavedChat = async () => {
            try {
                const saved = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
                if (saved) {
                    const parsed: Message[] = JSON.parse(saved);
                    setMessages(parsed);
                }
            } catch (e) {
                console.error("Error loading chat history:", e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadSavedChat();
    }, []);

    // 2. حفظ الرسائل تلقائياً عند أي تعديل
    useEffect(() => {
        if (!isLoaded) return;
        const persistChat = async () => {
            try {
                await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
            } catch (e) {
                console.error("Error saving chat history:", e);
            }
        };
        persistChat();
    }, [messages, isLoaded]);

    // دالة الإرسال مع تمرير سياق المحادثة الكاملة
    const sendMessageText = useCallback(async (textToSend: string, currentHistory: Message[]) => {
        if (!textToSend.trim() || isTyping) return;

        const trimmed = textToSend.trim();
        const userMsg: Message = {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            role: "user",
            text: trimmed,
            timestamp: Date.now(),
        };

        const updatedHistory = [...currentHistory, userMsg];
        setMessages(updatedHistory);
        setInput("");
        setIsTyping(true);

        Animated.sequence([
            Animated.timing(sendScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
            Animated.timing(sendScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();

        try {
            const reply = await sendToGemini(
                trimmed,
                updatedHistory.map(m => ({ role: m.role, text: m.text }))
            );

            const aiMsg: Message = {
                id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                role: "ai",
                text: reply,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch {
            setMessages(prev => [
                ...prev,
                {
                    id: `ai_err_${Date.now()}`,
                    role: "ai",
                    text: t('chat.errorMessage') || "حدث خطأ أثناء التواصل مع المساعد الطبي. يرجى المحاولة ثانية.",
                    timestamp: Date.now(),
                },
            ]);
        } finally {
            setIsTyping(false);
        }

        Keyboard.dismiss();
    }, [isTyping, sendScale, t]);

    // التعامل مع الفحص القادم من كاميرا الأمراض الجلدية
    useEffect(() => {
        if (!isLoaded || initialPromptHandled.current) return;

        const initialPrompt = route.params?.initialPrompt;
        if (initialPrompt && initialPrompt.trim()) {
            initialPromptHandled.current = true;
            sendMessageText(initialPrompt.trim(), messages);
        }
    }, [isLoaded, route.params?.initialPrompt, messages, sendMessageText]);

    const handleSend = () => {
        sendMessageText(input, messages);
    };

    useEffect(() => {
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    }, [messages, isTyping]);

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        const isAr = i18n.language !== 'en';
        return d.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // مسح المحادثة بالكامل
    const handleClearChat = () => {
        Alert.alert(
            t('chat.clearConfirmTitle') || "مسح المحادثة",
            t('chat.clearConfirmMessage') || "هل تريد حذف جميع الرسائل السابقة؟",
            [
                { text: t('medication.cancel') || "إلغاء", style: 'cancel' },
                {
                    text: t('chat.clear') || "مسح",
                    style: 'destructive',
                    onPress: async () => {
                        Speech.stop();
                        setSpeakingMessageId(null);
                        setMessages([]);
                        try {
                            await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
                        } catch (e) {
                            console.error("Error clearing chat:", e);
                        }
                    },
                },
            ]
        );
    };

    // مشاركة المحادثة
    const handleShareChat = async () => {
        if (messages.length === 0) return;

        try {
            const formatted = messages.map(m => {
                const sender = m.role === 'user' ? '👤 المريض' : '🩺 د. سمارت هيلث';
                return `${sender} [${formatTime(m.timestamp)}]:\n${m.text}\n`;
            }).join('\n----------------------\n\n');

            await Share.share({
                title: "استشارة طبية - Smart Health",
                message: `📋 استشارة طبية ذكية - Smart Health\n\n${formatted}`,
            });
        } catch (e) {
            console.error("Error sharing chat:", e);
        }
    };

    // نسخ الرسالة
    const handleCopyMessage = async (msg: Message) => {
        await Clipboard.setStringAsync(msg.text);
        setCopiedMessageId(msg.id);
        setTimeout(() => setCopiedMessageId(null), 2000);
    };

    // نطق الرسالة صوتياً
    const handleSpeakMessage = async (msg: Message) => {
        if (speakingMessageId === msg.id) {
            await Speech.stop();
            setSpeakingMessageId(null);
            return;
        }

        await Speech.stop();
        setSpeakingMessageId(msg.id);

        const currentLang = i18n.language;
        const voiceLang = currentLang === 'en' ? 'en-US' : currentLang === 'tr' ? 'tr-TR' : 'ar-SA';

        // تنظيف الرموز قبل القراءة لنطق سليم
        const cleanText = msg.text.replace(/[\*•\-_#]/g, ' ');

        Speech.speak(cleanText, {
            language: voiceLang,
            pitch: 1.0,
            rate: Platform.OS === 'ios' ? 0.92 : 1.0,
            onDone: () => setSpeakingMessageId(null),
            onStopped: () => setSpeakingMessageId(null),
            onError: () => setSpeakingMessageId(null),
        });
    };

    // اقتراحات البداية
    const suggestions = [
        "ما هي أسباب ظهور بقع حمراء مع حكة في الجلد؟",
        "كيف أتعامل مع الصداع النصفي المفاجئ؟",
        "ما هي الأطعمة التي ترفع مناعة الجسم؟",
    ];

    // أزرار المتابعة التفاعلية السريعة
    const quickFollowUps = [
        { label: "💊 العلاجات والمستحضرات الشائعة", prompt: "ما هي العلاجات الدوائية أو الموضعية الشائعة لهذه الحالة؟" },
        { label: "🥗 النصائح الغذائية ونمط الحياة", prompt: "ما هي التوصيات الغذائية والعادات الصحية المناسبة لتسريع الشفاء؟" },
        { label: "🚨 علامات تستوجب الطبيب فوراً", prompt: "ما هي العلامات التحذيرية التي تستدعي مراجعة طبيب الطوارئ أو الاستشاري فوراً؟" },
        { label: "❓ تفاصيل إضافية عن الحالة", prompt: "اشرح لي بمزيد من التفصيل العلمي المبسط عن طبيعة هذه الحالة." },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <StatusBar
                barStyle={isDarkMode ? "light-content" : "dark-content"}
                backgroundColor={colors.surface}
                translucent={false}
            />

            {/* Header الاحترافي الفاخر للطبيب الذكي */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        style={[styles.backBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="chevron-forward" size={22} color={colors.text} />
                    </TouchableOpacity>

                    <View style={styles.doctorBadge}>
                        <View style={styles.avatarGradient}>
                            <Ionicons name="medical" size={20} color="#fff" />
                        </View>
                        <View style={styles.verifiedCheck}>
                            <Ionicons name="checkmark" size={9} color="#fff" />
                        </View>
                    </View>

                    <View style={styles.headerTitleGroup}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>
                                {i18n.language === 'en' ? 'Dr. Smart Health' : 'د. سمارت هيلث'}
                            </Text>
                            <View style={styles.liveTag}>
                                <Text style={styles.liveTagText}>AI MD</Text>
                            </View>
                        </View>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: isTyping ? '#F59E0B' : '#10B981' }]} />
                            <Text style={[styles.headerStatus, { color: colors.textSecondary }]}>
                                {isTyping ? (t('chat.typing_indicator') || 'يكتب استشارته...') : (t('chat.connected') || 'متصل • استشاري ذكي')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* أزرار الإجراءات العلوية */}
                <View style={styles.headerActions}>
                    {messages.length > 0 && (
                        <TouchableOpacity
                            style={[styles.headerActionBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
                            onPress={handleShareChat}
                            accessibilityLabel="Share"
                        >
                            <Ionicons name="share-social-outline" size={18} color={colors.text} />
                        </TouchableOpacity>
                    )}
                    {messages.length > 0 && (
                        <TouchableOpacity
                            style={[styles.headerActionBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#FEE2E2' }]}
                            onPress={handleClearChat}
                            accessibilityLabel="Clear"
                        >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* منطقة الرسائل */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.chatBox}
                contentContainerStyle={styles.chatBoxContent}
                showsVerticalScrollIndicator={false}
            >
                {/* شاشة البداية عند خلو المحادثة */}
                {messages.length === 0 && (
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF' }]}>
                            <Ionicons name="medkit" size={38} color="#4F46E5" />
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            مرحباً بك في عيادة Smart Health الذكية
                        </Text>
                        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                            استشارتك الطبية الشخصية الموثوقة مع ذاكرة مستمرة لحفظ تاريخك الصحي وخصوصية كاملة.
                        </Text>

                        {/* اقتراحات البداية */}
                        <View style={styles.suggestionsContainer}>
                            <Text style={[styles.suggestionsLabel, { color: colors.textSecondary }]}>
                                💡 مواضيع مقترحة للاستشارة:
                            </Text>
                            {suggestions.map((s, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.suggestionChip, {
                                        backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                                        borderColor: isDarkMode ? '#334155' : '#E0E7FF',
                                    }]}
                                    onPress={() => sendMessageText(s, messages)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.suggestionIcon}>
                                        <Ionicons name="chatbubble-ellipses-outline" size={16} color="#4F46E5" />
                                    </View>
                                    <Text style={[styles.suggestionText, { color: colors.text }]}>
                                        {s}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* فقاعات الرسائل */}
                {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    const isLastMessage = idx === messages.length - 1;
                    const isSpeaking = speakingMessageId === msg.id;
                    const isCopied = copiedMessageId === msg.id;

                    return (
                        <View key={msg.id || idx} style={styles.messageItemWrapper}>
                            <View
                                style={[
                                    styles.messageRow,
                                    isUser ? styles.messageRowUser : styles.messageRowAI,
                                ]}
                            >
                                {!isUser && (
                                    <View style={styles.aiMiniBadge}>
                                        <Ionicons name="pulse" size={15} color="#4F46E5" />
                                    </View>
                                )}

                                <View style={styles.bubbleWrapper}>
                                    <View style={[
                                        styles.bubble,
                                        isUser
                                            ? styles.userBubble
                                            : [styles.aiBubble, {
                                                backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                                                borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                                            }],
                                    ]}>
                                        {/* شريط رأس فقاعة الطبيب */}
                                        {!isUser && (
                                            <View style={styles.doctorBubbleHeader}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                                    <Ionicons name="shield-checkmark" size={13} color="#10B981" />
                                                    <Text style={[styles.doctorHeaderName, { color: colors.textSecondary }]}>
                                                        استشارة سريرية موجهة
                                                    </Text>
                                                </View>
                                                <Text style={[styles.bubbleTime, { color: colors.textSecondary }]}>
                                                    {formatTime(msg.timestamp)}
                                                </Text>
                                            </View>
                                        )}

                                        {/* محتوى الرسالة المنسق */}
                                        <FormattedMessage
                                            text={msg.text}
                                            isAI={!isUser}
                                            textColor={isUser ? '#FFFFFF' : colors.text}
                                        />

                                        {/* أزرار الإجراءات أسفل رد الذكاء الاصطناعي */}
                                        {!isUser && (
                                            <View style={[styles.aiActionBar, { borderTopColor: isDarkMode ? '#334155' : '#F1F5F9' }]}>
                                                <TouchableOpacity
                                                    style={[styles.actionPill, isSpeaking && styles.actionPillActive]}
                                                    onPress={() => handleSpeakMessage(msg)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Ionicons
                                                        name={isSpeaking ? "stop-circle" : "volume-medium-outline"}
                                                        size={15}
                                                        color={isSpeaking ? "#EF4444" : "#4F46E5"}
                                                    />
                                                    <Text style={[styles.actionPillText, { color: isSpeaking ? "#EF4444" : "#4F46E5" }]}>
                                                        {isSpeaking ? "إيقاف القراءة" : "استماع صوتي"}
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={styles.actionPill}
                                                    onPress={() => handleCopyMessage(msg)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Ionicons
                                                        name={isCopied ? "checkmark-circle" : "copy-outline"}
                                                        size={15}
                                                        color={isCopied ? "#10B981" : colors.textSecondary}
                                                    />
                                                    <Text style={[styles.actionPillText, { color: isCopied ? "#10B981" : colors.textSecondary }]}>
                                                        {isCopied ? "تم النسخ" : "نسخ التقرير"}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>

                                    {isUser && (
                                        <Text style={[styles.timeStampUser, { color: colors.textSecondary }]}>
                                            {formatTime(msg.timestamp)}
                                        </Text>
                                    )}
                                </View>

                                {isUser && (
                                    <View style={[styles.userMiniBadge, { backgroundColor: '#4F46E5' }]}>
                                        <Ionicons name="person" size={14} color="#fff" />
                                    </View>
                                )}
                            </View>

                            {/* أزرار المتابعة السريعة بعد الرد الأخير للطبيب */}
                            {!isUser && isLastMessage && !isTyping && (
                                <View style={styles.quickFollowUpWrapper}>
                                    <View style={styles.followUpHeader}>
                                        <Ionicons name="flash" size={13} color="#F59E0B" />
                                        <Text style={[styles.followUpTitle, { color: colors.textSecondary }]}>
                                            مقترحات متابعة سريرية سريعة:
                                        </Text>
                                    </View>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.chipsScrollContent}
                                    >
                                        {quickFollowUps.map((chip, cIdx) => (
                                            <TouchableOpacity
                                                key={cIdx}
                                                style={[styles.quickFollowUpChip, {
                                                    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                                                    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                                                }]}
                                                onPress={() => sendMessageText(chip.prompt, messages)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[styles.quickFollowUpChipText, { color: colors.text }]}>
                                                    {chip.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    );
                })}

                {/* مؤشر جاري الكتابة */}
                {isTyping && (
                    <View style={[styles.messageRow, styles.messageRowAI]}>
                        <View style={styles.aiMiniBadge}>
                            <Ionicons name="pulse" size={15} color="#4F46E5" />
                        </View>
                        <View style={[styles.bubble, styles.aiBubble, {
                            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                            borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                        }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <TypingDots color="#4F46E5" />
                                <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: '500' }}>
                                    الدكتور يستشير السجل الطبي ويجهز الرد...
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* شريط الإدخال الفاخر */}
            <View style={[styles.inputWrapper, {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
            }]}>
                <View style={[styles.inputCard, {
                    backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                }]}>
                    <TextInput
                        ref={inputRef}
                        style={[styles.textInput, { color: colors.text }]}
                        placeholder={i18n.language === 'en' ? "Type medical question..." : "اكتب استفسارك الطبي أو الصحي هنا..."}
                        placeholderTextColor={colors.textSecondary}
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                        multiline
                        maxLength={700}
                    />

                    <Animated.View style={{ transform: [{ scale: sendScale }] }}>
                        <TouchableOpacity
                            style={[
                                styles.sendActionBtn,
                                { backgroundColor: input.trim() ? '#4F46E5' : (isDarkMode ? '#334155' : '#E2E8F0') }
                            ]}
                            onPress={handleSend}
                            disabled={!input.trim() || isTyping}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="arrow-up"
                                size={20}
                                color={input.trim() ? '#FFFFFF' : (isDarkMode ? '#64748B' : '#94A3B8')}
                            />
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                <View style={styles.disclaimerRow}>
                    <Ionicons name="information-circle-outline" size={13} color={colors.textSecondary} />
                    <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                        {i18n.language === 'en'
                            ? "Guidance only — consult a physician for official diagnosis."
                            : "للاستشارة والتوجيه الصحي فقط — لا يغني عن الفحص السريري المباشر للطبيب."}
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doctorBadge: {
        position: 'relative',
    },
    avatarGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4F46E5',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    verifiedCheck: {
        position: 'absolute',
        bottom: -1,
        right: -1,
        width: 15,
        height: 15,
        borderRadius: 7.5,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    headerTitleGroup: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    liveTag: {
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    liveTagText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#4F46E5',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 2,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    headerStatus: {
        fontSize: 12,
        fontWeight: '500',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerActionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatBox: { flex: 1 },
    chatBoxContent: {
        paddingHorizontal: 16,
        paddingTop: 20, // مسافة علوية كافية تمنع أي تداخل مع الهيدر
        paddingBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 20,
        paddingHorizontal: 8,
    },
    emptyIconCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#4F46E5',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 13.5,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 12,
    },
    suggestionsContainer: {
        width: '100%',
        gap: 10,
    },
    suggestionsLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 2,
        textAlign: 'right',
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    suggestionIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    suggestionText: {
        fontSize: 13.5,
        fontWeight: '600',
        flex: 1,
        lineHeight: 20,
    },
    messageItemWrapper: {
        marginBottom: 16,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    messageRowUser: {
        justifyContent: 'flex-end',
    },
    messageRowAI: {
        justifyContent: 'flex-start',
    },
    aiMiniBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    userMiniBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    bubbleWrapper: {
        maxWidth: '84%',
    },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    userBubble: {
        backgroundColor: '#4F46E5',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderLeftWidth: 3.5,
        borderLeftColor: '#4F46E5',
    },
    doctorBubbleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(148, 163, 184, 0.15)',
    },
    doctorHeaderName: {
        fontSize: 11.5,
        fontWeight: '700',
    },
    bubbleTime: {
        fontSize: 11,
    },
    timeStampUser: {
        fontSize: 11,
        marginTop: 3,
        textAlign: 'right',
        paddingHorizontal: 4,
    },
    formattedContainer: {
        gap: 4,
    },
    bubbleText: {
        fontSize: 14.5,
        lineHeight: 23,
    },
    headingText: {
        fontSize: 15,
        fontWeight: '800',
        marginTop: 6,
        marginBottom: 2,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginVertical: 2,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4F46E5',
        marginTop: 8,
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 22,
    },
    numberRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginVertical: 3,
    },
    numberBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(79, 70, 229, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    numberBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#4F46E5',
    },
    numberText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 22,
    },
    calloutCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: 'rgba(13, 148, 136, 0.08)',
        borderColor: 'rgba(13, 148, 136, 0.25)',
        borderWidth: 1,
        padding: 10,
        borderRadius: 12,
        marginTop: 8,
    },
    calloutText: {
        flex: 1,
        fontSize: 12.5,
        lineHeight: 19,
        color: '#0D9488',
        fontWeight: '600',
    },
    aiActionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
    },
    actionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(79, 70, 229, 0.06)',
    },
    actionPillActive: {
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
    },
    actionPillText: {
        fontSize: 12,
        fontWeight: '700',
    },
    quickFollowUpWrapper: {
        marginTop: 8,
        paddingHorizontal: 12,
    },
    followUpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 8,
    },
    followUpTitle: {
        fontSize: 12,
        fontWeight: '700',
    },
    chipsScrollContent: {
        gap: 8,
        paddingRight: 16,
    },
    quickFollowUpChip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    quickFollowUpChipText: {
        fontSize: 12.5,
        fontWeight: '600',
    },
    inputWrapper: {
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 10,
        borderTopWidth: 1,
    },
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        borderWidth: 1.5,
        paddingHorizontal: 14,
        minHeight: 52,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
    },
    textInput: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 6,
        fontSize: 15,
        maxHeight: 110,
    },
    sendActionBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 6,
    },
    disclaimerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        marginTop: 6,
    },
    disclaimerText: {
        fontSize: 11,
        fontWeight: '500',
    },
});

export default ChatAI;
