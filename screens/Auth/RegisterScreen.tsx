// screens/Auth/RegisterScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../../firebase'; // مسار ملف Firebase

const RegisterScreen = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigation = useNavigation();

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            Alert.alert('خطأ', 'كلمة المرور وتأكيدها غير متطابقتين.');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);
            Alert.alert(
                'تم',
                'تم إنشاء حسابك بنجاح. الرجاء التحقق من بريدك الإلكتروني لتفعيل الحساب.'
            );
            navigation.goBack(); // العودة إلى شاشة تسجيل الدخول
        } catch (error: any) {
            Alert.alert('خطأ', error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>إنشاء حساب جديد</Text>

            <TextInput
                style={styles.input}
                placeholder="الاسم الأول"
                value={firstName}
                onChangeText={setFirstName}
            />
            <TextInput
                style={styles.input}
                placeholder="اسم العائلة"
                value={lastName}
                onChangeText={setLastName}
            />
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
                placeholder="كلمة السر"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TextInput
                style={styles.input}
                placeholder="تأكيد كلمة السر"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
                <Text style={styles.registerButtonText}>إنشاء حساب</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backToLogin}>العودة إلى تسجيل الدخول</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        textAlign: 'right',
    },
    registerButton: {
        width: '100%',
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    registerButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    backToLogin: {
        color: '#007AFF',
        marginTop: 10,
    },
});

export default RegisterScreen;