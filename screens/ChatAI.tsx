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
    Modal,
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

const SESSIONS_STORAGE_KEY = "@smart_health_ai_sessions_v2";
const LEGACY_CHAT_KEY = "@smart_health_ai_chat_v1";

export interface ChatMessage {
    id: string;
    role: "user" | "ai";
    text: string;
    timestamp: number;
}

export interface ChatSession {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
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

// مكوّن تنسيق الرد الطبي الاحترافي
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

                const isHeading = (line.includes('**') && trimmed.endsWith(':')) || trimmed.endsWith(':');
                if (isHeading) {
                    return (
                        <Text key={idx} style={[styles.headingText, { color: textColor }]}>
                            {trimmed.replace(/\*\*/g, '')}
                        </Text>
                    );
                }

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

    // إدارة الجلسات المتعددة (Multi-Session Management)
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const [input, setInput] = useState("");
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

    // 1. تحميل سجل الجلسات وترحيل البيانات السابقة إن وجدت
    useEffect(() => {
        const loadAllSessions = async () => {
            try {
                const storedSessions = await AsyncStorage.getItem(SESSIONS_STORAGE_KEY);
                if (storedSessions) {
                    const parsed: ChatSession[] = JSON.parse(storedSessions);
                    setSessions(parsed);
                    if (parsed.length > 0) {
                        setCurrentSessionId(parsed[0].id);
                        setMessages(parsed[0].messages);
                    }
                } else {
                    // فحص التوافقية السابقة
                    const legacy = await AsyncStorage.getItem(LEGACY_CHAT_KEY);
                    if (legacy) {
                        const legacyMsgs: ChatMessage[] = JSON.parse(legacy);
                        if (legacyMsgs.length > 0) {
                            const firstPrompt = legacyMsgs.find(m => m.role === 'user')?.text || "استشارة سابقة";
                            const initialSession: ChatSession = {
                                id: `session_${Date.now()}`,
                                title: firstPrompt.slice(0, 35) + (firstPrompt.length > 35 ? '...' : ''),
                                createdAt: legacyMsgs[0]?.timestamp || Date.now(),
                                updatedAt: legacyMsgs[legacyMsgs.length - 1]?.timestamp || Date.now(),
                                messages: legacyMsgs,
                            };
                            setSessions([initialSession]);
                            setCurrentSessionId(initialSession.id);
                            setMessages(initialSession.messages);
                            await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify([initialSession]));
                        }
                    }
                }
            } catch (e) {
                console.error("Error loading chat sessions:", e);
            } finally {
                setIsLoaded(true);
            }
        };
        loadAllSessions();
    }, []);

    // 2. حفظ الجلسات في الذاكرة تلقائياً عند أي تعديل
    const persistSessions = async (updatedSessions: ChatSession[]) => {
        setSessions(updatedSessions);
        try {
            await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions));
        } catch (e) {
            console.error("Error saving sessions:", e);
        }
    };

    // بدء محادثة / استشارة جديدة (+ New Consultation)
    const handleStartNewSession = () => {
        Speech.stop();
        setSpeakingMessageId(null);
        setCurrentSessionId(null);
        setMessages([]);
        setShowHistoryModal(false);
        setTimeout(() => inputRef.current?.focus(), 250);
    };

    // التبديل إلى استشارة سابقة من السجل
    const handleSelectSession = (session: ChatSession) => {
        Speech.stop();
        setSpeakingMessageId(null);
        setCurrentSessionId(session.id);
        setMessages(session.messages);
        setShowHistoryModal(false);
    };

    // حذف استشارة محددة من السجل
    const handleDeleteSession = (sessionId: string, e?: any) => {
        e?.stopPropagation?.();
        Alert.alert(
            "حذف الاستشارة",
            "هل أنت متأكد من رغبتك في حذف هذه الاستشارة نهائياً؟",
            [
                { text: "إلغاء", style: "cancel" },
                {
                    text: "حذف",
                    style: "destructive",
                    onPress: async () => {
                        const remaining = sessions.filter(s => s.id !== sessionId);
                        await persistSessions(remaining);
                        if (currentSessionId === sessionId) {
                            if (remaining.length > 0) {
                                setCurrentSessionId(remaining[0].id);
                                setMessages(remaining[0].messages);
                            } else {
                                setCurrentSessionId(null);
                                setMessages([]);
                            }
                        }
                    },
                },
            ]
        );
    };

    // إرسال رسالة مع تحديث الجلسة وسياقها
    const sendMessageText = useCallback(async (textToSend: string, currentHistory: ChatMessage[]) => {
        if (!textToSend.trim() || isTyping) return;

        const trimmed = textToSend.trim();
        const userMsg: ChatMessage = {
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

            const aiMsg: ChatMessage = {
                id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                role: "ai",
                text: reply,
                timestamp: Date.now(),
            };
            const finalMessages = [...updatedHistory, aiMsg];
            setMessages(finalMessages);

            // تحديث أو إنشاء الجلسة في قائمة الجلسات
            setSessions(prevSessions => {
                let targetId = currentSessionId;
                let newSessions: ChatSession[];

                if (!targetId || !prevSessions.some(s => s.id === targetId)) {
                    // إنشاء جلسة جديدة مع عنوان مشتق بذكاء من أول سؤال
                    const newTitle = trimmed.length > 36 ? `${trimmed.slice(0, 36)}...` : trimmed;
                    const newSession: ChatSession = {
                        id: `session_${Date.now()}`,
                        title: newTitle,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                        messages: finalMessages,
                    };
                    targetId = newSession.id;
                    setCurrentSessionId(newSession.id);
                    newSessions = [newSession, ...prevSessions];
                } else {
                    // تحديث الجلسة القائمة
                    newSessions = prevSessions.map(s => {
                        if (s.id === targetId) {
                            return {
                                ...s,
                                updatedAt: Date.now(),
                                messages: finalMessages,
                            };
                        }
                        return s;
                    }).sort((a, b) => b.updatedAt - a.updatedAt);
                }

                AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(newSessions)).catch(console.error);
                return newSessions;
            });

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
    }, [isTyping, sendScale, currentSessionId, t]);

    // معالجة الانتقال من فاحص الجلد
    useEffect(() => {
        if (!isLoaded || initialPromptHandled.current) return;

        const initialPrompt = route.params?.initialPrompt;
        if (initialPrompt && initialPrompt.trim()) {
            initialPromptHandled.current = true;
            // بدء جلسة جديدة خاصة بالفحص السريري
            handleStartNewSession();
            setTimeout(() => {
                sendMessageText(initialPrompt.trim(), []);
            }, 300);
        }
    }, [isLoaded, route.params?.initialPrompt, sendMessageText]);

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

    const formatDate = (ts: number) => {
        const d = new Date(ts);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) {
            return `اليوم ${formatTime(ts)}`;
        }
        return d.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'ar-SA', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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
    const handleCopyMessage = async (msg: ChatMessage) => {
        await Clipboard.setStringAsync(msg.text);
        setCopiedMessageId(msg.id);
        setTimeout(() => setCopiedMessageId(null), 2000);
    };

    // نطق الرسالة صوتياً
    const handleSpeakMessage = async (msg: ChatMessage) => {
        if (speakingMessageId === msg.id) {
            await Speech.stop();
            setSpeakingMessageId(null);
            return;
        }

        await Speech.stop();
        setSpeakingMessageId(msg.id);

        const currentLang = i18n.language;
        const voiceLang = currentLang === 'en' ? 'en-US' : currentLang === 'tr' ? 'tr-TR' : 'ar-SA';
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

    const currentSession = sessions.find(s => s.id === currentSessionId);

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

            {/* Header الاحترافي مع دعم سجل المحادثات المتعددة */}
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
                            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                                {currentSession?.title || (i18n.language === 'en' ? 'Dr. Smart Health' : 'د. سمارت هيلث')}
                            </Text>
                        </View>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: isTyping ? '#F59E0B' : '#10B981' }]} />
                            <Text style={[styles.headerStatus, { color: colors.textSecondary }]}>
                                {isTyping ? (t('chat.typing_indicator') || 'يكتب...') : (t('chat.connected') || 'متصل • استشاري ذكي')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* أزرار السجل وبدء محادثة جديدة */}
                <View style={styles.headerActions}>
                    {/* زر بدء استشارة جديدة */}
                    <TouchableOpacity
                        style={[styles.headerActionBtn, { backgroundColor: 'rgba(79, 70, 229, 0.1)' }]}
                        onPress={handleStartNewSession}
                        accessibilityLabel="New Consultation"
                    >
                        <Ionicons name="create-outline" size={19} color="#4F46E5" />
                    </TouchableOpacity>

                    {/* زر فتح سجل الاستشارات السابقة */}
                    <TouchableOpacity
                        style={[styles.headerActionBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
                        onPress={() => setShowHistoryModal(true)}
                        accessibilityLabel="History"
                    >
                        <Ionicons name="time-outline" size={19} color={colors.text} />
                    </TouchableOpacity>

                    {/* زر المشاركة */}
                    {messages.length > 0 && (
                        <TouchableOpacity
                            style={[styles.headerActionBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
                            onPress={handleShareChat}
                            accessibilityLabel="Share"
                        >
                            <Ionicons name="share-social-outline" size={18} color={colors.text} />
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
                {/* شاشة البداية عند خلو الجلسة */}
                {messages.length === 0 && (
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF' }]}>
                            <Ionicons name="medkit" size={38} color="#4F46E5" />
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            مرحباً بك في استشارة طبية جديدة
                        </Text>
                        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                            اطرح سؤالك أو صف الأعراض بدقة، وسيتم أرشفة هذه الجلسة تلقائياً في سجل محادثاتك.
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

                                        <FormattedMessage
                                            text={msg.text}
                                            isAI={!isUser}
                                            textColor={isUser ? '#FFFFFF' : colors.text}
                                        />

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

            {/* شريط الإدخال */}
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

            {/* نافذة / درج سجل الاستشارات السابقة (Sessions History Modal) */}
            <Modal
                visible={showHistoryModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowHistoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalDrawer, { backgroundColor: colors.surface }]}>
                        {/* رأس النافذة */}
                        <View style={styles.drawerHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Ionicons name="albums-outline" size={22} color="#4F46E5" />
                                <Text style={[styles.drawerTitle, { color: colors.text }]}>
                                    سجل الاستشارات الطبية
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.drawerCloseBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
                                onPress={() => setShowHistoryModal(false)}
                            >
                                <Ionicons name="close" size={20} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* زر بدء استشارة جديدة داخل السجل */}
                        <TouchableOpacity
                            style={styles.newChatBtnLarge}
                            onPress={handleStartNewSession}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="add-circle" size={22} color="#fff" />
                            <Text style={styles.newChatBtnLargeText}>
                                + بدء استشارة طبية جديدة
                            </Text>
                        </TouchableOpacity>

                        {/* قائمة الجلسات المؤرشفة */}
                        <ScrollView style={styles.sessionsList} showsVerticalScrollIndicator={false}>
                            {sessions.length === 0 ? (
                                <View style={styles.emptySessionsBox}>
                                    <Ionicons name="chatbubbles-outline" size={44} color={colors.textSecondary} />
                                    <Text style={[styles.emptySessionsText, { color: colors.textSecondary }]}>
                                        لا توجد استشارات سابقة حتى الآن.
                                    </Text>
                                </View>
                            ) : (
                                sessions.map(session => {
                                    const isSelected = session.id === currentSessionId;
                                    return (
                                        <TouchableOpacity
                                            key={session.id}
                                            style={[
                                                styles.sessionCard,
                                                {
                                                    backgroundColor: isSelected
                                                        ? (isDarkMode ? 'rgba(79, 70, 229, 0.2)' : '#EEF2FF')
                                                        : (isDarkMode ? '#1E293B' : '#F8FAFC'),
                                                    borderColor: isSelected ? '#4F46E5' : (isDarkMode ? '#334155' : '#E2E8F0'),
                                                }
                                            ]}
                                            onPress={() => handleSelectSession(session)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.sessionCardLeft}>
                                                <Ionicons
                                                    name={isSelected ? "chatbubble-ellipses" : "chatbubble-outline"}
                                                    size={18}
                                                    color={isSelected ? "#4F46E5" : colors.textSecondary}
                                                />
                                                <View style={{ flex: 1 }}>
                                                    <Text
                                                        style={[
                                                            styles.sessionTitleText,
                                                            { color: isSelected ? '#4F46E5' : colors.text }
                                                        ]}
                                                        numberOfLines={1}
                                                    >
                                                        {session.title}
                                                    </Text>
                                                    <View style={styles.sessionMetaRow}>
                                                        <Text style={[styles.sessionMetaText, { color: colors.textSecondary }]}>
                                                            {session.messages.length} رسائل
                                                        </Text>
                                                        <Text style={[styles.sessionMetaText, { color: colors.textSecondary }]}>
                                                            • {formatDate(session.updatedAt)}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>

                                            <TouchableOpacity
                                                style={styles.sessionDeleteBtn}
                                                onPress={(e) => handleDeleteSession(session.id, e)}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Ionicons name="trash-outline" size={17} color="#EF4444" />
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doctorBadge: {
        position: 'relative',
    },
    avatarGradient: {
        width: 42,
        height: 42,
        borderRadius: 21,
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
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    headerTitleGroup: {
        flex: 1,
        marginRight: 6,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: '800',
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
        fontSize: 11.5,
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
        paddingTop: 18,
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
    // ستايلات نافذة سجل الاستشارات (History Modal)
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'flex-end',
    },
    modalDrawer: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '82%',
        paddingBottom: 30,
        paddingHorizontal: 18,
        paddingTop: 18,
    },
    drawerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(148, 163, 184, 0.2)',
    },
    drawerTitle: {
        fontSize: 17,
        fontWeight: '800',
    },
    drawerCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    newChatBtnLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#4F46E5',
        borderRadius: 16,
        paddingVertical: 14,
        marginTop: 14,
        marginBottom: 12,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
    },
    newChatBtnLargeText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    sessionsList: {
        marginTop: 4,
    },
    emptySessionsBox: {
        alignItems: 'center',
        paddingVertical: 36,
        gap: 12,
    },
    emptySessionsText: {
        fontSize: 14,
        fontWeight: '600',
    },
    sessionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1.5,
        marginBottom: 10,
    },
    sessionCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        marginRight: 10,
    },
    sessionTitleText: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    sessionMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sessionMetaText: {
        fontSize: 11.5,
        fontWeight: '500',
    },
    sessionDeleteBtn: {
        padding: 6,
    },
});

export default ChatAI;
