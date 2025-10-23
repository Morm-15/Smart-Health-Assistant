import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Dimensions,
    Keyboard,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { auth } from '../../firebase';
import { AuthStackParamList } from '../../navigation/types';
import AppLogo from '../../components/AppLogo';
import CustomInput from '../../components/CustomInput';
import LanguagePicker from '../../components/LanguagePicker';
import { validateLoginFields } from '../../validations/authValidations';
import { getFirebaseErrorMessage } from '../../validations/errorMessages';

const { width } = Dimensions.get('window');

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordHidden, setIsPasswordHidden] = useState(true);
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const { t } = useTranslation();

    const passwordRef = useRef<TextInput>(null);

    const handleLogin = async () => {
        const validationError = validateLoginFields(email, password);
        if (validationError) {
            Alert.alert(t('error'), validationError);
            return;
        }

        Keyboard.dismiss();
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.emailVerified) {
                Alert.alert(t('verifyEmailTitle'), t('verifyEmailMessage'));
                setLoading(false);
                return;
            }
            // التنقل سيحدث تلقائياً عند تغيير حالة المستخدم
        } catch (error: any) {
            Alert.alert(t('error'), getFirebaseErrorMessage(error.code));
        } finally {
            setLoading(false);
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
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                <View style={styles.container}>
                    <AppLogo />
                    <Text style={styles.welcomeText}>{t('welcomeBack')}</Text>

                    <LanguagePicker />

                    {/* Email field */}
                    <CustomInput
                        placeholder={t('email')}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={() => passwordRef.current?.focus()} // عند الضغط على زر Next/✔ يذهب للحقل التالي
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    {/* Password field with centered eye icon */}
                    <View style={styles.passwordContainer}>
                        <CustomInput
                            ref={passwordRef}
                            placeholder={t('password')}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={isPasswordHidden}
                            returnKeyType="done"
                            onSubmitEditing={handleLogin} // عند الضغط على Done في الكيبورد ينفّذ تسجيل الدخول
                            autoCapitalize="none"
                        />
                        <TouchableOpacity
                            style={styles.eyeButton}
                            onPress={() => setIsPasswordHidden(prev => !prev)}
                            accessibilityLabel={isPasswordHidden ? 'Show password' : 'Hide password'}
                        >
                            <Ionicons name={isPasswordHidden ? 'eye-off' : 'eye'} size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                        <Text style={styles.forgotPassword}>{t('forgotPassword')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            (!email || !password || loading) && { backgroundColor: '#ccc' },
                        ]}
                        onPress={handleLogin}
                        disabled={!email || !password || loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>{t('login')}</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.signUpText}>{t('createAccount')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
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
        width: '100%',
        textAlign: 'left',
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
    passwordContainer: {
        width: '100%',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: width * 0.02,
    },
    eyeButton: {
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: [{ translateY: -12 }], // يُوسط الأيقونة عمودياً داخل الحقل
        zIndex: 2,
        padding: 6,
    },
});

export default LoginScreen;
