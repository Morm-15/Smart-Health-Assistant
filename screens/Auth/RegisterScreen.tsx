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
import { useTranslation } from 'react-i18next';
import BackButton from "../../components/BackButton";
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const RegisterScreen = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordHidden, setIsPasswordHidden] = useState(true);
    const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true);
    const navigation = useNavigation();
    const { t } = useTranslation();

    const handleRegister = async () => {
        const validationError = validateRegisterFields(firstName, lastName, email, password, confirmPassword);
        if (validationError) {
            Alert.alert(t('error'), validationError);
            return;
        }

        Keyboard.dismiss();

        try {
            const userCredential = await signUpUser(email, password);
            await saveUserToFirestore(userCredential.user.uid, email, firstName, lastName);
            Alert.alert(t('success'), t('accountCreatedMessage'));
            navigation.goBack();
        } catch (error: any) {
            Alert.alert(t('error'), getFirebaseErrorMessage(error.code));
        }
    };

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
            <BackButton/>
            <Text style={styles.title}>{t('createNewAccount')}</Text>

            <CustomInput placeholder={t('firstName')} value={firstName} onChangeText={setFirstName} />
            <CustomInput placeholder={t('lastName')} value={lastName} onChangeText={setLastName} />
            <CustomInput
                placeholder={t('email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
            />

            {/* Password field with eye icon */}
            <View style={styles.passwordContainer}>
                <CustomInput
                    placeholder={t('password')}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={isPasswordHidden}
                />
                <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setIsPasswordHidden(prev => !prev)}
                    accessibilityLabel={isPasswordHidden ? 'Show password' : 'Hide password'}
                >
                    <Ionicons name={isPasswordHidden ? 'eye-off' : 'eye'} size={24} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Confirm Password field with eye icon */}
            <View style={styles.passwordContainer}>
                <CustomInput
                    placeholder={t('confirmPassword')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={isConfirmPasswordHidden}
                />
                <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setIsConfirmPasswordHidden(prev => !prev)}
                    accessibilityLabel={isConfirmPasswordHidden ? 'Show password' : 'Hide password'}
                >
                    <Ionicons name={isConfirmPasswordHidden ? 'eye-off' : 'eye'} size={24} color="#666" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.registerButton, !isFormComplete && styles.disabledButton]}
                onPress={handleRegister}
                disabled={!isFormComplete}
            >
                <Text style={styles.registerButtonText}>{t('createAccount')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backToLogin}>{t('backToLogin')}</Text>
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
    passwordContainer: {
        width: '100%',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: width * 0.02,
    },
    eyeButton: {
        position: 'absolute',
        right: 15,
        alignSelf: 'center',
        zIndex: 2,
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default RegisterScreen;
