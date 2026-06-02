import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, Alert,
    Keyboard, ActivityIndicator, KeyboardAvoidingView,
    Platform, ScrollView, TextInput, Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signUpUser, saveUserToFirestore } from '../../services/authService';
import { validateRegisterFields } from '../../validations/authValidations';
import { getFirebaseErrorMessage } from '../../validations/errorMessages';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../navigation/types';
import { useTheme } from '../../contexts/ThemeContext';

type RegisterNav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const navigation = useNavigation<RegisterNav>();
    const { t } = useTranslation();
    const { colors, isDarkMode } = useTheme();

    const handleRegister = async () => {
        const error = validateRegisterFields(firstName, lastName, email, password, confirmPassword);
        if (error) { Alert.alert(t('error'), error); return; }
        Keyboard.dismiss();
        setLoading(true);
        try {
            const cred = await signUpUser(email.trim(), password);
            await saveUserToFirestore(cred.user.uid, email.trim(), firstName.trim(), lastName.trim());
            Alert.alert(
                t('success'),
                t('accountCreatedMessage'),
                [{ text: t('common.done'), onPress: () => navigation.navigate('Login') }]
            );
        } catch (err: any) {
            Alert.alert(t('error'), getFirebaseErrorMessage(err.code));
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => {
        return () => {
            setFirstName(''); setLastName('');
            setEmail(''); setPassword(''); setConfirmPassword('');
        };
    }, []));

    const isComplete = firstName && lastName && email && password && confirmPassword;

    // ألوان ديناميكية
    const bg = isDarkMode ? '#0B0F1A' : '#F0F4FF';
    const cardBg = isDarkMode ? '#151C2C' : '#FFFFFF';
    const inputBg = isDarkMode ? '#0B0F1A' : '#F8FAFF';
    const borderColor = isDarkMode ? '#1E293B' : '#E2E8F0';
    const borderFocused = '#6366F1';
    const textColor = isDarkMode ? '#F1F5F9' : '#1E293B';
    const labelColor = isDarkMode ? '#94A3B8' : '#475569';
    const subtitleColor = isDarkMode ? '#64748B' : '#94A3B8';
    const iconBg = isDarkMode ? '#1E293B' : '#EEF2FF';
    const infoBoxBg = isDarkMode ? '#1E1B4B' : '#EEF2FF';
    const infoTextColor = isDarkMode ? '#818CF8' : '#4F46E5';

    const inputWrapStyle = (field: string) => ({
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        height: 54,
        borderWidth: 1.5,
        borderColor: focusedField === field ? borderFocused : borderColor,
        borderRadius: 14,
        paddingRight: 14,
        marginBottom: 2,
        backgroundColor: inputBg,
        overflow: 'hidden' as const,
    });

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top', 'bottom']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ─── Top Bar ─── */}
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            style={[styles.backBtn, { backgroundColor: iconBg, borderColor: isDarkMode ? '#334155' : '#C7D2FE' }]}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Ionicons name="arrow-back" size={22} color="#6366F1" />
                        </TouchableOpacity>
                    </View>

                    {/* ─── Header ─── */}
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.iconText}>👤</Text>
                        </View>
                        <Text style={[styles.title, { color: textColor }]}>{t('createNewAccount')}</Text>
                        <Text style={[styles.subtitle, { color: subtitleColor }]}>
                            {t('home.welcome')}
                        </Text>
                    </View>

                    {/* ─── Card ─── */}
                    <View style={[styles.card, { backgroundColor: cardBg, shadowColor: isDarkMode ? '#000' : '#6366F1' }]}>

                        {/* Name Row */}
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={[styles.label, { color: labelColor }]}>{t('firstName')}</Text>
                                <View style={inputWrapStyle('firstName')}>
                                    <View style={[styles.inputIconWrap, { backgroundColor: iconBg }]}>
                                        <Ionicons name="person-outline" size={16} color={focusedField === 'firstName' ? '#6366F1' : '#94A3B8'} />
                                    </View>
                                    <TextInput
                                        style={[styles.input, { color: textColor }]}
                                        placeholder="محمد"
                                        placeholderTextColor={subtitleColor}
                                        value={firstName}
                                        onChangeText={setFirstName}
                                        onFocus={() => setFocusedField('firstName')}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </View>
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={[styles.label, { color: labelColor }]}>{t('lastName')}</Text>
                                <View style={inputWrapStyle('lastName')}>
                                    <View style={[styles.inputIconWrap, { backgroundColor: iconBg }]}>
                                        <Ionicons name="person-outline" size={16} color={focusedField === 'lastName' ? '#6366F1' : '#94A3B8'} />
                                    </View>
                                    <TextInput
                                        style={[styles.input, { color: textColor }]}
                                        placeholder="أحمد"
                                        placeholderTextColor={subtitleColor}
                                        value={lastName}
                                        onChangeText={setLastName}
                                        onFocus={() => setFocusedField('lastName')}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Email */}
                        <Text style={[styles.label, { color: labelColor }]}>{t('email')}</Text>
                        <View style={inputWrapStyle('email')}>
                            <View style={[styles.inputIconWrap, { backgroundColor: iconBg }]}>
                                <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? '#6366F1' : '#94A3B8'} />
                            </View>
                            <TextInput
                                style={[styles.input, { color: textColor, flex: 1 }]}
                                placeholder="example@email.com"
                                placeholderTextColor={subtitleColor}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>

                        {/* Password */}
                        <Text style={[styles.label, { color: labelColor }]}>{t('password')}</Text>
                        <View style={inputWrapStyle('password')}>
                            <View style={[styles.inputIconWrap, { backgroundColor: iconBg }]}>
                                <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? '#6366F1' : '#94A3B8'} />
                            </View>
                            <TextInput
                                style={[styles.input, { color: textColor, flex: 1 }]}
                                placeholder="••••••••"
                                placeholderTextColor={subtitleColor}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
                                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        {/* Confirm Password */}
                        <Text style={[styles.label, { color: labelColor }]}>{t('confirmPassword')}</Text>
                        <View style={inputWrapStyle('confirm')}>
                            <View style={[styles.inputIconWrap, { backgroundColor: iconBg }]}>
                                <Ionicons name="shield-checkmark-outline" size={18} color={focusedField === 'confirm' ? '#6366F1' : '#94A3B8'} />
                            </View>
                            <TextInput
                                style={[styles.input, { color: textColor, flex: 1 }]}
                                placeholder="••••••••"
                                placeholderTextColor={subtitleColor}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                autoCapitalize="none"
                                onFocus={() => setFocusedField('confirm')}
                                onBlur={() => setFocusedField(null)}
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(p => !p)} style={styles.eyeBtn}>
                                <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        {/* Info */}
                        <View style={[styles.infoBox, { backgroundColor: infoBoxBg }]}>
                            <Ionicons name="information-circle-outline" size={18} color="#6366F1" />
                            <Text style={[styles.infoText, { color: infoTextColor }]}>
                                {t('accountCreatedMessage')}
                            </Text>
                        </View>

                        {/* Register Btn */}
                        <TouchableOpacity
                            style={[styles.btn, (!isComplete || loading) && styles.btnDisabled]}
                            onPress={handleRegister}
                            disabled={!isComplete || loading}
                            activeOpacity={0.85}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <>
                                    <Text style={styles.btnText}>{t('createAccount')}</Text>
                                    <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                                </>
                            }
                        </TouchableOpacity>

                        {/* Back to Login */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            style={styles.linkWrap}
                        >
                            <Text style={[styles.linkText, { color: subtitleColor }]}>{t('backToLogin')} ← </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scroll: { flexGrow: 1 },

    topBar: { paddingHorizontal: 20, paddingTop: 16, minHeight: 60 },
    backBtn: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
    },

    header: { alignItems: 'center', paddingBottom: 20 },
    iconCircle: {
        width: 76, height: 76, borderRadius: 38,
        backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 16, elevation: 10, marginBottom: 14,
    },
    iconText: { fontSize: 36 },
    title: { fontSize: 22, fontWeight: '800' },
    subtitle: { fontSize: 13, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },

    card: {
        marginHorizontal: 20, borderRadius: 28, padding: 24,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1, shadowRadius: 24, elevation: 8,
    },

    row: { flexDirection: 'row' },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 14 },

    inputIconWrap: {
        width: 46, height: '100%',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 4,
    },
    input: { flex: 1, fontSize: 15, height: '100%' },
    eyeBtn: { padding: 6 },

    infoBox: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        borderRadius: 12, padding: 12, marginTop: 16,
    },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18 },

    btn: {
        height: 54, backgroundColor: '#6366F1', borderRadius: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, marginTop: 16,
        shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    btnDisabled: { backgroundColor: '#C7D2FE', shadowOpacity: 0, elevation: 0 },
    btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

    linkWrap: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
    linkText: { fontSize: 14, fontWeight: '600' },
    linkBold: { fontSize: 14, color: '#6366F1', fontWeight: '700' },
});

export default RegisterScreen;
