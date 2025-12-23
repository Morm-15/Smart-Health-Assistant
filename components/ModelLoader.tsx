import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { useTranslation } from 'react-i18next';

// 1. استيراد ملف الـ JSON
const modelJson = require('../assets/model/model.json');

// 2. استيراد ملفات الـ BIN
// ملاحظة هامة: تأكد من أن عدد الملفات هنا يطابق عدد ملفات bin الجديدة التي نتجت عن التحويل الأخير
// إذا نتج ملف bin واحد فقط، احذف السطرين الإضافيين
const modelWeights1 = require('../assets/model/group1-shard1of3.bin');
const modelWeights2 = require('../assets/model/group1-shard2of3.bin');
const modelWeights3 = require('../assets/model/group1-shard3of3.bin');

export default function App() {
    const { t } = useTranslation();
    const [isTfReady, setIsTfReady] = useState(false);

    // التعديل 1: تغيير النوع من LayersModel إلى GraphModel
    const [model, setModel] = useState<tf.GraphModel | null>(null);

    const [loadingError, setLoadingError] = useState<string | null>(null);

    useEffect(() => {
        const loadModel = async () => {
            try {
                await tf.ready();
                setIsTfReady(true);
                console.log('TensorFlow is ready!');

                // التعديل 2: استخدام loadGraphModel بدلاً من loadLayersModel
                // هذا هو الحل السحري لمشكلة Improper config format
                const loadedModel = await tf.loadGraphModel(
                    bundleResourceIO(modelJson, [
                        modelWeights1,
                        modelWeights2,
                        modelWeights3
                    ])
                );

                setModel(loadedModel);
                console.log('Model loaded successfully! ✅');

                // ملاحظة: GraphModel لا يحتوي عادة على دالة summary() بنفس طريقة LayersModel
                // لذا قمت بحذف السطر loadedModel.summary() لتجنب الأخطاء

            } catch (err) {
                console.error('Error loading model:', err);
                setLoadingError('Failed to load model.');
            }
        };

        loadModel();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('home.welcome')}</Text>

            {!isTfReady || !model ? (
                <View>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text style={styles.status}>{t('common.loading')}</Text>
                    {loadingError && <Text style={styles.error}>{loadingError}</Text>}
                </View>
            ) : (
                <View>
                    <Text style={styles.success}>{t('common.done')} ✅</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    status: { marginTop: 10, fontSize: 16 },
    success: { marginTop: 10, fontSize: 18, color: 'green', fontWeight: 'bold' },
    error: { marginTop: 10, color: 'red' },
});