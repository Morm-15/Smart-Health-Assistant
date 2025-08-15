import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('');
    const navigation = useNavigation();
    const { t } = useTranslation();

    const handleResetPassword = async () => {
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert(t('success'), t('resetPasswordEmailSent'));
            navigation.goBack();
        } catch (error: any) {
            Alert.alert(t('error'), error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('resetPasswordTitle')}</Text>
            <TextInput
                style={styles.input}
                placeholder={t('enterEmail')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
            />
            <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                <Text style={styles.buttonText}>{t('sendLink')}</Text>
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
    input: {
        width: '100%',
        height: width * 0.13,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: width * 0.04,
        marginBottom: width * 0.05,
        textAlign: 'right',
    },
    button: {
        width: '100%',
        backgroundColor: '#007AFF',
        padding: width * 0.04,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: width * 0.045,
    },
});

export default ForgotPasswordScreen;
