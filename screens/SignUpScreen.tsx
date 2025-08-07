// screens/SignUpScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { signUpUser } from '../services/authService'; // استدعاء الخدمة

const SignUpScreen: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const handleSignUp = async () => {
        try {
            await signUpUser(email, password);
            Alert.alert('✅ تم التسجيل بنجاح!', 'تم إرسال رابط التحقق إلى بريدك الإلكتروني. يرجى التحقق منه.');
        } catch (error: any) {
            Alert.alert('❌ خطأ في التسجيل:', error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>إنشاء حساب</Text>
            <TextInput
                style={styles.input}
                placeholder="البريد الإلكتروني"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="كلمة المرور"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title="إنشاء حساب" onPress={handleSignUp} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        marginTop: 100,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 15,
        padding: 10,
        borderRadius: 5,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
    },
});

export default SignUpScreen;
