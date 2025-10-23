import React, { useState, useEffect } from 'react';
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
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import BackButton from '../components/BackButton';

const EditProfileScreen = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { colors } = useTheme();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                setEmail(currentUser.email || '');
                const docRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(docRef);
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setFirstName(data.firstName || '');
                    setLastName(data.lastName || '');
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            Alert.alert(t('error'), t('profile.errorLoading'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            Alert.alert(t('medication.warning'), t('profile.enterFullName'));
            return;
        }

        setSaving(true);
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const docRef = doc(db, 'users', currentUser.uid);
                await updateDoc(docRef, {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                });
                Alert.alert(t('success'), t('profile.profileUpdated'), [
                    { text: t('common.done'), onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert(t('error'), t('profile.errorSaving'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }, styles.centerContent]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>{t('profile.loadingData')}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <BackButton />
            <Text style={[styles.title, { color: colors.text }]}>{t('profile.title')}</Text>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.formContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>{t('firstName')}</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                value={firstName}
                                onChangeText={setFirstName}
                                placeholder={t('firstName')}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>{t('lastName')}</Text>
                        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                value={lastName}
                                onChangeText={setLastName}
                                placeholder={t('lastName')}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>{t('email')}</Text>
                        <View style={[styles.inputContainer, styles.disabledInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.textSecondary }]}
                                value={email}
                                editable={false}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                        <Text style={[styles.helperText, { color: colors.textSecondary }]}>{t('profile.emailReadOnly')}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
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
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 60,
        marginBottom: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
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
    disabledInput: {
        opacity: 0.6,
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
    saveButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 12,
        marginTop: 30,
        marginBottom: 40,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    saveButtonDisabled: {
        backgroundColor: '#999',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default EditProfileScreen;
