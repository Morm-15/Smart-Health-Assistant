import React, { useRef, useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Alert,
    Keyboard, ActivityIndicator, KeyboardAvoidingView,
    Platform, ScrollView, TextInput, Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signInWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { auth } from '../../firebase';
import { AuthStackParamList } from '../../navigation/types';
import { validateLoginFields } from '../../validations/authValidations';
import { getFirebaseErrorMessage } from '../../validations/errorMessages';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const navigation = useNavigation<LoginNav>();
    const { t } = useTranslation();
    const { colors, isDarkMode } = useTheme();
    const passwordRef = useRef<TextInput>(null);

    const handleLogin = async () => {
        const error = validateLoginFields(email, password);
        if (error) { Alert.alert(t('error'), error); return; }
        Keyboard.dismiss();
        setLoading(true);
        try {
            const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

            // ✅ تحديث بيانات المستخدم من Firebase للحصول على أحدث حالة للتأكيد
            await cred.user.reload();
            const isVerified = auth.currentUser?.emailVerified;

            if (!isVerified) {
                await signOut(auth);
                Alert.alert(
                    t('verifyEmailTitle'),
                    t('verifyEmailMessage'),
                    [
                        {
                            text: 'إعادة إرسال رابط التأكيد',
                            onPress: async () => {
                                try {
                                    const temp = await signInWithEmailAndPassword(auth, email.trim(), password);
                                    await sendEmailVerification(temp.user);
                                    await signOut(auth);
                                    Alert.alert(t('success'), 'تم إرسال رابط تأكيد جديد إلى بريدك.');
                                } catch { }
                            }
                        },
                        { text: t('common.cancel'), style: 'cancel' },
                    ]
                );
                return;
            }
            // ✅ مسجّل ومؤكد — AppNavigator سيتولى التوجيه تلقائياً
        } catch (err: any) {
            const code = err?.code || 'unknown';
            Alert.alert(t('error'), getFirebaseErrorMessage(code));
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => {
        return () => { setEmail(''); setPassword(''); };
    }, []));

    // ألوان ديناميكية
    const bg = isDarkMode ? '#0B0F1A' : '#F0F4FF';
    const cardBg = isDarkMode ? '#151C2C' : '#FFFFFF';
    const inputBg = isDarkMode ? '#0B0F1A' : '#F8FAFF';
    const borderColor = isDarkMode ? '#1E293B' : '#E2E8F0';
    const borderFocused = '#6366F1';
    const textColor = isDarkMode ? '#F1F5F9' : '#1E293B';
    const labelColor = isDarkMode ? '#94A3B8' : '#475569';
    const subtitleColor = isDarkMode ? '#64748B' : '#94A3B8';
    const dividerColor = isDarkMode ? '#1E293B' : '#E2E8F0';
    const iconBg = isDarkMode ? '#1E293B' : '#EEF2FF';
    const cardShadow = isDarkMode ? '#000' : '#6366F1';

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top', 'bottom']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ─── Header ─── */}
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.iconText}>🏥</Text>
                        </View>
                        <Text style={[styles.appName, { color: textColor }]}>Smart Health</Text>
                        <Text style={[styles.appSub, { color: subtitleColor }]}>
                            {t('home.welcome')}
                        </Text>
                    </View>

                    {/* ─── Card ─── */}
                    <View style={[styles.card, {
                        backgroundColor: cardBg,
                        shadowColor: cardShadow,
                    }]}>
                        <Text style={[styles.cardTitle, { color: textColor }]}>{t('welcomeBack')}</Text>
                        <Text style={[styles.cardSub, { color: subtitleColor }]}>
                            {t('login')}
                        </Text>

                        {/* Email */}
                        <Text style={[styles.label, { color: labelColor }]}>{t('email')}</Text>
                        <View style={[
                            styles.inputWrap,
                            { backgroundColor: inputBg, borderColor: focusedField === 'email' ? borderFocused : borderColor }
                        ]}>
                            <View style={[styles.inputIconWrap, { backgroundColor: iconBg }]}>
                                <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? '#6366F1' : '#94A3B8'} />
                            </View>
                            <TextInput
                                style={[styles.input, { color: textColor }]}
                                placeholder="example@email.com"
                                placeholderTextColor={subtitleColor}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                                onSubmitEditing={() => passwordRef.current?.focus()}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>

                        {/* Password */}
                        <Text style={[styles.label, { color: labelColor }]}>{t('password')}</Text>
                        <View style={[
                            styles.inputWrap,
                            { backgroundColor: inputBg, borderColor: focusedField === 'password' ? borderFocused : borderColor }
                        ]}>
                            <View style={[styles.inputIconWrap, { backgroundColor: iconBg }]}>
                                <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? '#6366F1' : '#94A3B8'} />
                            </View>
                            <TextInput
                                ref={passwordRef}
                                style={[styles.input, { color: textColor, flex: 1 }]}
                                placeholder="••••••••"
                                placeholderTextColor={subtitleColor}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
                                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        {/* Forgot */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('ForgotPassword')}
                            style={styles.forgotWrap}
                        >
                            <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
                        </TouchableOpacity>

                        {/* Login Btn */}
                        <TouchableOpacity
                            style={[styles.btn, (!email || !password || loading) && styles.btnDisabled]}
                            onPress={handleLogin}
                            disabled={!email || !password || loading}
                            activeOpacity={0.85}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <>
                                    <Text style={styles.btnText}>{t('login')}</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                                </>
                            }
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={[styles.divLine, { backgroundColor: dividerColor }]} />
                            <Text style={[styles.divText, { color: subtitleColor }]}>أو</Text>
                            <View style={[styles.divLine, { backgroundColor: dividerColor }]} />
                        </View>

                        {/* Register */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Register')}
                            style={styles.linkWrap}
                        >
                            <Text style={[styles.linkText, { color: subtitleColor }]}>
                                {t('createAccount')} ←{' '}
                            </Text>
                            <Text style={styles.linkBold}>{t('createNewAccount')}</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { flexGrow: 1, paddingBottom: 32 },

    header: { alignItems: 'center', paddingTop: 36, paddingBottom: 28 },
    iconCircle: {
        width: 86, height: 86, borderRadius: 43,
        backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35, shadowRadius: 16, elevation: 10, marginBottom: 14,
    },
    iconText: { fontSize: 40 },
    appName: { fontSize: 26, fontWeight: '800', letterSpacing: 0.3 },
    appSub: { fontSize: 14, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },

    card: {
        marginHorizontal: 20, borderRadius: 28, padding: 24,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12, shadowRadius: 24, elevation: 8,
    },
    cardTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
    cardSub: { fontSize: 14, textAlign: 'center', marginBottom: 16, marginTop: 4 },

    label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 12 },

    inputWrap: {
        flexDirection: 'row', alignItems: 'center',
        height: 54, borderWidth: 1.5,
        borderRadius: 14, paddingRight: 14, marginBottom: 2,
        overflow: 'hidden',
    },
    inputIconWrap: {
        width: 46, height: '100%',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 4,
    },
    input: { flex: 1, fontSize: 15, height: '100%' },
    eyeBtn: { padding: 6 },

    forgotWrap: { alignSelf: 'flex-end', marginVertical: 12 },
    forgotText: { fontSize: 13, color: '#6366F1', fontWeight: '600' },

    btn: {
        height: 54, backgroundColor: '#6366F1', borderRadius: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6, marginTop: 4,
    },
    btnDisabled: { backgroundColor: '#C7D2FE', shadowOpacity: 0, elevation: 0 },
    btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    divLine: { flex: 1, height: 1 },
    divText: { marginHorizontal: 12, fontSize: 14 },

    linkWrap: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
    linkText: { fontSize: 14 },
    linkBold: { fontSize: 14, color: '#6366F1', fontWeight: '700' },
});

export default LoginScreen;
