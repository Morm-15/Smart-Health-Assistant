import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import ScreenHeader from '../components/ScreenHeader';
import { getMedications } from '../services/medicationService';
import {
    analyzeDrugInteractions,
    DrugInteractionAnalysis,
    DrugInteractionItem,
} from '../services/drugInteractionService';

const DrugInteractionScreen = () => {
    const navigation = useNavigation();
    const { t, i18n } = useTranslation();
    const { colors, isDarkMode } = useTheme();

    const [medications, setMedications] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [loadingCabinet, setLoadingCabinet] = useState<boolean>(false);
    const [analyzing, setAnalyzing] = useState<boolean>(false);
    const [result, setResult] = useState<DrugInteractionAnalysis | null>(null);

    // Automatically load user's saved medications on mount
    useEffect(() => {
        handleLoadFromCabinet(false);
    }, []);

    const handleAddMedication = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;
        if (medications.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
            Alert.alert(
                i18n.language === 'ar' ? 'تنبيه' : i18n.language === 'tr' ? 'Uyarı' : 'Notice',
                i18n.language === 'ar' ? 'هذا الدواء مضاف بالفعل للقائمة.' : i18n.language === 'tr' ? 'Bu ilaç zaten listede var.' : 'This medication is already in your list.'
            );
            return;
        }
        setMedications([...medications, trimmed]);
        setInputValue('');
        setResult(null);
    };

    const handleRemoveMedication = (index: number) => {
        const updated = medications.filter((_, i) => i !== index);
        setMedications(updated);
        setResult(null);
    };

    const handleLoadFromCabinet = async (showAlert: boolean = true) => {
        setLoadingCabinet(true);
        try {
            const saved = await getMedications();
            if (saved && saved.length > 0) {
                const names = saved.map(s => s.medName).filter(Boolean);
                const uniqueNames = Array.from(new Set([...medications, ...names]));
                setMedications(uniqueNames);
                if (showAlert) {
                    Alert.alert(
                        i18n.language === 'ar' ? 'تم جلب الأدوية' : i18n.language === 'tr' ? 'İlaçlar Eklendi' : 'Cabinet Synced',
                        i18n.language === 'ar'
                            ? `تم استيراد ${names.length} أدوية من خزانة أدويتك بنجاح.`
                            : i18n.language === 'tr'
                            ? `İlaç dolabınızdan ${names.length} ilaç başarıyla aktarıldı.`
                            : `Imported ${names.length} medication(s) from your medicine cabinet.`
                    );
                }
            } else if (showAlert) {
                Alert.alert(
                    i18n.language === 'ar' ? 'خزانة الأدوية' : i18n.language === 'tr' ? 'İlaç Dolabı' : 'Cabinet Empty',
                    i18n.language === 'ar' ? 'لم يتم العثور على أدوية مسجلة بعد في جدولك.' : i18n.language === 'tr' ? 'Kayıtlı ilacınız bulunamadı.' : 'No saved medications found in your cabinet.'
                );
            }
        } catch (e) {
            console.error('Error fetching cabinet meds:', e);
        } finally {
            setLoadingCabinet(false);
        }
    };

    const handleRunAnalysis = async () => {
        if (medications.length === 0) {
            Alert.alert(
                i18n.language === 'ar' ? 'أضف أدوية' : i18n.language === 'tr' ? 'İlaç Ekleyin' : 'Add Medications',
                i18n.language === 'ar' ? 'يرجى كتابة أو استيراد دواء واحد على الأقل للفحص.' : i18n.language === 'tr' ? 'Lütfen en az bir ilaç ekleyiniz.' : 'Please add or import at least one medication to inspect.'
            );
            return;
        }

        setAnalyzing(true);
        try {
            const data = await analyzeDrugInteractions(medications, i18n.language);
            setResult(data);
        } catch (e: any) {
            Alert.alert(
                i18n.language === 'ar' ? 'خطأ بالفحص' : i18n.language === 'tr' ? 'Hata' : 'Error',
                e?.message || 'Failed to analyze medications'
            );
        } finally {
            setAnalyzing(false);
        }
    };

    const getSafetyTheme = (level: 'safe' | 'moderate' | 'danger') => {
        switch (level) {
            case 'danger':
                return {
                    bg: isDarkMode ? '#450A0A' : '#FEF2F2',
                    border: '#EF4444',
                    text: '#DC2626',
                    icon: 'warning',
                    label: i18n.language === 'ar' ? 'خطر تعارض' : i18n.language === 'tr' ? 'Tehlike' : 'High Risk',
                };
            case 'moderate':
                return {
                    bg: isDarkMode ? '#451A03' : '#FFFBEB',
                    border: '#F59E0B',
                    text: '#D97706',
                    icon: 'alert-circle',
                    label: i18n.language === 'ar' ? 'تنبيه ومباعدة' : i18n.language === 'tr' ? 'Dikkat' : 'Moderate Caution',
                };
            default:
                return {
                    bg: isDarkMode ? '#064E3B' : '#ECFDF5',
                    border: '#10B981',
                    text: '#059669',
                    icon: 'checkmark-circle',
                    label: i18n.language === 'ar' ? 'آمن طبياً' : i18n.language === 'tr' ? 'Güvenli' : 'Safe',
                };
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <ScreenHeader
                title={i18n.language === 'ar' ? 'فاحص التعارضات الدوائية' : i18n.language === 'tr' ? 'İlaç Etkileşim Kontrolü' : 'Drug Safety & Interactions'}
                subtitle={i18n.language === 'ar' ? 'فحص تفاعل الأدوية والأغذية بالذكاء الاصطناعي' : i18n.language === 'tr' ? 'Yapay zeka ile ilaç ve gıda etkileşimi analizi' : 'AI Drug-Drug & Drug-Food Interaction Checker'}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Top Cabinet Import Card */}
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
                        <View style={styles.cardHeaderRow}>
                            <View style={styles.cardIconBox}>
                                <Ionicons name="medkit" size={20} color="#4F46E5" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>
                                    {i18n.language === 'ar' ? 'قائمة الأدوية المراد فحصها' : i18n.language === 'tr' ? 'İncelenecek İlaçlar' : 'Medications to Evaluate'}
                                </Text>
                                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                                    {i18n.language === 'ar' ? 'أدخل أسماء أدويتك أو استوردها من خزانتك' : i18n.language === 'tr' ? 'İlaç adını yazın veya dolabınızdan aktarın' : 'Type medication names or import from your cabinet'}
                                </Text>
                            </View>
                        </View>

                        {/* Import Cabinet Button */}
                        <TouchableOpacity
                            style={[styles.cabinetBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#EEF2FF' }]}
                            onPress={() => handleLoadFromCabinet(true)}
                            disabled={loadingCabinet}
                            activeOpacity={0.8}
                        >
                            {loadingCabinet ? (
                                <ActivityIndicator size="small" color="#4F46E5" />
                            ) : (
                                <>
                                    <Ionicons name="sync" size={16} color="#4F46E5" />
                                    <Text style={styles.cabinetBtnText}>
                                        {i18n.language === 'ar' ? 'استيراد كل أدويتي المسجلة' : i18n.language === 'tr' ? 'Kayıtlı İlaçlarımı Getir' : 'Import My Saved Medications'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Input Row */}
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                                        color: colors.text,
                                        borderColor: isDarkMode ? '#334155' : '#CBD5E1',
                                    },
                                ]}
                                placeholder={i18n.language === 'ar' ? 'مثال: Aspirin, Metformin...' : i18n.language === 'tr' ? 'Örn: Aspirin, Metformin...' : 'e.g., Aspirin, Metformin...'}
                                placeholderTextColor={colors.textSecondary}
                                value={inputValue}
                                onChangeText={setInputValue}
                                onSubmitEditing={handleAddMedication}
                                returnKeyType="done"
                            />
                            <TouchableOpacity
                                style={styles.addMedBtn}
                                onPress={handleAddMedication}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="add" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Medication Chips */}
                        {medications.length > 0 ? (
                            <View style={styles.chipsContainer}>
                                {medications.map((med, index) => (
                                    <View
                                        key={`${med}-${index}`}
                                        style={[styles.chip, { backgroundColor: isDarkMode ? '#312E81' : '#E0E7FF' }]}
                                    >
                                        <Text style={styles.chipText}>{med}</Text>
                                        <TouchableOpacity
                                            onPress={() => handleRemoveMedication(index)}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <Ionicons name="close-circle" size={16} color="#6366F1" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                                {i18n.language === 'ar' ? 'لم تقم بإضافة أدوية بعد.' : i18n.language === 'tr' ? 'Henüz ilaç eklenmedi.' : 'No medications added yet.'}
                            </Text>
                        )}

                        {/* Analyze Trigger Button */}
                        <TouchableOpacity
                            style={[
                                styles.primaryAnalyzeBtn,
                                medications.length === 0 && { opacity: 0.6 },
                            ]}
                            onPress={handleRunAnalysis}
                            disabled={analyzing || medications.length === 0}
                            activeOpacity={0.85}
                        >
                            {analyzing ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                                    <Text style={styles.primaryAnalyzeBtnText}>
                                        {i18n.language === 'ar' ? 'فحص التعارضات الآن' : i18n.language === 'tr' ? 'Etkileşimleri Şimdi Denetle' : 'Check Interactions Now'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Results Section */}
                    {result && (
                        <View style={styles.resultsContainer}>
                            {/* Safety Banner */}
                            {(() => {
                                const theme = getSafetyTheme(result.safetyLevel);
                                return (
                                    <View style={[styles.safetyBanner, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                        <View style={styles.safetyBannerHeader}>
                                            <Ionicons name={theme.icon as any} size={24} color={theme.text} />
                                            <Text style={[styles.safetyLevelLabel, { color: theme.text }]}>
                                                {theme.label}
                                            </Text>
                                        </View>
                                        {result.headline ? (
                                            <Text style={[styles.safetyHeadline, { color: colors.text }]}>
                                                {result.headline}
                                            </Text>
                                        ) : null}
                                        <Text style={[styles.safetySummary, { color: colors.textSecondary }]}>
                                            {result.summary}
                                        </Text>
                                    </View>
                                );
                            })()}

                            {/* Specific Interactions */}
                            {result.interactions.length > 0 && (
                                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
                                    <View style={styles.sectionHeaderRow}>
                                        <Ionicons name="git-compare" size={18} color="#EF4444" />
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                            {i18n.language === 'ar' ? 'التعارضات المكتشفة' : i18n.language === 'tr' ? 'Tespit Edilen Etkileşimler' : 'Identified Interactions'}
                                        </Text>
                                    </View>

                                    {result.interactions.map((item, idx) => {
                                        const isSevere = item.severity === 'severe';
                                        return (
                                            <View
                                                key={idx}
                                                style={[
                                                    styles.interactionItem,
                                                    {
                                                        backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                                                        borderColor: isSevere ? '#EF4444' : isDarkMode ? '#334155' : '#CBD5E1',
                                                    },
                                                ]}
                                            >
                                                <View style={styles.interactionHeader}>
                                                    <Text style={[styles.interactionParties, { color: colors.text }]}>
                                                        {item.parties}
                                                    </Text>
                                                    <View
                                                        style={[
                                                            styles.severityPill,
                                                            { backgroundColor: isSevere ? '#FEE2E2' : '#FEF3C7' },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.severityText,
                                                                { color: isSevere ? '#DC2626' : '#D97706' },
                                                            ]}
                                                        >
                                                            {item.severity.toUpperCase()}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <Text style={[styles.interactionEffect, { color: colors.textSecondary }]}>
                                                    {item.effect}
                                                </Text>

                                                <View style={styles.recRow}>
                                                    <Ionicons name="medical" size={14} color="#10B981" />
                                                    <Text style={[styles.interactionRec, { color: colors.text }]}>
                                                        {item.recommendation}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            {/* Food & Beverage Warnings */}
                            {result.foodWarnings.length > 0 && (
                                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
                                    <View style={styles.sectionHeaderRow}>
                                        <Ionicons name="nutrition" size={18} color="#F59E0B" />
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                            {i18n.language === 'ar' ? 'تداخلات الأطعمة والمشروبات' : i18n.language === 'tr' ? 'Gıda ve İçecek Uyarıları' : 'Food & Dietary Precautions'}
                                        </Text>
                                    </View>

                                    {result.foodWarnings.map((warning, wIdx) => (
                                        <View key={wIdx} style={styles.bulletItem}>
                                            <Text style={styles.bulletEmoji}>⚠️</Text>
                                            <Text style={[styles.bulletText, { color: colors.text }]}>
                                                {warning}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Safe Timing Advice */}
                            {result.safeTimingAdvice.length > 0 && (
                                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: isDarkMode ? '#1E293B' : '#E2E8F0' }]}>
                                    <View style={styles.sectionHeaderRow}>
                                        <Ionicons name="time" size={18} color="#6366F1" />
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                            {i18n.language === 'ar' ? 'إرشادات التوقيت والتناول الآمن' : i18n.language === 'tr' ? 'Zamanlama ve Güvenli Kullanım' : 'Optimal Timing & Administration'}
                                        </Text>
                                    </View>

                                    {result.safeTimingAdvice.map((advice, aIdx) => (
                                        <View key={aIdx} style={styles.bulletItem}>
                                            <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginTop: 2 }} />
                                            <Text style={[styles.bulletText, { color: colors.text }]}>
                                                {advice}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Clinical Disclaimer */}
                            <View style={[styles.disclaimerBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                                <Ionicons name="information-circle" size={16} color="#64748B" style={{ marginTop: 1 }} />
                                <Text style={styles.disclaimerText}>
                                    {result.disclaimer}
                                </Text>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    cardIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    cardSub: {
        fontSize: 12,
        marginTop: 2,
    },
    cabinetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        gap: 8,
        marginBottom: 12,
    },
    cabinetBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4F46E5',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    input: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
        fontSize: 14,
    },
    addMedBtn: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        gap: 6,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4338CA',
    },
    emptyHint: {
        fontSize: 12,
        fontStyle: 'italic',
        marginBottom: 14,
    },
    primaryAnalyzeBtn: {
        backgroundColor: '#4F46E5',
        borderRadius: 14,
        paddingVertical: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },
    primaryAnalyzeBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    resultsContainer: {
        marginTop: 4,
    },
    safetyBanner: {
        borderRadius: 18,
        padding: 16,
        borderWidth: 1.5,
        marginBottom: 16,
    },
    safetyBannerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    safetyLevelLabel: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    safetyHeadline: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4,
    },
    safetySummary: {
        fontSize: 13,
        lineHeight: 19,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    interactionItem: {
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    interactionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    interactionParties: {
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
    },
    severityPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    severityText: {
        fontSize: 10,
        fontWeight: '800',
    },
    interactionEffect: {
        fontSize: 12,
        lineHeight: 18,
        marginBottom: 6,
    },
    recRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    interactionRec: {
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    bulletItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 8,
    },
    bulletEmoji: {
        fontSize: 14,
    },
    bulletText: {
        fontSize: 13,
        lineHeight: 18,
        flex: 1,
    },
    disclaimerBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        marginTop: 4,
    },
    disclaimerText: {
        color: '#64748B',
        fontSize: 11,
        lineHeight: 16,
        flex: 1,
    },
});

export default DrugInteractionScreen;
