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

const LABELS = [
    'Acne',
    'Benign_Tumors',
    'Eczema',
    'Malignant_Carcinoma',
    'Normal_Skin',
    'Psoriasis',
    'Rosacea'
];

interface DiagnosisItem {
    key: string;
    label: string;
    confidence: number;
}

interface LocalDiagnosisResult {
    primary: DiagnosisItem;
    differential: DiagnosisItem;
    allSorted: DiagnosisItem[];
}

const SkinDiseaseCameraScreen = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { colors, isDarkMode } = useTheme();

    // هوك الأذونات
    const [permission, requestPermission] = useCameraPermissions();

    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facing, setFacing] = useState<CameraType>('back');
    const cameraRef = useRef<any>(null);

    const [model, setModel] = useState<tf.LayersModel | tf.GraphModel | null>(null);
    const [isModelReady, setIsModelReady] = useState(false);
    const [modelLoadError, setModelLoadError] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [localDiagnosis, setLocalDiagnosis] = useState<LocalDiagnosisResult | null>(null);

    // 1. تحميل الموديل والإحماء
    useEffect(() => {
        let isMounted = true;
        const loadModel = async () => {
            try {
                await tf.ready();
                let loadedModel: any;
                try {
                    loadedModel = await tf.loadLayersModel(
                        bundleResourceIO(modelJson, [modelWeights1, modelWeights2, modelWeights3])
                    );
                } catch (layersErr) {
                    console.log('Falling back to loadGraphModel:', layersErr);
                    loadedModel = await tf.loadGraphModel(
                        bundleResourceIO(modelJson, [modelWeights1, modelWeights2, modelWeights3])
                    );
                }

                // Warm Up
                const zeroTensor = tf.zeros([1, 224, 224, 3]);
                const result = (await loadedModel.predict(zeroTensor)) as tf.Tensor;
                result.dispose();
                zeroTensor.dispose();

                if (isMounted) {
                    setModel(loadedModel);
                    setIsModelReady(true);
                    setModelLoadError(false);
                    console.log('MobileNetV2 7-Class Model Ready & Fast! 🚀');
                }
            } catch (err) {
                console.error('Error loading model:', err);
                if (isMounted) setModelLoadError(true);
            }
        };
        loadModel();
        return () => { isMounted = false; };
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
                const prediction = (await model.predict(imageTensor)) as tf.Tensor;
                const rawValues = Array.from(await prediction.data());

                const sortedItems: DiagnosisItem[] = LABELS.map((key, idx) => ({
                    key,
                    label: t(`diseases.${key.toLowerCase()}`, key.replace('_', ' ')),
                    confidence: Math.max(0, (rawValues[idx] || 0) * 100)
                })).sort((a, b) => b.confidence - a.confidence);

                // تنظيف الذاكرة الفوري لمنع أي بطء
                tf.dispose([imageTensor, prediction]);

                setLocalDiagnosis({
                    primary: sortedItems[0],
                    differential: sortedItems[1] || sortedItems[0],
                    allSorted: sortedItems.slice(0, 3)
                });
            } catch (error) {
                console.error("Local diagnosis error:", error);
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

                {/* Modal for Local Clinical Differential Diagnosis */}
                <Modal
                    visible={localDiagnosis !== null}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setLocalDiagnosis(null)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <View style={styles.modalHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Ionicons name="medical" size={22} color="#4F46E5" />
                                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                                        {t('camera.resultTitle') || "التشخيص السريري المباشر"}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setLocalDiagnosis(null)}>
                                    <Ionicons name="close" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            {localDiagnosis && (
                                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                    {/* Primary Diagnosis Card */}
                                    <View style={[styles.diagnosisCard, { 
                                        backgroundColor: localDiagnosis.primary.key === 'Normal_Skin' ? 'rgba(34, 197, 94, 0.12)' : 
                                                         localDiagnosis.primary.key === 'Malignant_Carcinoma' ? 'rgba(239, 68, 68, 0.12)' : 
                                                         'rgba(99, 102, 241, 0.12)',
                                        borderColor: localDiagnosis.primary.key === 'Normal_Skin' ? '#22C55E' : 
                                                     localDiagnosis.primary.key === 'Malignant_Carcinoma' ? '#EF4444' : 
                                                     '#6366F1',
                                    }]}>
                                        <View style={styles.cardHeaderRow}>
                                            <Text style={[styles.primaryBadgeText, {
                                                color: localDiagnosis.primary.key === 'Normal_Skin' ? '#16A34A' : 
                                                       localDiagnosis.primary.key === 'Malignant_Carcinoma' ? '#DC2626' : 
                                                       '#4F46E5'
                                            }]}>
                                                {localDiagnosis.primary.key === 'Normal_Skin' ? "🟢 جلد سليم وطبيعي" : 
                                                 localDiagnosis.primary.key === 'Malignant_Carcinoma' ? "🔴 اشتباه سريري يستدعي فحصاً" : 
                                                 "🔵 التشخيص الأولي الأساسي"}
                                            </Text>
                                            <Text style={[styles.confidenceBadge, {
                                                color: localDiagnosis.primary.key === 'Normal_Skin' ? '#16A34A' : 
                                                       localDiagnosis.primary.key === 'Malignant_Carcinoma' ? '#DC2626' : 
                                                       '#4F46E5'
                                            }]}>
                                                {localDiagnosis.primary.confidence.toFixed(1)}%
                                            </Text>
                                        </View>
                                        <Text style={[styles.conditionName, { color: colors.text }]}>
                                            {localDiagnosis.primary.label}
                                        </Text>
                                    </View>

                                    {/* Differential Diagnosis (Top-2) */}
                                    {localDiagnosis.differential && localDiagnosis.differential.key !== localDiagnosis.primary.key && (
                                        <View style={[styles.differentialBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}>
                                            <Text style={styles.diffTitle}>
                                                🔬 التشخيص التفريقي البديل (Differential Diagnosis):
                                            </Text>
                                            <View style={styles.cardHeaderRow}>
                                                <Text style={[styles.diffLabel, { color: colors.text }]}>
                                                    {localDiagnosis.differential.label}
                                                </Text>
                                                <Text style={styles.diffPercentage}>
                                                    {localDiagnosis.differential.confidence.toFixed(1)}%
                                                </Text>
                                            </View>
                                        </View>
                                    )}

                                    {/* Medical Advice Box */}
                                    <View style={[styles.adviceBox, { backgroundColor: isDarkMode ? '#0F2A28' : '#F0FDFA' }]}>
                                        <Ionicons name="shield-checkmark" size={20} color="#0D9488" />
                                        <Text style={styles.adviceText}>
                                            {localDiagnosis.primary.key === 'Normal_Skin'
                                                ? "الجلد سليم ولا توجد علامات لآفات غير طبيعية. يوصى بالترطيب واستخدام واقي الشمس."
                                                : localDiagnosis.primary.key === 'Malignant_Carcinoma'
                                                ? "يوصى بشدة بمراجعة طبيب جلدية استشاري لإجراء فحص سريري دقيق والتأكد من طبيعة الآفة."
                                                : "يوصى بتجنب لمس أو فرك المنطقة المصابة، واستشارة الصيدلي أو الطبيب للخطة العلاجية الملائمة."}
                                        </Text>
                                    </View>

                                    <Text style={styles.disclaimerText}>
                                        ⚠️ هذا الفحص أداة استرشادية ذكية ولا يغني عن استشارة الطبيب المختص.
                                    </Text>
                                </ScrollView>
                            )}

                            <TouchableOpacity 
                                style={[styles.modalCloseButton, { backgroundColor: '#4F46E5' }]} 
                                onPress={() => {
                                    setLocalDiagnosis(null);
                                    navigation.goBack();
                                }}
                            >
                                <Text style={styles.modalCloseButtonText}>
                                    {t('common.done') || "حسناً / تم"}
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
    diagnosisCard: {
        borderRadius: 16,
        borderWidth: 1.5,
        padding: 16,
        marginBottom: 14,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    primaryBadgeText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    confidenceBadge: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    conditionName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 4,
    },
    differentialBox: {
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(148, 163, 184, 0.2)',
    },
    diffTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 6,
    },
    diffLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    diffPercentage: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#6366F1',
    },
    adviceBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    adviceText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
        color: '#0F766E',
    },
    disclaimerText: {
        fontSize: 11,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: 16,
    },
});

export default SkinDiseaseCameraScreen;