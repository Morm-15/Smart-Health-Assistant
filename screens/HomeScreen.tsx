import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Alert, View, StatusBar, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import FeatureCard from '../components/FeatureCard';
import Footer from '../components/Footer';

const { height } = Dimensions.get('window');

type HomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Home'>;

const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { t } = useTranslation();
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
        <View style={styles.page}>
            <StatusBar barStyle="dark-content" backgroundColor="#f4f9ff" />

            <ScrollView contentContainerStyle={styles.container}>
                <View style={{ height: 20 }} />
                <Header
                    userName={userName}
                    onSettingsPress={() => navigation.navigate('Settings' as any)}
                />

                <View style={styles.cardsContainer}>
                    <FeatureCard
                        icon="chatbubble-ellipses-outline"
                        title={t('home.chatWithAI')}
                        onPress={() => navigation.navigate("ChatAI")}
                    />
                    <FeatureCard
                        icon="alarm-outline"
                        title={t('home.medicationReminder')}
                        onPress={() => navigation.navigate('AddMedicationScreen')}
                    />
                    <FeatureCard
                        icon="medkit-outline"
                        title={t('home.manageMedications')}
                    />
                    <FeatureCard
                        icon="camera-outline"
                        title={t('home.skinDiseaseDetection')}
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
        backgroundColor: '#f4f9ff',
    },
    container: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        minHeight: height - 80, // تعبئة الشاشة مع ترك مساحة للفوتر
    },
    cardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 25,
    },
});

export default HomeScreen;
