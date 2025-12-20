import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Alert, View, StatusBar, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import Header from '../components/Header';
import FeatureCard from '../components/FeatureCard';
import Footer from '../components/Footer';

const { height } = Dimensions.get('window');

type HomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Home'>;

const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { t } = useTranslation();
    const { colors, isDarkMode } = useTheme();
    const [userName, setUserName] = useState<string>('');

    useEffect(() => {
        const fetchUserName = async () => {
            try {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    const docRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(docRef);
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserName(data.firstName || t('home.greeting'));
                    }
                }
            } catch {
                Alert.alert(t('error'), t('home.errorFetchingUser'));
            }
        };

        fetchUserName();
    }, [t]);

    return (
        <View style={[styles.page, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={{ height: 20 }} />
                <Header
                    userName={userName}
                    onSettingsPress={() => navigation.navigate('Settings' as any)}
                />

                <View style={styles.cardsContainer}>
                    <FeatureCard
                        icon="chatbubble-ellipses-outline"
                        title={t('home.chatWithAI')}
                        color="#3B82F6"
                        onPress={() => navigation.navigate("ChatAI")}
                    />
                    <FeatureCard
                        icon="alarm-outline"
                        title={t('home.medicationReminder')}
                        color="#F59E0B"
                        onPress={() => navigation.navigate('AddMedicationScreen')}
                    />
                    <FeatureCard
                        icon="medkit-outline"
                        title={t('home.manageMedications')}
                        color="#10B981"
                        onPress={() => navigation.navigate('ManageMedicationsScreen')}
                    />
                    <FeatureCard
                        icon="camera-outline"
                        title={t('home.skinDiseaseDetection')}
                        color="#8B5CF6"
                        onPress={() => navigation.navigate('SkinDiseaseCamera')}
                    />
                </View>
            </ScrollView>

            <Footer
                onHomePress={() => navigation.navigate('Home')}
                onSettingsPress={() => navigation.navigate('Settings' as any)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    page: {
        flex: 1,
    },
    container: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        flexGrow: 1,
    },
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingHorizontal: 4,
    },
});

export default HomeScreen;
