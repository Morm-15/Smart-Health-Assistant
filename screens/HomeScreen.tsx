import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Alert, View, StatusBar, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Header from '../components/Header';
import FeatureCard from '../components/FeatureCard';
import Footer from '../components/Footer';

const { height } = Dimensions.get('window');

type HomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Home'>;

const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
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
                        setUserName(data.firstName || 'المستخدم');
                    }
                }
            } catch {
                Alert.alert('خطأ', 'حدث خطأ أثناء جلب بيانات المستخدم');
            }
        };

        fetchUserName();
    }, []);

    return (
        <View style={styles.page}>
            <StatusBar barStyle="dark-content" backgroundColor="#f4f9ff" />

            {/* المحتوى */}
            <ScrollView contentContainerStyle={styles.container}>
                <View style={{ height: 20 }} />
                <Header
                    userName={userName}
              /*      onProfilePress={() => navigation.navigate('Profile')}
                    onSettingsPress={() => navigation.navigate('Settings')}*/
                />

                <View style={styles.cardsContainer}>
                    <FeatureCard
                        icon="chatbubble-ellipses-outline"
                        title="الدردشة مع الذكاء الاصطناعي"
                        onPress={() => navigation.navigate("ChatAI")}
                    />
                    <FeatureCard
                        icon="alarm-outline"
                        title="تذكير الأدوية"

                        onPress={() => navigation.navigate('AddMedicationScreen')}
                    />
                    <FeatureCard
                        icon="medkit-outline"
                        title="إدارة الأدوية"
/*
                        onPress={() => navigation.navigate('MedicationReminders')}
*/
                    />
                    <FeatureCard
                        icon="camera-outline"
                        title="التقاط صور الأمراض الجلدية"
/*
                        onPress={() => navigation.navigate('SkinDiseaseCamera')}
*/
                    />
                </View>
            </ScrollView>

            {/* الفوتر */}
            <Footer
                onHomePress={() => navigation.navigate('Home')}
               /* onProfilePress={() => navigation.navigate('Profile')}
                onSettingsPress={() => navigation.navigate('Settings')}*/
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
