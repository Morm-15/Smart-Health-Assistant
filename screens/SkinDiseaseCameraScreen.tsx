import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SkinDiseaseCameraScreen = () => {
    const navigation = useNavigation();
    const [permission, requestPermission] = useCameraPermissions();
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        const checkPermission = async () => {
            if (!permission?.granted) {
                const result = await requestPermission();
                if (!result.granted) {
                    Alert.alert(
                        'إذن الكاميرا مطلوب',
                        'نحتاج إلى الوصول للكاميرا لالتقاط الصور',
                        [
                            { text: 'إلغاء', onPress: () => navigation.goBack() },
                            { text: 'السماح', onPress: requestPermission }
                        ]
                    );
                }
            }
        };
        checkPermission();
    }, [permission]);

    useEffect(() => {
        return () => {
            setIsActive(false);
        };
    }, []);

    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>يتم تحميل الكاميرا...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>يتم طلب إذن الكاميرا...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={30} color="#fff" />
                </TouchableOpacity>

                <View style={styles.bottomControls}>
                    <TouchableOpacity style={styles.captureButton}>
                        <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                </View>

                <View style={styles.instructionBox}>
                    <Text style={styles.instructionText}>
                        قم بتوجيه الكاميرا نحو المنطقة المصابة
                    </Text>
                </View>
            </CameraView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    permissionText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 50,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    bottomControls: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
    instructionBox: {
        position: 'absolute',
        top: 120,
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 15,
        borderRadius: 10,
    },
    instructionText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
});

export default SkinDiseaseCameraScreen;
