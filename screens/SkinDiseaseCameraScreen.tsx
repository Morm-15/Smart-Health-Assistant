import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Image } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SkinDiseaseCameraScreen = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [permission, requestPermission] = useCameraPermissions();
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facing, setFacing] = useState<CameraType>('back');
    const cameraRef = useRef<any>(null);

    useEffect(() => {
        const checkPermission = async () => {
            if (!permission?.granted) {
                const result = await requestPermission();
                if (!result.granted) {
                    Alert.alert(
                        t('camera.permissionRequired'),
                        t('camera.permissionMessage'),
                        [
                            { text: t('camera.cancel'), onPress: () => navigation.goBack() },
                            { text: t('camera.allow'), onPress: requestPermission }
                        ]
                    );
                }
            }
        };
        checkPermission();
    }, [permission, t]);

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                });
                setCapturedImage(photo.uri);
            } catch (error) {
                Alert.alert(t('camera.captureError'), t('camera.captureErrorMessage'));
                console.error('Error taking picture:', error);
            }
        }
    };

    const retakePicture = () => {
        setCapturedImage(null);
    };

    const confirmPicture = async () => {
        if (capturedImage) {
            Alert.alert(
                t('camera.analyzing'),
                t('camera.analyzingMessage'),
                [
                    { text: t('camera.ok'), onPress: () => navigation.goBack() }
                ]
            );
        }
    };

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>{t('camera.loading')}</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>{t('camera.requestingPermission')}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={requestPermission}>
                    <Text style={styles.retryButtonText}>{t('camera.requestPermission')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (capturedImage) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: capturedImage }} style={StyleSheet.absoluteFill} />

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={retakePicture}
                >
                    <Ionicons name="arrow-back" size={30} color="#fff" />
                </TouchableOpacity>

                <View style={styles.previewControls}>
                    <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
                        <Ionicons name="camera-reverse" size={30} color="#fff" />
                        <Text style={styles.controlButtonText}>{t('camera.retake')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.confirmButton} onPress={confirmPicture}>
                        <Ionicons name="checkmark-circle" size={30} color="#fff" />
                        <Text style={styles.controlButtonText}>{t('camera.confirm')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing={facing}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={30} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.flipButton}
                    onPress={toggleCameraFacing}
                >
                    <Ionicons name="camera-reverse" size={30} color="#fff" />
                </TouchableOpacity>

                <View style={styles.bottomControls}>
                    <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                        <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                </View>

                <View style={styles.instructionBox}>
                    <Ionicons name="information-circle" size={24} color="#fff" style={{ marginBottom: 5 }} />
                    <Text style={styles.instructionText}>
                        {t('camera.instruction')}
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
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 30,
        paddingVertical: 12,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        alignSelf: 'center',
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
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
    flipButton: {
        position: 'absolute',
        top: 50,
        right: 20,
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
        borderWidth: 4,
        borderColor: '#fff',
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
        alignItems: 'center',
        maxWidth: '80%',
    },
    instructionText: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    previewControls: {
        position: 'absolute',
        bottom: 40,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 40,
    },
    retakeButton: {
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 120,
    },
    confirmButton: {
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.9)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 120,
    },
    controlButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 4,
    },
});

export default SkinDiseaseCameraScreen;
