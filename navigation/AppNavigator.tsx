import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import ChatAI from "../screens/ChatAI";
import AddMedicationScreen from "../screens/AddMedicationScreen";
import { AuthStackParamList } from './types';
import SkinDiseaseCameraScreen from "../screens/SkinDiseaseCameraScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ChatAI" component={ChatAI} />
            <Stack.Screen name="AddMedicationScreen" component={AddMedicationScreen} />
            <Stack.Screen name="SkinDiseaseCamera" component={SkinDiseaseCameraScreen} />
        </Stack.Navigator>
    );
};

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <AuthStack />
        </NavigationContainer>
    );
};

export default AppNavigator;
