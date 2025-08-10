// screens/Auth/RegisterScreen.tsx
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
import { signUpUser, saveUserToFirestore } from '../../services/authService';
import CustomInput from '../../components/CustomInput';
import { validateRegisterFields } from '../../validations/authValidations';
import { getFirebaseErrorMessage } from '../../validations/errorMessages';

const { width } = Dimensions.get('window');

const RegisterScreen = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigation = useNavigation();

    const handleRegister = async () => {
        // التحقق من المدخلات
        const validationError = validateRegisterFields(firstName, lastName, email, password, confirmPassword);
        if (validationError) {
            Alert.alert('خطأ', validationError);
            return;
        }

        Keyboard.dismiss();

        try {
            const userCredential = await signUpUser(email, password);
            await saveUserToFirestore(userCredential.user.uid, email, firstName, lastName);
            Alert.alert('تم', 'تم إنشاء حسابك بنجاح. الرجاء التحقق من بريدك الإلكتروني لتفعيل الحساب.');
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('خطأ', getFirebaseErrorMessage(error.code));
        }
    };

    // إعادة الحقول للوضع الافتراضي عند مغادرة الشاشة
    useFocusEffect(
        useCallback(() => {
            return () => {
                setFirstName('');
                setLastName('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
            };
        }, [])
    );

    const isFormComplete = firstName && lastName && email && password && confirmPassword;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>إنشاء حساب جديد</Text>

            <CustomInput placeholder="الاسم الأول" value={firstName} onChangeText={setFirstName} />
            <CustomInput placeholder="اسم العائلة" value={lastName} onChangeText={setLastName} />
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
            <CustomInput
                placeholder="تأكيد كلمة السر"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            <TouchableOpacity
                style={[styles.registerButton, !isFormComplete && styles.disabledButton]}
                onPress={handleRegister}
                disabled={!isFormComplete}
            >
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
        padding: width * 0.05,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: width * 0.06,
        fontWeight: 'bold',
        marginBottom: width * 0.05,
    },
    registerButton: {
        width: '100%',
        backgroundColor: '#007AFF',
        padding: width * 0.04,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: width * 0.05,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    registerButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: width * 0.045,
    },
    backToLogin: {
        color: '#007AFF',
        marginTop: width * 0.03,
        fontSize: width * 0.04,
    },
});

export default RegisterScreen;
