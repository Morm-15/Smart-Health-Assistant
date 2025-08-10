import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Dimensions,
    Keyboard,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { saveUserToFirestore } from '../../services/authService';
import { AuthStackParamList } from '../../navigation/types';
import AppLogo from "../../components/AppLogo";
import CustomInput from "../../components/CustomInput";
import { validateLoginFields } from '../../validations/authValidations';
import { getFirebaseErrorMessage } from '../../validations/errorMessages';

const { width } = Dimensions.get('window');

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation<LoginScreenNavigationProp>();

    const handleLogin = async () => {
        const validationError = validateLoginFields(email, password);
        if (validationError) {
            Alert.alert('خطأ', validationError);
            return;
        }

        Keyboard.dismiss();

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.emailVerified) {
                Alert.alert('تحقق', 'الرجاء تأكيد بريدك الإلكتروني قبل تسجيل الدخول.');
                return;
            }
            navigation.navigate('Home');
        } catch (error: any) {
            Alert.alert('خطأ', getFirebaseErrorMessage(error.code));
        }
    };

    useFocusEffect(
        useCallback(() => {
            return () => {
                setEmail('');
                setPassword('');
            };
        }, [])
    );

    return (
        <View style={styles.container}>
            <AppLogo />
            <Text style={styles.welcomeText}>مرحباً بعودتك!</Text>

            <CustomInput
                placeholder="البريد الإلكتروني"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
            />
            <CustomInput
                placeholder="كلمة السر"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotPassword}>هل نسيت كلمة السر؟</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.loginButton,
                    (!email || !password) && { backgroundColor: '#ccc' }
                ]}
                onPress={handleLogin}
                disabled={!email || !password}
            >
                <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
            </TouchableOpacity>

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
        padding: width * 0.05,
        backgroundColor: '#fff',
    },
    welcomeText: {
        fontSize: width * 0.06,
        fontWeight: 'bold',
        marginBottom: width * 0.05,
    },
    forgotPassword: {
        color: '#007AFF',
        marginBottom: width * 0.05,
        textAlign: 'right',
        width: '100%',
    },
    loginButton: {
        width: '100%',
        backgroundColor: '#007AFF',
        padding: width * 0.04,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: width * 0.05,
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: width * 0.045,
    },
    signUpText: {
        color: '#007AFF',
        marginTop: width * 0.03,
        fontSize: width * 0.04,
    },
});

export default LoginScreen;
