import React, { useState, useRef, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Text, ScrollView, StyleSheet, Keyboard, StatusBar } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { sendToGemini } from "../services/geminiService";
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BackButton from "../components/BackButton";

const ChatAI = () => {
    const { t } = useTranslation();
    const { colors, isDarkMode } = useTheme();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const handleSend = async () => {
        if (!input.trim()) return;

        setMessages((prev) => [...prev, { role: "user", text: input }]);

        const prompt = input;
        setInput("");
        setIsTyping(true);

        try {
            const reply = await sendToGemini(prompt);
            setMessages((prev) => [...prev, { role: "ai", text: reply }]);
        } catch (error) {
            setMessages((prev) => [...prev, { role: "ai", text: t('chat.errorMessage') }]);
        } finally {
            setIsTyping(false);
        }

        Keyboard.dismiss();
    };

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages, isTyping]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <StatusBar
                barStyle={isDarkMode ? "light-content" : "dark-content"}
                backgroundColor={colors.background}
                translucent={false}
            />

            {/* Header with gradient */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <BackButton/>
                <View style={styles.headerContent}>
                    <View style={[styles.aiAvatar, { backgroundColor: isDarkMode ? '#667eea' : '#007AFF' }]}>
                        <Text style={styles.aiAvatarText}>🤖</Text>
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('chat.title')}</Text>
                        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                            {isTyping ? t('chat.typing_indicator') : t('chat.connected')}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Messages Area with improved padding */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.chatBox}
                contentContainerStyle={styles.chatBoxContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateEmoji}>💬</Text>
                        <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                            {t('chat.startConversation')}
                        </Text>
                        <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: 14, marginTop: 8 }]}>
                            {t('chat.medicalAssistant')}
                        </Text>
                    </View>
                )}

                {messages.map((msg, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.bubble,
                            msg.role === "user" ? styles.userBubble : [styles.aiBubble, { backgroundColor: colors.surface }],
                        ]}
                    >
                        <Text style={[styles.bubbleText, msg.role === "ai" && { color: colors.text }]}>
                            {msg.text}
                        </Text>
                        <Text style={[styles.timeStamp, msg.role === "user" ? styles.userTimeStamp : { color: colors.textSecondary }]}>
                            {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                ))}

                {isTyping && (
                    <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.surface }]}>
                        <View style={styles.typingIndicator}>
                            <View style={[styles.typingDot, { backgroundColor: colors.primary }]} />
                            <View style={[styles.typingDot, { backgroundColor: colors.primary }]} />
                            <View style={[styles.typingDot, { backgroundColor: colors.primary }]} />
                        </View>
                    </View>
                )}
                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Modern Input Container */}
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <TextInput
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
                    <TouchableOpacity
                        style={[styles.sendButton, { opacity: input.trim() ? 1 : 0.5 }]}
                        onPress={handleSend}
                        disabled={!input.trim()}
                    >
                        <Ionicons name="send" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: 15,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 50,
    },
    aiAvatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiAvatarText: {
        fontSize: 24,
    },
    headerTextContainer: {
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    chatBox: {
        flex: 1,
    },
    chatBoxContent: {
        padding: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyStateEmoji: {
        fontSize: 60,
        marginBottom: 12,
    },
    emptyStateText: {
        fontSize: 16,
        textAlign: 'center',
    },
    bubble: {
        marginBottom: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        maxWidth: "80%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    userBubble: {
        alignSelf: "flex-end",
        backgroundColor: "#007AFF",
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        alignSelf: "flex-start",
        borderBottomLeftRadius: 4,
    },
    bubbleText: {
        color: "#fff",
        fontSize: 15,
        lineHeight: 22,
    },
    timeStamp: {
        fontSize: 11,
        marginTop: 4,
        opacity: 0.7,
    },
    userTimeStamp: {
        color: '#fff',
        textAlign: 'right',
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        opacity: 0.6,
    },
    inputWrapper: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 16,
        borderTopWidth: 1,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        borderRadius: 25,
        borderWidth: 1,
        minHeight: 50,
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        backgroundColor: "#007AFF",
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});

export default ChatAI;
