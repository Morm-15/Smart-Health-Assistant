import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, Image, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

// --- الذكاء الاصطناعي ---
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO, decodeJpeg } from '@tensorflow/tfjs-react-native';

// --- الموديل ---
const modelJson = require('../assets/model/model.json');
const modelWeights1 = require('../assets/model/group1-shard1of3.bin');
const modelWeights2 = require('../assets/model/group1-shard2of3.bin');
const modelWeights3 = require('../assets/model/group1-shard3of3.bin');

const LABELS = ['Acne', 'Carcinoma', 'Eczema', 'Keratosis', 'Milia', 'Rosacea'];

const SkinDiseaseCameraScreen = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();

    // هوك الأذونات
    const [permission, requestPermission] = useCameraPermissions();

    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facing, setFacing] = useState<CameraType>('back');
    const cameraRef = useRef<any>(null);

    const [model, setModel] = useState<tf.GraphModel | null>(null);
    const [isModelReady, setIsModelReady] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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
                console.log('Model Ready & Fast! 🚀');
            } catch (err) {
                console.error('Error loading model:', err);
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

    const confirmPicture = async () => {
        if (!capturedImage || !model) return;

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
                Alert.alert("Error", "Analysis failed.");
            } finally {
                setIsAnalyzing(false);
            }
        });
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
                    <TouchableOpacity style={styles.retakeButton} onPress={retakePicture} disabled={isAnalyzing}>
                        <Ionicons name="refresh" size={30} color="#fff" />
                        <Text style={styles.controlButtonText}>{t('camera.retake')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmButton} onPress={confirmPicture} disabled={isAnalyzing}>
                        <Ionicons name="checkmark-circle" size={30} color="#fff" />
                        <Text style={styles.controlButtonText}>{t('camera.confirm')}</Text>
                    </TouchableOpacity>
                </View>
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

            {!isModelReady && (
                <View style={styles.modelLoadingBadge}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={{color:'white', marginLeft: 5, fontSize: 12}}>Loading AI...</Text>
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
    previewControls: { position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 40, zIndex: 20 },
    retakeButton: { alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.9)', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, minWidth: 120, flexDirection: 'row', gap: 8 },
    confirmButton: { alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.9)', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, minWidth: 120, flexDirection: 'row', gap: 8 },
    controlButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 30 },
    modelLoadingBadge: { position: 'absolute', top: 60, alignSelf: 'center', flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20, zIndex: 15 }
});

export default SkinDiseaseCameraScreen;