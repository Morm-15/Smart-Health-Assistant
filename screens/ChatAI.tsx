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
import { useRoute, RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/types';
import { sendToGemini } from "../services/geminiService";
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import BackButton from "../components/BackButton";

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
                    Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.delay(600),
                ])
            ).start();

        animate(dot1, 0);
        animate(dot2, 150);
        animate(dot3, 300);
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
    container: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 4 },
    dot: { width: 9, height: 9, borderRadius: 5 },
});

const ChatAI = () => {
    const { t, i18n } = useTranslation();
    const { colors, isDarkMode } = useTheme();
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

    // Stop speech when component unmounts
    useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, []);

    // 1. استرجاع المحادثة المحفوظة من الذاكرة المحلية (AsyncStorage)
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

    // دالة الإرسال مع تمرير سجل المحادثة الكامل لحفظ السياق (Multi-turn Context)
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
            // نمرر التاريخ بالكامل لدعم السياق التراكمي (مع نافذة الـ 6 رسائل المنزلقة بالخلفية لحفظ التوكنز)
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
                    text: t('chat.errorMessage'),
                    timestamp: Date.now(),
                },
            ]);
        } finally {
            setIsTyping(false);
        }

        Keyboard.dismiss();
    }, [isTyping, sendScale, t]);

    // 3. التعامل مع الانتقال القادم من فاحص الأمراض الجلدية (route.params?.initialPrompt)
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
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages, isTyping]);

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        const locale = i18n.language === 'ar' ? 'ar-SA' : i18n.language === 'tr' ? 'tr-TR' : 'en-US';
        return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    };

    // ميزة مسح المحادثة بالكامل (Clear Chat)
    const handleClearChat = () => {
        Alert.alert(
            t('chat.clearConfirmTitle') || "مسح سجل المحادثة",
            t('chat.clearConfirmMessage') || "هل أنت متأكد من رغبتك في حذف جميع الرسائل السابقة؟",
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

    // ميزة مشاركة وتصدير المحادثة (Share Chat)
    const handleShareChat = async () => {
        if (messages.length === 0) return;

        try {
            const formatted = messages.map(m => {
                const sender = m.role === 'user' ? '👤 المستخدم' : '🤖 Smart Health AI';
                return `${sender} [${formatTime(m.timestamp)}]:\n${m.text}\n`;
            }).join('\n----------------------\n\n');

            await Share.share({
                title: t('chat.shareTitle') || "سجل الاستشارة الطبية - Smart Health",
                message: `📋 ${t('chat.shareTitle') || "سجل الاستشارة الطبية"}\n\n${formatted}`,
            });
        } catch (e) {
            console.error("Error sharing chat:", e);
        }
    };

    // ميزة نسخ نص الرد إلى الحافظة (Copy to Clipboard)
    const handleCopyMessage = async (msg: Message) => {
        await Clipboard.setStringAsync(msg.text);
        setCopiedMessageId(msg.id);
        setTimeout(() => setCopiedMessageId(null), 2000);
    };

    // ميزة القراءة الصوتية (Text-to-Speech)
    const handleSpeakMessage = async (msg: Message) => {
        if (speakingMessageId === msg.id) {
            await Speech.stop();
            setSpeakingMessageId(null);
            return;
        }

        await Speech.stop();
        setSpeakingMessageId(msg.id);

        const currentLang = i18n.language;
        const voiceLang = currentLang === 'ar' ? 'ar-SA' : currentLang === 'tr' ? 'tr-TR' : 'en-US';

        Speech.speak(msg.text, {
            language: voiceLang,
            pitch: 1.0,
            rate: Platform.OS === 'ios' ? 0.9 : 1.0,
            onDone: () => setSpeakingMessageId(null),
            onStopped: () => setSpeakingMessageId(null),
            onError: () => setSpeakingMessageId(null),
        });
    };

    // اقتراحات البداية (Empty state suggestions)
    const suggestions = [
        "ما هي أعراض ارتفاع ضغط الدم وكيفية الوقاية؟",
        "كيف أتعامل مع حساسية الجلد ونزلات البرد؟",
        "ما هي أهم النصائح لتعزيز المناعة اليومية؟",
    ];

    // أزرار المتابعة التفاعلية السريعة (Follow-up Quick Chips)
    const quickFollowUps = [
        { label: "💊 ما هي العلاجات أو المستحضرات الشائعة؟", prompt: "ما هي العلاجات الدوائية أو المستحضرات الطبية الشائعة المرتبطة بهذه الحالة؟" },
        { label: "🥗 ما هي النصائح الغذائية ونمط الحياة؟", prompt: "ما هي النصائح الغذائية ونمط الحياة المناسب لهذه الحالة؟" },
        { label: "🚨 متى يتوجب علي مراجعة الطبيب فوراً؟", prompt: "ما هي العلامات التحذيرية التي تستدعي مراجعة طبيب الطوارئ أو الاستشاري فوراً؟" },
        { label: "❓ اشرح لي بالتفصيل أكثر", prompt: "هل يمكنك شرح ذلك بتفصيل وبشكل مبسط أكثر؟" },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <StatusBar
                barStyle={isDarkMode ? "light-content" : "dark-content"}
                backgroundColor={colors.background}
                translucent={false}
            />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                    <BackButton />
                    <View style={styles.headerCenter}>
                        <View style={[styles.aiAvatarBig, { backgroundColor: isDarkMode ? '#4F46E5' : '#6366F1' }]}>
                            <Text style={styles.aiAvatarEmoji}>🤖</Text>
                        </View>
                        <View>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('chat.title')}</Text>
                            <View style={styles.statusRow}>
                                <View style={[styles.statusDot, { backgroundColor: isTyping ? '#F59E0B' : '#10B981' }]} />
                                <Text style={[styles.headerStatus, { color: colors.textSecondary }]}>
                                    {isTyping ? t('chat.typing_indicator') : t('chat.connected')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Right Action Icons (Clear & Share) */}
                <View style={styles.headerActions}>
                    {messages.length > 0 && (
                        <TouchableOpacity
                            style={[styles.headerActionBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
                            onPress={handleShareChat}
                            accessibilityLabel="Share chat"
                        >
                            <Ionicons name="share-social-outline" size={19} color={colors.text} />
                        </TouchableOpacity>
                    )}
                    {messages.length > 0 && (
                        <TouchableOpacity
                            style={[styles.headerActionBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#FEE2E2' }]}
                            onPress={handleClearChat}
                            accessibilityLabel="Clear chat"
                        >
                            <Ionicons name="trash-outline" size={19} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Messages Scroll Area */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.chatBox}
                contentContainerStyle={styles.chatBoxContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Empty State */}
                {messages.length === 0 && (
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF' }]}>
                            <Text style={styles.emptyEmoji}>💬</Text>
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            {t('chat.startConversation')}
                        </Text>
                        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                            {t('chat.medicalAssistant')} — ذاكرة ذكية مستمرة وخصوصية كاملة
                        </Text>

                        {/* Initial Suggestion chips */}
                        <View style={styles.suggestionsContainer}>
                            <Text style={[styles.suggestionsLabel, { color: colors.textSecondary }]}>
                                💡 مقترحات أسئلة سريعة:
                            </Text>
                            {suggestions.map((s, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.suggestionChip, {
                                        backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF',
                                        borderColor: isDarkMode ? '#4F46E5' : '#C7D2FE',
                                    }]}
                                    onPress={() => sendMessageText(s, messages)}
                                >
                                    <Ionicons name="sparkles" size={16} color="#6366F1" />
                                    <Text style={[styles.suggestionText, { color: isDarkMode ? '#A5B4FC' : '#4F46E5' }]}>
                                        {s}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Message Bubbles */}
                {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    const isLastMessage = idx === messages.length - 1;
                    const isSpeaking = speakingMessageId === msg.id;
                    const isCopied = copiedMessageId === msg.id;

                    return (
                        <View key={msg.id || idx}>
                            <View
                                style={[
                                    styles.messageRow,
                                    isUser ? styles.messageRowUser : styles.messageRowAI,
                                ]}
                            >
                                {!isUser && (
                                    <View style={[styles.miniAvatar, { backgroundColor: '#6366F1' }]}>
                                        <Text style={{ fontSize: 13 }}>🤖</Text>
                                    </View>
                                )}

                                <View style={styles.bubbleWrapper}>
                                    <View style={[
                                        styles.bubble,
                                        isUser
                                            ? styles.userBubble
                                            : [styles.aiBubble, {
                                                backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFF',
                                                borderColor: isDarkMode ? '#334155' : '#E0E7FF'
                                            }],
                                    ]}>
                                        <Text style={[
                                            styles.bubbleText,
                                            !isUser && { color: colors.text }
                                        ]}>
                                            {msg.text}
                                        </Text>

                                        {/* Action Bar for AI response: Copy & Read Aloud */}
                                        {!isUser && (
                                            <View style={[styles.aiActionBar, { borderTopColor: isDarkMode ? '#334155' : '#EEF2F6' }]}>
                                                <TouchableOpacity
                                                    style={styles.actionIconButton}
                                                    onPress={() => handleCopyMessage(msg)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Ionicons
                                                        name={isCopied ? "checkmark-circle" : "copy-outline"}
                                                        size={16}
                                                        color={isCopied ? "#10B981" : colors.textSecondary}
                                                    />
                                                    <Text style={[styles.actionIconLabel, { color: isCopied ? "#10B981" : colors.textSecondary }]}>
                                                        {isCopied ? (t('chat.copied') || "تم النسخ") : "نسخ"}
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[styles.actionIconButton, isSpeaking && styles.actionIconButtonActive]}
                                                    onPress={() => handleSpeakMessage(msg)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Ionicons
                                                        name={isSpeaking ? "stop-circle" : "volume-medium-outline"}
                                                        size={16}
                                                        color={isSpeaking ? "#EF4444" : colors.textSecondary}
                                                    />
                                                    <Text style={[styles.actionIconLabel, { color: isSpeaking ? "#EF4444" : colors.textSecondary }]}>
                                                        {isSpeaking ? "إيقاف" : "استماع"}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>

                                    <Text style={[styles.timeStamp, {
                                        color: colors.textSecondary,
                                        textAlign: isUser ? 'right' : 'left',
                                    }]}>
                                        {formatTime(msg.timestamp)}
                                    </Text>
                                </View>

                                {isUser && (
                                    <View style={[styles.miniAvatar, { backgroundColor: isDarkMode ? '#4F46E5' : '#6366F1' }]}>
                                        <Ionicons name="person" size={14} color="#fff" />
                                    </View>
                                )}
                            </View>

                            {/* Quick Follow-up Chips after the latest AI reply */}
                            {!isUser && isLastMessage && !isTyping && (
                                <View style={styles.quickFollowUpContainer}>
                                    <Text style={[styles.quickFollowUpTitle, { color: colors.textSecondary }]}>
                                        ⚡ مقترحات المتابعة:
                                    </Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.chipsScroll}
                                    >
                                        {quickFollowUps.map((chip, cIdx) => (
                                            <TouchableOpacity
                                                key={cIdx}
                                                style={[styles.quickChip, {
                                                    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                                                    borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                                                }]}
                                                onPress={() => sendMessageText(chip.prompt, messages)}
                                            >
                                                <Text style={[styles.quickChipText, { color: colors.text }]}>
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

                {/* Typing Indicator */}
                {isTyping && (
                    <View style={[styles.messageRow, styles.messageRowAI]}>
                        <View style={[styles.miniAvatar, { backgroundColor: '#6366F1' }]}>
                            <Text style={{ fontSize: 13 }}>🤖</Text>
                        </View>
                        <View style={[styles.bubble, styles.aiBubble, {
                            backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFF',
                            borderColor: isDarkMode ? '#334155' : '#E0E7FF',
                        }]}>
                            <TypingDots color={colors.primary} />
                        </View>
                    </View>
                )}

                <View style={{ height: 16 }} />
            </ScrollView>

            {/* Input Bar */}
            <View style={[styles.inputWrapper, {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
            }]}>
                <View style={[styles.inputContainer, {
                    backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFF',
                    borderColor: isDarkMode ? '#334155' : '#E0E7FF',
                }]}>
                    <TextInput
                        ref={inputRef}
                        style={[styles.input, { color: colors.text }]}
                        placeholder={t('chat.inputPlaceholder')}
                        placeholderTextColor={colors.textSecondary}
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                        multiline
                        maxLength={600}
                    />
                    <Animated.View style={{ transform: [{ scale: sendScale }] }}>
                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                { backgroundColor: input.trim() ? '#6366F1' : (isDarkMode ? '#334155' : '#E0E7FF') }
                            ]}
                            onPress={handleSend}
                            disabled={!input.trim() || isTyping}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="send"
                                size={18}
                                color={input.trim() ? '#fff' : (isDarkMode ? '#64748B' : '#94A3B8')}
                            />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
                <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
                    ⚠️ للاستشارة والتوجيه الطبي فقط — لا يغني عن تشخيص الطبيب المختص
                </Text>
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
        paddingBottom: 12,
        paddingHorizontal: 16,
        paddingTop: 8,
        borderBottomWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        gap: 10,
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
    aiAvatarBig: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiAvatarEmoji: { fontSize: 22 },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
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
    },
    chatBox: { flex: 1 },
    chatBoxContent: { padding: 16 },
    emptyState: {
        alignItems: 'center',
        paddingTop: 24,
        paddingHorizontal: 12,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyEmoji: { fontSize: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
    emptySubtext: { fontSize: 13, textAlign: 'center', marginBottom: 20, opacity: 0.8 },
    suggestionsContainer: { width: '100%', gap: 10 },
    suggestionsLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4, textAlign: 'right' },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
    },
    suggestionText: { fontSize: 13, fontWeight: '500', flex: 1 },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 10,
        gap: 8,
    },
    messageRowUser: { justifyContent: 'flex-end' },
    messageRowAI: { justifyContent: 'flex-start' },
    miniAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    bubbleWrapper: { maxWidth: '82%' },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    userBubble: {
        backgroundColor: '#6366F1',
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        borderBottomLeftRadius: 4,
        borderWidth: 1,
    },
    bubbleText: {
        color: '#fff',
        fontSize: 14.5,
        lineHeight: 22,
    },
    aiActionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        gap: 16,
    },
    actionIconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 2,
    },
    actionIconButtonActive: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingHorizontal: 6,
        borderRadius: 6,
    },
    actionIconLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    timeStamp: {
        fontSize: 11,
        marginTop: 3,
        opacity: 0.65,
        paddingHorizontal: 4,
    },
    quickFollowUpContainer: {
        marginTop: 4,
        marginBottom: 14,
        marginLeft: 40,
    },
    quickFollowUpTitle: {
        fontSize: 11.5,
        fontWeight: '600',
        marginBottom: 6,
        textAlign: 'right',
    },
    chipsScroll: {
        gap: 8,
        paddingRight: 10,
    },
    quickChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
        borderWidth: 1,
    },
    quickChipText: {
        fontSize: 12,
        fontWeight: '500',
    },
    inputWrapper: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        borderTopWidth: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRadius: 22,
        borderWidth: 1.5,
        minHeight: 50,
    },
    input: {
        flex: 1,
        paddingHorizontal: 8,
        paddingVertical: 8,
        fontSize: 15,
        maxHeight: 100,
    },
    sendButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
    },
    disclaimer: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 6,
        opacity: 0.7,
    },
});

export default ChatAI;
