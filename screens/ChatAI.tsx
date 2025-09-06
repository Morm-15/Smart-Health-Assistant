import React, { useState, useRef, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Text, ScrollView, StyleSheet, Keyboard, Animated } from "react-native";
import { sendToGemini } from "../services/geminiService";

const ChatAI = () => {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
    const [isTyping, setIsTyping] = useState(false); // مؤشر الكتابة
    const scrollViewRef = useRef<ScrollView>(null);

    const handleSend = async () => {
        if (!input.trim()) return;

        // إضافة رسالة المستخدم
        setMessages((prev) => [...prev, { role: "user", text: input }]);

        const prompt = input;
        setInput("");
        setIsTyping(true); // تفعيل مؤشر الكتابة

        try {
            const reply = await sendToGemini(prompt);

            // إضافة رد AI
            setMessages((prev) => [...prev, { role: "ai", text: reply }]);
        } catch (error) {
            setMessages((prev) => [...prev, { role: "ai", text: "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي." }]);
        } finally {
            setIsTyping(false); // إخفاء مؤشر الكتابة
        }

        Keyboard.dismiss();
    };

    // Scroll تلقائي عند وصول رسالة جديدة أو تغيير مؤشر الكتابة
    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages, isTyping]);

    return (
        <View style={styles.container}>
            <ScrollView ref={scrollViewRef} style={styles.chatBox}>
                {messages.map((msg, idx) => (
                    <View
                        key={idx}
                        style={[
                            styles.bubble,
                            msg.role === "user" ? styles.userBubble : styles.aiBubble,
                        ]}
                    >
                        <Text style={[styles.bubbleText, msg.role === "ai" && { color: "#000" }]}>
                            {msg.role === "user" ? "👤" : "🤖"} {msg.text}
                        </Text>
                    </View>
                ))}

                {/* مؤشر الكتابة */}
                {isTyping && (
                    <View style={[styles.bubble, styles.aiBubble]}>
                        <Text style={[styles.bubbleText, { color: "#000" }]}>🤖 ...</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="اكتب رسالتك..."
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={handleSend} // إرسال عند Enter
                    returnKeyType="send"
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                    <Text style={styles.sendButtonText}>إرسال</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f0f0f0", padding: 10 },
    chatBox: { flex: 1 },
    bubble: {
        marginBottom: 10,
        padding: 10,
        borderRadius: 12,
        maxWidth: "80%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
    userBubble: {
        alignSelf: "flex-end",
        backgroundColor: "#0084ff",
    },
    aiBubble: {
        alignSelf: "flex-start",
        backgroundColor: "#e5e5ea",
    },
    bubbleText: {
        color: "#fff",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 5,
        paddingHorizontal: 5,
        backgroundColor: "#fff",
        borderRadius: 20,
    },
    input: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
    },
    sendButton: {
        backgroundColor: "#0084ff",
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginLeft: 5,
    },
    sendButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
});

export default ChatAI;
