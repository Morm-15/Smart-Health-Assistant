import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFirebaseErrorMessage } from '../../validations/errorMessages';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthStackParamList } from '../../navigation/types';

type ForgotNav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(false);
    const navigation = useNavigation<ForgotNav>();
    const { t } = useTranslation();
    const { isDarkMode } = useTheme();

    const handleResetPassword = async () => {
        if (!email.trim()) {
            Alert.alert(t('error'), t('errors.missingEmail'));
            return;
        }
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email.trim());
            Alert.alert(
                t('success'),
                t('resetPasswordEmailSent'),
                [{ text: t('common.done'), onPress: () => navigation.navigate('Login') }]
            );
        } catch (error: any) {
            Alert.alert(t('error'), getFirebaseErrorMessage(error.code));
        } finally {
            setLoading(false);
        }
    };

    // ألوان ديناميكية
    const bg = isDarkMode ? '#0B0F1A' : '#F0F4FF';
    const cardBg = isDarkMode ? '#151C2C' : '#FFFFFF';
    const inputBg = isDarkMode ? '#0B0F1A' : '#F8FAFF';
    const borderColor = isDarkMode ? '#1E293B' : '#E2E8F0';
    const textColor = isDarkMode ? '#F1F5F9' : '#1E293B';
    const subtitleColor = isDarkMode ? '#64748B' : '#94A3B8';
    const labelColor = isDarkMode ? '#94A3B8' : '#475569';
    const iconBg = isDarkMode ? '#1E293B' : '#EEF2FF';

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: bg }]} edges={['top', 'bottom']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                    {/* Top Bar */}
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            style={[styles.backBtn, { backgroundColor: iconBg, borderColor: isDarkMode ? '#334155' : '#C7D2FE' }]}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Ionicons name="arrow-back" size={22} color="#6366F1" />
                        </TouchableOpacity>
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.iconEmoji}>🔐</Text>
                        </View>
                        <Text style={[styles.title, { color: textColor }]}>{t('resetPasswordTitle')}</Text>
                        <Text style={[styles.subtitle, { color: subtitleColor }]}>
                            {t('enterEmail')}
                        </Text>
                    </View>

                    {/* Card */}
                    <View style={[styles.card, {
                        backgroundColor: cardBg,
                        shadowColor: isDarkMode ? '#000' : '#6366F1',
                    }]}>

                        <Text style={[styles.label, { color: labelColor }]}>{t('email')}</Text>
                        <View style={[
                            styles.inputWrap,
                            {
                                backgroundColor: inputBg,
                                borderColor: focusedField ? '#6366F1' : borderColor,
                            }
                        ]}>
                            <View style={[styles.inputIconWrap, { backgroundColor: iconBg }]}>
                                <Ionicons name="mail-outline" size={18} color={focusedField ? '#6366F1' : '#94A3B8'} />
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
                                returnKeyType="done"
                                onSubmitEditing={handleResetPassword}
                                onFocus={() => setFocusedField(true)}
                                onBlur={() => setFocusedField(false)}
                            />
                        </View>

                        {/* Info box */}
                        <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF' }]}>
                            <Ionicons name="information-circle-outline" size={18} color="#6366F1" />
                            <Text style={[styles.infoText, { color: isDarkMode ? '#818CF8' : '#4F46E5' }]}>
                                سيصلك رابط على بريدك الإلكتروني لإعادة تعيين كلمة المرور
                            </Text>
                        </View>

                        {/* Send Button */}
                        <TouchableOpacity
                            style={[styles.btn, (!email.trim() || loading) && styles.btnDisabled]}
                            onPress={handleResetPassword}
                            disabled={!email.trim() || loading}
                            activeOpacity={0.85}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <>
                                    <Text style={styles.btnText}>{t('sendLink')}</Text>
                                    <Ionicons name="send-outline" size={20} color="#fff" />
                                </>
                            }
                        </TouchableOpacity>

                        {/* Back to Login */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Login')}
                            style={styles.linkWrap}
                        >
                            <Ionicons name="arrow-back" size={14} color="#6366F1" />
                            <Text style={styles.linkText}>{t('backToLogin')}</Text>
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

    topBar: { paddingHorizontal: 20, paddingTop: 16, minHeight: 60 },
    backBtn: {
        width: 44, height: 44, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
    },

    header: { alignItems: 'center', paddingVertical: 28 },
    iconCircle: {
        width: 86, height: 86, borderRadius: 43,
        backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35, shadowRadius: 16, elevation: 10, marginBottom: 16,
    },
    iconEmoji: { fontSize: 40 },
    title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
    subtitle: { fontSize: 14, marginTop: 6, textAlign: 'center', paddingHorizontal: 30 },

    card: {
        marginHorizontal: 20, borderRadius: 28, padding: 24,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12, shadowRadius: 24, elevation: 8,
    },

    label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },

    inputWrap: {
        flexDirection: 'row', alignItems: 'center',
        height: 54, borderWidth: 1.5,
        borderRadius: 14, marginBottom: 2, overflow: 'hidden',
    },
    inputIconWrap: {
        width: 46, height: '100%',
        alignItems: 'center', justifyContent: 'center', marginRight: 4,
    },
    input: { flex: 1, fontSize: 15, height: '100%' },

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

    linkWrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 18 },
    linkText: { fontSize: 14, color: '#6366F1', fontWeight: '600' },
});

export default ForgotPasswordScreen;
