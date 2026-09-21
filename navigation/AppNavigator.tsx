import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatAI from "../screens/ChatAI";
import AddMedicationScreen from "../screens/AddMedicationScreen";
import ManageMedicationsScreen from "../screens/ManageMedicationsScreen";
import SkinDiseaseCameraScreen from "../screens/SkinDiseaseCameraScreen";
import SettingsScreen from "../screens/SettingsScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import TestNotificationsScreen from "../screens/TestNotificationsScreen";
import MedicalDevicesGuideScreen from "../screens/MedicalDevicesGuideScreen";
import LabReportAnalyzerScreen from "../screens/LabReportAnalyzerScreen";
import DrugInteractionScreen from "../screens/DrugInteractionScreen";
import FirstAidGuideScreen from "../screens/FirstAidGuideScreen";
import { AuthStackParamList } from './types';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AppNavigator = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    // تحديث بيانات المستخدم من الخادم للحصول على أحدث emailVerified
                    await currentUser.reload();
                } catch {}
                // فقط يُعتبر مسجلاً دخوله إذا تم تأكيد البريد الإلكتروني
                if (currentUser.emailVerified) {
                    setUser(currentUser);
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    // User is logged in - Show Main App Screens
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="ChatAI" component={ChatAI} />
                        <Stack.Screen name="AddMedicationScreen" component={AddMedicationScreen} />
                        <Stack.Screen name="ManageMedicationsScreen" component={ManageMedicationsScreen} />
                        <Stack.Screen name="SkinDiseaseCamera" component={SkinDiseaseCameraScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                        <Stack.Screen name="TestNotifications" component={TestNotificationsScreen} />
                        <Stack.Screen name="MedicalDevicesGuide" component={MedicalDevicesGuideScreen} />
                        <Stack.Screen name="LabReportAnalyzer" component={LabReportAnalyzerScreen} />
                        <Stack.Screen name="DrugInteraction" component={DrugInteractionScreen} />
                        <Stack.Screen name="FirstAidGuide" component={FirstAidGuideScreen} />
                    </>
                ) : (
                    // User is not logged in - Show Auth Screens
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
    },
});

export default AppNavigator;
