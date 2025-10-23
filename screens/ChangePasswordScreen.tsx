import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import BackButton from '../components/BackButton';

const ChangePasswordScreen = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { colors } = useTheme();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const validatePasswords = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert(t('medication.warning'), t('changePassword.allFieldsRequired'));
            return false;
        }

        if (newPassword.length < 6) {
            Alert.alert(t('medication.warning'), t('changePassword.passwordTooShort'));
            return false;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert(t('medication.warning'), t('changePassword.passwordMismatch'));
            return false;
        }

        if (currentPassword === newPassword) {
            Alert.alert(t('medication.warning'), t('changePassword.passwordSameAsCurrent'));
            return false;
        }

        return true;
    };

    const handleChangePassword = async () => {
        if (!validatePasswords()) return;

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user || !user.email) {
                throw new Error('User not found');
            }

            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            Alert.alert(
                t('success'),
                t('changePassword.passwordChanged'),
                [{ text: t('common.done'), onPress: () => navigation.goBack() }]
            );

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error('Error changing password:', error);
            let errorMessage = t('changePassword.errorChangingPassword');

            if (error.code === 'auth/wrong-password') {
                errorMessage = t('changePassword.wrongPassword');
            } else if (error.code === 'auth/weak-password') {
                errorMessage = t('changePassword.weakPassword');
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = t('changePassword.recentLoginRequired');
            }

            Alert.alert(t('error'), errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <BackButton />
            <Text style={[styles.title, { color: colors.text }]}>{t('changePassword.title')}</Text>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>{t('changePassword.currentPassword')}</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder={t('changePassword.enterCurrentPassword')}
                                placeholderTextColor={colors.textSecondary}
                                secureTextEntry={!showCurrentPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                                <Ionicons
                                    name={showCurrentPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={22}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>{t('changePassword.newPassword')}</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed" size={20} color={colors.primary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder={t('changePassword.enterNewPassword')}
                                placeholderTextColor={colors.textSecondary}
                                secureTextEntry={!showNewPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                <Ionicons
                                    name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={22}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.helperText, { color: colors.textSecondary }]}>{t('changePassword.minLength')}</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>{t('changePassword.confirmNewPassword')}</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed" size={20} color={colors.primary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder={t('changePassword.reenterNewPassword')}
                                placeholderTextColor={colors.textSecondary}
                                secureTextEntry={!showConfirmPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                <Ionicons
                                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={22}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.tipsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.tipsTitle, { color: colors.primary }]}>{t('changePassword.securityTips')}</Text>
                        <Text style={[styles.tipText, { color: colors.text }]}>{t('changePassword.tip1')}</Text>
                        <Text style={[styles.tipText, { color: colors.text }]}>{t('changePassword.tip2')}</Text>
                        <Text style={[styles.tipText, { color: colors.text }]}>{t('changePassword.tip3')}</Text>
                        <Text style={[styles.tipText, { color: colors.text }]}>{t('changePassword.tip4')}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.changeButton, loading && styles.changeButtonDisabled]}
                        onPress={handleChangePassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="shield-checkmark" size={24} color="#fff" />
                                <Text style={styles.changeButtonText}>{t('changePassword.changeButton')}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 60,
        marginBottom: 20,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    formContainer: {
        paddingTop: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
    },
    helperText: {
        fontSize: 12,
        marginTop: 5,
        marginLeft: 5,
    },
    tipsContainer: {
        padding: 15,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 20,
        borderWidth: 1,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    tipText: {
        fontSize: 14,
        marginBottom: 5,
        lineHeight: 20,
    },
    changeButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#34C759',
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 40,
        shadowColor: '#34C759',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    changeButtonDisabled: {
        backgroundColor: '#999',
    },
    changeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default ChangePasswordScreen;
