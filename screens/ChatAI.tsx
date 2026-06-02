import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendToGemini } from "../services/geminiService";
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import BackButton from "../components/BackButton";

interface Message {
    role: "user" | "ai";
    text: string;
    timestamp: Date;
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
    const { t } = useTranslation();
    const { colors, isDarkMode } = useTheme();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const inputRef = useRef<TextInput>(null);
    const sendScale = useRef(new Animated.Value(1)).current;

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { role: "user", text: input.trim(), timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        const prompt = input.trim();
        setInput("");
        setIsTyping(true);

        Animated.sequence([
            Animated.timing(sendScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
            Animated.timing(sendScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();

        try {
            const reply = await sendToGemini(prompt);
            const aiMessage: Message = { role: "ai", text: reply, timestamp: new Date() };
            setMessages(prev => [...prev, aiMessage]);
        } catch {
            setMessages(prev => [...prev, { role: "ai", text: t('chat.errorMessage'), timestamp: new Date() }]);
        } finally {
            setIsTyping(false);
        }

        Keyboard.dismiss();
    };

    useEffect(() => {
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages, isTyping]);

    const formatTime = (date: Date) =>
        date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    // Suggested questions
    const suggestions = [
        "ما هي أعراض ارتفاع ضغط الدم؟",
        "كيف أتعامل مع نزلة البرد؟",
        "ما هي فوائد النوم الكافي؟",
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

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.chatBox}
                contentContainerStyle={styles.chatBoxContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Empty state */}
                {messages.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>💬</Text>
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            {t('chat.startConversation')}
                        </Text>
                        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                            {t('chat.medicalAssistant')}
                        </Text>

                        {/* Suggestion chips */}
                        <View style={styles.suggestionsContainer}>
                            <Text style={[styles.suggestionsLabel, { color: colors.textSecondary }]}>
                                جرّب أن تسأل:
                            </Text>
                            {suggestions.map((s, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.suggestionChip, {
                                        backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF',
                                        borderColor: isDarkMode ? '#4F46E5' : '#C7D2FE',
                                    }]}
                                    onPress={() => setInput(s)}
                                >
                                    <Ionicons name="bulb-outline" size={16} color="#6366F1" />
                                    <Text style={[styles.suggestionText, { color: isDarkMode ? '#818CF8' : '#4F46E5' }]}>
                                        {s}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Messages */}
                {messages.map((msg, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.messageRow,
                            msg.role === 'user' ? styles.messageRowUser : styles.messageRowAI,
                        ]}
                    >
                        {msg.role === 'ai' && (
                            <View style={[styles.miniAvatar, { backgroundColor: '#6366F1' }]}>
                                <Text style={{ fontSize: 12 }}>🤖</Text>
                            </View>
                        )}
                        <View style={styles.bubbleWrapper}>
                            <View style={[
                                styles.bubble,
                                msg.role === 'user'
                                    ? styles.userBubble
                                    : [styles.aiBubble, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFF', borderColor: isDarkMode ? '#334155' : '#E0E7FF' }],
                            ]}>
                                <Text style={[
                                    styles.bubbleText,
                                    msg.role === 'ai' && { color: colors.text }
                                ]}>
                                    {msg.text}
                                </Text>
                            </View>
                            <Text style={[styles.timeStamp, {
                                color: colors.textSecondary,
                                textAlign: msg.role === 'user' ? 'right' : 'left',
                            }]}>
                                {formatTime(msg.timestamp)}
                            </Text>
                        </View>
                        {msg.role === 'user' && (
                            <View style={[styles.miniAvatar, { backgroundColor: isDarkMode ? '#4F46E5' : '#6366F1' }]}>
                                <Ionicons name="person" size={14} color="#fff" />
                            </View>
                        )}
                    </View>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                    <View style={[styles.messageRow, styles.messageRowAI]}>
                        <View style={[styles.miniAvatar, { backgroundColor: '#6366F1' }]}>
                            <Text style={{ fontSize: 12 }}>🤖</Text>
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

            {/* Input */}
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
                        maxLength={500}
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
                    ⚠️ للاستشارة الطبية فقط — لا يغني عن الطبيب
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
        paddingBottom: 14,
        paddingHorizontal: 16,
        paddingTop: 8,
        borderBottomWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
        gap: 12,
    },
    aiAvatarBig: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiAvatarEmoji: { fontSize: 24 },
    headerTitle: {
        fontSize: 17,
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
        fontSize: 13,
    },
    chatBox: { flex: 1 },
    chatBoxContent: { padding: 16 },
    emptyState: {
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 16,
    },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
    emptySubtext: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
    suggestionsContainer: { width: '100%', gap: 10 },
    suggestionsLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4, textAlign: 'center' },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
    },
    suggestionText: { fontSize: 14, fontWeight: '500', flex: 1 },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 12,
        gap: 8,
    },
    messageRowUser: { justifyContent: 'flex-end' },
    messageRowAI: { justifyContent: 'flex-start' },
    miniAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    bubbleWrapper: { maxWidth: '78%' },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
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
        fontSize: 15,
        lineHeight: 23,
    },
    timeStamp: {
        fontSize: 11,
        marginTop: 4,
        opacity: 0.7,
        paddingHorizontal: 4,
    },
    inputWrapper: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderTopWidth: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1.5,
        minHeight: 52,
    },
    input: {
        flex: 1,
        paddingHorizontal: 8,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    disclaimer: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 8,
        opacity: 0.7,
    },
});

export default ChatAI;
