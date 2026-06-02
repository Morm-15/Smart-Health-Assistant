import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Image, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTheme } from '../contexts/ThemeContext';

// --- الذكاء الاصطناعي ---
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native';
import { analyzeSkinImage } from '../services/geminiService';

// --- الموديل ---
const modelJson = require('../assets/model/model.json');
const modelWeights1 = require('../assets/model/group1-shard1of3.bin');
const modelWeights2 = require('../assets/model/group1-shard2of3.bin');
const modelWeights3 = require('../assets/model/group1-shard3of3.bin');

const LABELS = ['Acne', 'Carcinoma', 'Eczema', 'Keratosis', 'Milia', 'Rosacea'];

const SkinDiseaseCameraScreen = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { colors, isDarkMode } = useTheme();

    // هوك الأذونات
    const [permission, requestPermission] = useCameraPermissions();

    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facing, setFacing] = useState<CameraType>('back');
    const cameraRef = useRef<any>(null);

    const [model, setModel] = useState<tf.GraphModel | null>(null);
    const [isModelReady, setIsModelReady] = useState(false);
    const [modelLoadError, setModelLoadError] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);

    // 1. تحميل الموديل والإحماء
    useEffect(() => {
        const loadModel = async () => {
            try {
                await tf.ready();
                const loadedModel = await tf.loadGraphModel(
                    bundleResourceIO(modelJson, [modelWeights1, modelWeights2, modelWeights3])
                );

                // Warm Up
                const zeroTensor = tf.zeros([1, 224, 224, 3]);
                const result = await loadedModel.predict(zeroTensor) as tf.Tensor;
                result.dispose();
                zeroTensor.dispose();

                setModel(loadedModel);
                setIsModelReady(true);
                setModelLoadError(false);
                console.log('Model Ready & Fast! 🚀');
            } catch (err) {
                console.error('Error loading model:', err);
                setModelLoadError(true);
            }
        };
        loadModel();
    }, []);

    // 2. دالة التحويل السريعة
    const transformImageToTensor = async (uri: string) => {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 224, height: 224 } }],
            { base64: true, format: ImageManipulator.SaveFormat.JPEG }
        );

        const imgBuffer = tf.util.encodeString(manipulatedImage.base64!, 'base64').buffer;
        const raw = new Uint8Array(imgBuffer);
        const imageTensor = decodeJpeg(raw);
        const normalizedImage = imageTensor.toFloat().div(tf.scalar(255.0));
        return normalizedImage.expandDims(0);
    };

    const getImageBase64 = async (uri: string) => {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 512, height: 512 } }],
            { base64: true, format: ImageManipulator.SaveFormat.JPEG }
        );
        return manipulatedImage.base64!;
    };

    const confirmPictureLocal = async () => {
        if (!capturedImage || !model) {
            Alert.alert("Error", t('camera.modelLoadingError'));
            return;
        }

        setIsAnalyzing(true);
        requestAnimationFrame(async () => {
            try {
                const imageTensor = await transformImageToTensor(capturedImage);
                const prediction = await model.predict(imageTensor) as tf.Tensor;
                const values = prediction.dataSync();

                const maxIndex = values.indexOf(Math.max(...values));
                const englishLabel = LABELS[maxIndex];
                const translatedLabel = t(`diseases.${englishLabel.toLowerCase()}`, englishLabel);
                const confidence = (values[maxIndex] * 100).toFixed(1);

                // تنظيف الذاكرة (مهم جداً)
                tf.dispose([imageTensor, prediction]);

                Alert.alert(
                    t('camera.resultTitle') || "Result",
                    `${t('camera.detected')}: ${translatedLabel}\n${t('camera.confidence')}: ${confidence}%`,
                    [{ text: "OK", onPress: () => navigation.goBack() }]
                );

            } catch (error) {
                console.error(error);
                Alert.alert(t('camera.localAnalysisFailed'), "Analysis failed.");
            } finally {
                setIsAnalyzing(false);
            }
        });
    };

    const confirmPictureCloud = async () => {
        if (!capturedImage) return;

        setIsAnalyzing(true);
        try {
            const base64 = await getImageBase64(capturedImage);
            const result = await analyzeSkinImage(base64);
            setAnalysisResult(result);
        } catch (error) {
            console.error(error);
            Alert.alert(t('camera.cloudAnalysisFailed'), "Could not connect to Cloud AI.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                    skipProcessing: true,
                });
                setCapturedImage(photo.uri);
            } catch (error) {
                Alert.alert("Error", "Could not take picture");
            }
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Gallery permission is required');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) {
            setCapturedImage(result.assets[0].uri);
        }
    };

    const retakePicture = () => {
        setCapturedImage(null);
    };

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    // --- إصلاح مشكلة الشاشة السوداء (Permissions) ---

    // الحالة 1: جاري التحقق من الإذن (شاشة سوداء مؤقتة)
    if (!permission) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 100 }} />
                <Text style={styles.permissionText}>{t('camera.loading')}</Text>
            </View>
        );
    }

    // الحالة 2: الإذن مرفوض أو لم يطلب بعد (إظهار زر الطلب)
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>{t('camera.permissionMessage')}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={requestPermission}>
                    <Text style={styles.retryButtonText}>{t('camera.allow')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // الحالة 3: تم التقاط صورة (عرض المعاينة)
    if (capturedImage) {
        return (
            <View style={styles.container}>
                <Image source={{ uri: capturedImage }} style={StyleSheet.absoluteFill} />
                {isAnalyzing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={{color: 'white', marginTop: 10}}>{t('camera.analyzing')}...</Text>
                    </View>
                )}
                <TouchableOpacity style={styles.backButton} onPress={retakePicture}>
                    <Ionicons name="arrow-back" size={30} color="#fff" />
                </TouchableOpacity>

                <View style={styles.previewControls}>
                    {isModelReady && !modelLoadError ? (
                        <>
                            <View style={styles.previewRow}>
                                <TouchableOpacity style={styles.retakeButton} onPress={retakePicture} disabled={isAnalyzing}>
                                    <Ionicons name="refresh" size={20} color="#fff" />
                                    <Text style={styles.controlButtonText}>{t('camera.retake')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.localConfirmButton} onPress={confirmPictureLocal} disabled={isAnalyzing}>
                                    <Ionicons name="hardware-chip" size={20} color="#fff" />
                                    <Text style={styles.controlButtonText}>{t('camera.localAnalysis')}</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity style={styles.cloudConfirmButton} onPress={confirmPictureCloud} disabled={isAnalyzing}>
                                <Ionicons name="sparkles" size={20} color="#fff" />
                                <Text style={styles.cloudButtonText}>{t('camera.cloudAnalysis')}</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.previewRow}>
                            <TouchableOpacity style={styles.retakeButton} onPress={retakePicture} disabled={isAnalyzing}>
                                <Ionicons name="refresh" size={20} color="#fff" />
                                <Text style={styles.controlButtonText}>{t('camera.retake')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.cloudConfirmButton, { flex: 1 }]} onPress={confirmPictureCloud} disabled={isAnalyzing}>
                                <Ionicons name="sparkles" size={20} color="#fff" />
                                <Text style={styles.cloudButtonText}>{t('camera.cloudAnalysis')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Modal for detailed Cloud AI Report */}
                <Modal
                    visible={analysisResult !== null}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setAnalysisResult(null)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>
                                    {t('camera.aiAnalysisResult')}
                                </Text>
                                <TouchableOpacity onPress={() => setAnalysisResult(null)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                <Text style={[styles.modalText, { color: colors.text }]}>
                                    {analysisResult}
                                </Text>
                            </ScrollView>
                            <TouchableOpacity 
                                style={[styles.modalCloseButton, { backgroundColor: colors.primary }]} 
                                onPress={() => {
                                    setAnalysisResult(null);
                                    navigation.goBack();
                                }}
                            >
                                <Text style={styles.modalCloseButtonText}>
                                    {t('common.done') || "Done"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        );
    }

    // الحالة 4: الكاميرا تعمل (الوضع الطبيعي)
    return (
        <View style={styles.container}>
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={30} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                <Ionicons name="camera-reverse" size={30} color="#fff" />
            </TouchableOpacity>

            <View style={styles.bottomControls}>
                <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
                    <Ionicons name="images" size={30} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                    <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                <View style={{width: 50}} />
            </View>

            {!isModelReady && !modelLoadError && (
                <View style={styles.modelLoadingBadge}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={{color:'white', marginLeft: 5, fontSize: 12}}>Loading Local AI...</Text>
                </View>
            )}

            {modelLoadError && (
                <View style={[styles.modelLoadingBadge, { backgroundColor: 'rgba(79, 70, 229, 0.8)' }]}>
                    <Ionicons name="cloud-done" size={14} color="#fff" />
                    <Text style={{color:'white', marginLeft: 5, fontSize: 12}}>Cloud AI Active</Text>
                </View>
            )}

            <View style={styles.instructionBox}>
                <Ionicons name="information-circle" size={24} color="#fff" style={{ marginBottom: 5 }} />
                <Text style={styles.instructionText}>{t('camera.instruction')}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    permissionText: { color: '#fff', fontSize: 18, textAlign: 'center', marginTop: 50 },
    retryButton: { marginTop: 20, paddingHorizontal: 30, paddingVertical: 12, backgroundColor: '#007AFF', borderRadius: 8, alignSelf: 'center' },
    retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    backButton: { position: 'absolute', top: 50, left: 20, width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
    flipButton: { position: 'absolute', top: 50, right: 20, width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
    bottomControls: { position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', zIndex: 20 },
    galleryButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff' },
    captureButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
    instructionBox: { position: 'absolute', top: 120, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 15, borderRadius: 10, alignItems: 'center', maxWidth: '80%', zIndex: 15 },
    instructionText: { color: '#fff', fontSize: 14, textAlign: 'center', lineHeight: 20 },
    previewControls: {
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 20,
        padding: 16,
        gap: 12,
        alignItems: 'stretch',
        zIndex: 20
    },
    previewRow: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'space-between',
    },
    retakeButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EF4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    localConfirmButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#475569',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    cloudConfirmButton: {
        height: 48,
        borderRadius: 12,
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    controlButtonText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
    cloudButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 30 },
    modelLoadingBadge: { position: 'absolute', top: 60, alignSelf: 'center', flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20, zIndex: 15 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalBody: {
        marginBottom: 20,
    },
    modalText: {
        fontSize: 15,
        lineHeight: 24,
    },
    modalCloseButton: {
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCloseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SkinDiseaseCameraScreen;