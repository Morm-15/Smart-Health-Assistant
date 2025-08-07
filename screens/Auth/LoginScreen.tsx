// screens/Auth/LoginScreen.tsx
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppLogo from '../../components/AppLogo';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase'; // مسار ملف Firebase
import { AuthStackParamList } from '../../navigation/types'; // استيراد الأنواع من ملف types.ts

// ✅ تعريف نوع التنقل للشاشة الحالية
type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // ✅ استخدام النوع الذي تم تعريفه مع useNavigation
    const navigation = useNavigation<LoginScreenNavigationProp>();

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            Alert.alert('نجاح', 'تم تسجيل الدخول بنجاح!');
            // يمكنك هنا توجيه المستخدم إلى الشاشة الرئيسية
        } catch (error: any) {
            Alert.alert('خطأ', error.message);
        }
    };

    return (
        <View style={styles.container}>
            <AppLogo />
            <Text style={styles.welcomeText}>مرحباً بعودتك!</Text>

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

            <TouchableOpacity onPress={() => console.log('نسيت كلمة السر')}>
                <Text style={styles.forgotPassword}>هل نسيت كلمة السر؟</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
            </TouchableOpacity>

            {/* ✅ الآن TypeScript سيتأكد من أن "Register" هو اسم شاشة صحيح */}
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signUpText}>إنشاء حساب جديد</Text>
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
    welcomeText: {
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
    forgotPassword: {
        color: '#007AFF',
        marginBottom: 20,
        textAlign: 'right',
        width: '100%',
    },
    loginButton: {
        width: '100%',
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    signUpText: {
        color: '#007AFF',
        marginTop: 10,
    },
});

export default LoginScreen;