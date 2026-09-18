import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    StatusBar,
    Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '../components/ScreenHeader';
import {
    analyzeLabReportImage,
    prepareLabImageBase64,
    getDemoLabReport,
    LabReportAnalysis,
    LabTestItem,
} from '../services/labReportService';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const LabReportAnalyzerScreen = () => {
    const { colors, isDarkMode } = useTheme();
    const navigation = useNavigation<NavigationProp>();
    const { t, i18n } = useTranslation();

    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [analysisStage, setAnalysisStage] = useState<string>('');
    const [report, setReport] = useState<LabReportAnalysis | null>(null);
    const [filter, setFilter] = useState<'all' | 'abnormal' | 'normal'>('all');
    const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});

    // Laser scanning animation
    const scanAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isAnalyzing) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanAnim, {
                        toValue: 1,
                        duration: 1600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanAnim, {
                        toValue: 0,
                        duration: 1600,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            scanAnim.stopAnimation();
            scanAnim.setValue(0);
        }
    }, [isAnalyzing]);

    const requestPermissions = async () => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return cameraStatus === 'granted' && libraryStatus === 'granted';
    };

    const handleTakePhoto = async () => {
        try {
            const hasPerm = await requestPermissions();
            if (!hasPerm) {
                Alert.alert(t('common.error'), t('labAnalyzer.permissionNeeded'));
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.9,
                allowsEditing: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                setImageUri(uri);
                processAnalysis(uri);
            }
        } catch (e: any) {
            console.error('Camera error:', e);
            Alert.alert(t('common.error'), t('labAnalyzer.cameraError'));
        }
    };

    const handlePickGallery = async () => {
        try {
            const hasPerm = await requestPermissions();
            if (!hasPerm) {
                Alert.alert(t('common.error'), t('labAnalyzer.permissionNeeded'));
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.9,
                allowsEditing: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                setImageUri(uri);
                processAnalysis(uri);
            }
        } catch (e: any) {
            console.error('Gallery error:', e);
            Alert.alert(t('common.error'), t('labAnalyzer.galleryError'));
        }
    };

    const handleDemoSample = () => {
        setImageUri(null);
        setIsAnalyzing(true);
        setAnalysisStage(t('labAnalyzer.stageReading'));

        setTimeout(() => {
            setAnalysisStage(t('labAnalyzer.stageEvaluating'));
        }, 600);

        setTimeout(() => {
            const currentLang = (i18n.language || 'ar') as 'ar' | 'en' | 'tr';
            const demo = getDemoLabReport(currentLang);
            setReport(demo);
            setIsAnalyzing(false);
            setAnalysisStage('');
        }, 1200);
    };

    const processAnalysis = async (uri: string) => {
        setIsAnalyzing(true);
        setReport(null);
        setAnalysisStage(t('labAnalyzer.stageReading'));

        try {
            // Stage 1: Compress & Prepare base64
            const base64 = await prepareLabImageBase64(uri);

            setAnalysisStage(t('labAnalyzer.stageEvaluating'));

            // Stage 2: Send to Gemini Vision
            const currentLang = (i18n.language || 'ar') as 'ar' | 'en' | 'tr';
            const result = await analyzeLabReportImage(base64, currentLang);

            setAnalysisStage(t('labAnalyzer.stageFinalizing'));
            setReport(result);
        } catch (error: any) {
            console.error('Analysis error:', error);
            Alert.alert(
                t('common.error'),
                error?.message || t('labAnalyzer.analysisFailedMessage')
            );
        } finally {
            setIsAnalyzing(false);
            setAnalysisStage('');
        }
    };

    const toggleExpandTest = (key: string) => {
        setExpandedTests(prev => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const resetAnalysis = () => {
        setImageUri(null);
        setReport(null);
        setFilter('all');
        setExpandedTests({});
    };

    const handleShareSummary = async () => {
        if (!report) return;
        try {
            const abnormalSummary = report.tests
                .filter(t => t.status !== 'normal')
                .map(t => `• ${t.name} (${t.code}): ${t.value} ${t.unit} [${t.status === 'high' ? 'High' : 'Low'}]`)
                .join('\n');

            const textToShare = `${report.reportTitle}\n${report.overallSummary}\n\n${t('labAnalyzer.abnormalTestsTitle')}:\n${abnormalSummary}\n\nSmart Health Assistant`;
            await Share.share({ message: textToShare });
        } catch {}
    };

    const handleDiscussWithAi = () => {
        if (!report) return;
        const abnormalItems = report.tests
            .filter(t => t.status !== 'normal')
            .map(t => `${t.name}: ${t.value} ${t.unit} (طبيعي: ${t.referenceRange})`)
            .join('، ');

        const prompt = `${t('labAnalyzer.chatAiPromptIntro')} "${report.reportTitle}". ${t('labAnalyzer.overallSummary')}: ${report.overallSummary}. ${t('labAnalyzer.abnormalItemsList')}: ${abnormalItems || 'لا توجد'}. ${t('labAnalyzer.chatAiPromptQuestion')}`;

        navigation.navigate('ChatAI', { initialPrompt: prompt });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'high':
                return '#EF4444';
            case 'low':
                return '#F59E0B';
            case 'abnormal':
                return '#DC2626';
            case 'normal':
                return '#10B981';
            default:
                return '#64748B';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'high':
                return t('labAnalyzer.statusHigh');
            case 'low':
                return t('labAnalyzer.statusLow');
            case 'abnormal':
                return t('labAnalyzer.statusAbnormal');
            case 'normal':
                return t('labAnalyzer.statusNormal');
            default:
                return t('labAnalyzer.statusUnknown');
        }
    };

    const getUrgencyConfig = (urgency: string) => {
        switch (urgency) {
            case 'urgent':
                return {
                    color: '#DC2626',
                    bg: 'rgba(220, 38, 38, 0.12)',
                    icon: 'alert-circle',
                    label: t('labAnalyzer.urgencyUrgent'),
                };
            case 'attention':
                return {
                    color: '#F59E0B',
                    bg: 'rgba(245, 158, 11, 0.12)',
                    icon: 'warning-outline',
                    label: t('labAnalyzer.urgencyAttention'),
                };
            default:
                return {
                    color: '#10B981',
                    bg: 'rgba(16, 185, 129, 0.12)',
                    icon: 'checkmark-circle-outline',
                    label: t('labAnalyzer.urgencyNormal'),
                };
        }
    };

    const filteredTests = (report?.tests || []).filter(test => {
        if (filter === 'abnormal') return test.status !== 'normal';
        if (filter === 'normal') return test.status === 'normal';
        return true;
    });

    const scanTranslateY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 220],
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            {/* Header */}
            <ScreenHeader
                title={t('labAnalyzer.screenTitle')}
                subtitle={t('labAnalyzer.screenSubtitle')}
                rightElement={
                    report ? (
                        <TouchableOpacity style={styles.headerActionBtn} onPress={resetAnalysis}>
                            <Ionicons name="refresh" size={22} color="#4F46E5" />
                        </TouchableOpacity>
                    ) : undefined
                }
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* 1. Upload & Action Section (Visible when no report is loaded) */}
                {!report && (
                    <View style={styles.uploadSection}>
                        {/* Hero Card */}
                        <View style={[styles.heroBanner, { backgroundColor: isDarkMode ? '#1E1B4B' : '#EEF2FF', borderColor: '#818CF8' }]}>
                            <View style={styles.heroIconCircle}>
                                <Ionicons name="flask" size={32} color="#6366F1" />
                            </View>
                            <Text style={[styles.heroHeading, { color: isDarkMode ? '#C7D2FE' : '#312E81' }]}>
                                {t('labAnalyzer.heroHeading')}
                            </Text>
                            <Text style={[styles.heroText, { color: isDarkMode ? '#94A3B8' : '#475569' }]}>
                                {t('labAnalyzer.heroDescription')}
                            </Text>
                        </View>

                        {/* Image Preview & Scanning Laser */}
                        {imageUri ? (
                            <View style={styles.previewContainer}>
                                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                                {isAnalyzing && (
                                    <>
                                        <View style={styles.scanOverlay} />
                                        <Animated.View
                                            style={[
                                                styles.laserLine,
                                                { transform: [{ translateY: scanTranslateY }] },
                                            ]}
                                        />
                                    </>
                                )}
                            </View>
                        ) : null}

                        {/* Analyzing Progress Card */}
                        {isAnalyzing ? (
                            <View style={[styles.analyzingCard, { backgroundColor: colors.surface, borderColor: '#6366F1' }]}>
                                <ActivityIndicator size="large" color="#6366F1" style={{ marginBottom: 12 }} />
                                <Text style={[styles.analyzingTitle, { color: colors.text }]}>
                                    {t('labAnalyzer.analyzingTitle')}
                                </Text>
                                <Text style={[styles.analyzingStageText, { color: '#6366F1' }]}>
                                    {analysisStage || t('labAnalyzer.stageReading')}
                                </Text>
                                <Text style={[styles.analyzingHint, { color: colors.textSecondary }]}>
                                    {t('labAnalyzer.analyzingNotice')}
                                </Text>
                            </View>
                        ) : (
                            /* Action Buttons */
                            <View style={styles.actionButtonsRow}>
                                <TouchableOpacity
                                    style={[styles.primaryActionBtn, { backgroundColor: '#6366F1' }]}
                                    onPress={handleTakePhoto}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name="camera" size={24} color="#fff" />
                                    <Text style={styles.primaryActionBtnText}>
                                        {t('labAnalyzer.takePhotoBtn')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.secondaryActionBtn, { backgroundColor: colors.surface, borderColor: '#818CF8' }]}
                                    onPress={handlePickGallery}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name="images" size={24} color="#6366F1" />
                                    <Text style={[styles.secondaryActionBtnText, { color: '#6366F1' }]}>
                                        {t('labAnalyzer.chooseGalleryBtn')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Demo Sample Button */}
                        {!isAnalyzing && (
                            <TouchableOpacity
                                style={[styles.demoBtn, { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC', borderColor: colors.border }]}
                                onPress={handleDemoSample}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="sparkles" size={18} color="#10B981" />
                                <Text style={[styles.demoBtnText, { color: colors.text }]}>
                                    {t('labAnalyzer.demoReportBtn')}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Tips Card */}
                        <View style={[styles.instructionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={styles.instructionsHeader}>
                                <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
                                <Text style={[styles.instructionsTitle, { color: colors.text }]}>
                                    {t('labAnalyzer.tipsTitle')}
                                </Text>
                            </View>
                            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
                                • {t('labAnalyzer.tip1')}
                            </Text>
                            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
                                • {t('labAnalyzer.tip2')}
                            </Text>
                            <Text style={[styles.tipItem, { color: colors.textSecondary }]}>
                                • {t('labAnalyzer.tip3')}
                            </Text>
                        </View>
                    </View>
                )}

                {/* 2. Interactive Report Results View */}
                {report && (
                    <View style={styles.reportSection}>
                        {/* Urgency & Status Banner */}
                        {(() => {
                            const urgencyCfg = getUrgencyConfig(report.urgencyLevel);
                            return (
                                <View style={[styles.urgencyBanner, { backgroundColor: urgencyCfg.bg, borderColor: urgencyCfg.color }]}>
                                    <Ionicons name={urgencyCfg.icon as any} size={24} color={urgencyCfg.color} />
                                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                                        <Text style={[styles.urgencyTitle, { color: urgencyCfg.color }]}>
                                            {urgencyCfg.label}
                                        </Text>
                                        <Text style={[styles.urgencySubtitle, { color: colors.text }]}>
                                            {report.urgencyReason || report.reportTitle}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })()}

                        {/* Report Meta Card */}
                        <View style={[styles.reportMetaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={styles.reportMetaHeader}>
                                <Ionicons name="document-text" size={22} color="#6366F1" />
                                <Text style={[styles.reportTitleText, { color: colors.text }]}>
                                    {report.reportTitle}
                                </Text>
                            </View>

                            {(report.patientName || report.reportDate || report.labOrDoctorName) && (
                                <View style={styles.metaDetailsRow}>
                                    {report.patientName && (
                                        <View style={styles.metaBadge}>
                                            <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
                                            <Text style={[styles.metaBadgeText, { color: colors.textSecondary }]}>
                                                {report.patientName}
                                            </Text>
                                        </View>
                                    )}
                                    {report.reportDate && (
                                        <View style={styles.metaBadge}>
                                            <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                                            <Text style={[styles.metaBadgeText, { color: colors.textSecondary }]}>
                                                {report.reportDate}
                                            </Text>
                                        </View>
                                    )}
                                    {report.labOrDoctorName && (
                                        <View style={styles.metaBadge}>
                                            <Ionicons name="business-outline" size={13} color={colors.textSecondary} />
                                            <Text style={[styles.metaBadgeText, { color: colors.textSecondary }]}>
                                                {report.labOrDoctorName}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Overall Summary Text */}
                            <Text style={[styles.overallSummaryText, { color: colors.text }]}>
                                {report.overallSummary}
                            </Text>

                            {/* Summary Counter Badges */}
                            <View style={styles.counterRow}>
                                <View style={[styles.counterBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                                    <Text style={[styles.counterNum, { color: colors.text }]}>
                                        {report.totalTestsCount}
                                    </Text>
                                    <Text style={[styles.counterLabel, { color: colors.textSecondary }]}>
                                        {t('labAnalyzer.totalTests')}
                                    </Text>
                                </View>

                                <View style={[styles.counterBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                    <Text style={[styles.counterNum, { color: '#10B981' }]}>
                                        {report.normalTestsCount}
                                    </Text>
                                    <Text style={[styles.counterLabel, { color: '#10B981' }]}>
                                        {t('labAnalyzer.normalTests')}
                                    </Text>
                                </View>

                                <View style={[styles.counterBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                    <Text style={[styles.counterNum, { color: '#EF4444' }]}>
                                        {report.abnormalTestsCount}
                                    </Text>
                                    <Text style={[styles.counterLabel, { color: '#EF4444' }]}>
                                        {t('labAnalyzer.abnormalTests')}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Filter Tabs */}
                        <View style={styles.filterTabsRow}>
                            <TouchableOpacity
                                style={[
                                    styles.filterTabBtn,
                                    filter === 'all' && styles.filterTabBtnActive,
                                    { borderColor: filter === 'all' ? '#6366F1' : colors.border },
                                ]}
                                onPress={() => setFilter('all')}
                            >
                                <Text style={[styles.filterTabText, { color: filter === 'all' ? '#fff' : colors.text }]}>
                                    {t('labAnalyzer.filterAll')} ({report.totalTestsCount})
                                </Text>
                            </TouchableOpacity>

                            {report.abnormalTestsCount > 0 && (
                                <TouchableOpacity
                                    style={[
                                        styles.filterTabBtn,
                                        filter === 'abnormal' && [styles.filterTabBtnActive, { backgroundColor: '#EF4444' }],
                                        { borderColor: filter === 'abnormal' ? '#EF4444' : colors.border },
                                    ]}
                                    onPress={() => setFilter('abnormal')}
                                >
                                    <Text style={[styles.filterTabText, { color: filter === 'abnormal' ? '#fff' : '#EF4444' }]}>
                                        {t('labAnalyzer.filterAbnormal')} ({report.abnormalTestsCount})
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.filterTabBtn,
                                    filter === 'normal' && [styles.filterTabBtnActive, { backgroundColor: '#10B981' }],
                                    { borderColor: filter === 'normal' ? '#10B981' : colors.border },
                                ]}
                                onPress={() => setFilter('normal')}
                            >
                                <Text style={[styles.filterTabText, { color: filter === 'normal' ? '#fff' : '#10B981' }]}>
                                    {t('labAnalyzer.filterNormal')} ({report.normalTestsCount})
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Test Items List */}
                        <View style={styles.testsList}>
                            {filteredTests.map((test, idx) => {
                                const statusColor = getStatusColor(test.status);
                                const isExpanded = !!expandedTests[`test_${idx}`];

                                return (
                                    <View
                                        key={idx}
                                        style={[
                                            styles.testCard,
                                            {
                                                backgroundColor: colors.surface,
                                                borderColor: test.status !== 'normal' ? statusColor : colors.border,
                                            },
                                        ]}
                                    >
                                        <TouchableOpacity
                                            style={styles.testCardHeader}
                                            onPress={() => toggleExpandTest(`test_${idx}`)}
                                            activeOpacity={0.75}
                                        >
                                            <View style={styles.testTitleCol}>
                                                <View style={styles.testCodeRow}>
                                                    <Text style={[styles.testName, { color: colors.text }]}>
                                                        {test.name}
                                                    </Text>
                                                    {test.code ? (
                                                        <View style={[styles.codeBadge, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
                                                            <Text style={[styles.codeBadgeText, { color: colors.textSecondary }]}>
                                                                {test.code}
                                                            </Text>
                                                        </View>
                                                    ) : null}
                                                </View>
                                                <Text style={[styles.referenceText, { color: colors.textSecondary }]}>
                                                    {t('labAnalyzer.referenceRange')}: {test.referenceRange} {test.unit}
                                                </Text>
                                            </View>

                                            <View style={styles.testValueCol}>
                                                <Text style={[styles.testValueNumber, { color: statusColor }]}>
                                                    {test.value}
                                                </Text>
                                                <Text style={[styles.testValueUnit, { color: colors.textSecondary }]}>
                                                    {test.unit}
                                                </Text>
                                                <View style={[styles.statusTag, { backgroundColor: statusColor + '18' }]}>
                                                    <Text style={[styles.statusTagText, { color: statusColor }]}>
                                                        {getStatusLabel(test.status)}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>

                                        {/* Range Indicator Bar */}
                                        <View style={styles.rangeBarContainer}>
                                            <View style={[styles.rangeBarSegment, { backgroundColor: '#F59E0B', flex: 1 }]} />
                                            <View style={[styles.rangeBarSegment, { backgroundColor: '#10B981', flex: 2 }]} />
                                            <View style={[styles.rangeBarSegment, { backgroundColor: '#EF4444', flex: 1 }]} />
                                        </View>

                                        {/* Expandable Explanation & Clinical Tip */}
                                        {isExpanded ? (
                                            <View style={[styles.testExpandedBody, { borderTopColor: colors.border }]}>
                                                {test.meaning ? (
                                                    <View style={styles.explanationBlock}>
                                                        <Text style={[styles.explanationLabel, { color: '#6366F1' }]}>
                                                            💡 {t('labAnalyzer.testMeaningTitle')}:
                                                        </Text>
                                                        <Text style={[styles.explanationText, { color: colors.text }]}>
                                                            {test.meaning}
                                                        </Text>
                                                    </View>
                                                ) : null}

                                                {test.clinicalTip ? (
                                                    <View style={styles.explanationBlock}>
                                                        <Text style={[styles.explanationLabel, { color: '#10B981' }]}>
                                                            🩺 {t('labAnalyzer.clinicalTipTitle')}:
                                                        </Text>
                                                        <Text style={[styles.explanationText, { color: colors.text }]}>
                                                            {test.clinicalTip}
                                                        </Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.expandPromptBtn}
                                                onPress={() => toggleExpandTest(`test_${idx}`)}
                                            >
                                                <Text style={[styles.expandPromptText, { color: '#6366F1' }]}>
                                                    {t('labAnalyzer.viewMeaning')}
                                                </Text>
                                                <Ionicons name="chevron-down" size={16} color="#6366F1" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })}
                        </View>

                        {/* Key Findings Section */}
                        {report.keyFindings && report.keyFindings.length > 0 && (
                            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={styles.sectionHeaderRow}>
                                    <Ionicons name="list-circle" size={22} color="#6366F1" />
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                        {t('labAnalyzer.keyFindingsTitle')}
                                    </Text>
                                </View>
                                {report.keyFindings.map((finding, kIdx) => (
                                    <View key={kIdx} style={styles.bulletItemRow}>
                                        <View style={[styles.bulletDot, { backgroundColor: '#6366F1' }]} />
                                        <Text style={[styles.bulletItemText, { color: colors.text }]}>
                                            {finding}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Doctor Questions Section */}
                        {report.doctorQuestions && report.doctorQuestions.length > 0 && (
                            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={styles.sectionHeaderRow}>
                                    <Ionicons name="help-buoy" size={22} color="#F59E0B" />
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                        {t('labAnalyzer.doctorQuestionsTitle')}
                                    </Text>
                                </View>
                                {report.doctorQuestions.map((question, qIdx) => (
                                    <View key={qIdx} style={styles.questionItemRow}>
                                        <Text style={styles.questionNumberBadge}>{qIdx + 1}</Text>
                                        <Text style={[styles.bulletItemText, { color: colors.text }]}>
                                            {question}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Bottom Actions: Discuss with ChatAI & Share */}
                        <View style={styles.bottomActions}>
                            <TouchableOpacity
                                style={[styles.chatAiActionBtn, { backgroundColor: '#10B981' }]}
                                onPress={handleDiscussWithAi}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#fff" />
                                <Text style={styles.chatAiActionBtnText}>
                                    {t('labAnalyzer.discussWithAiBtn')}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.secondaryButtonsRow}>
                                <TouchableOpacity
                                    style={[styles.smallActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                    onPress={handleShareSummary}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="share-social-outline" size={18} color={colors.text} />
                                    <Text style={[styles.smallActionBtnText, { color: colors.text }]}>
                                        {t('labAnalyzer.shareBtn')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.smallActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                    onPress={resetAnalysis}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="scan-outline" size={18} color="#6366F1" />
                                    <Text style={[styles.smallActionBtnText, { color: '#6366F1' }]}>
                                        {t('labAnalyzer.newScanBtn')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Medical Disclaimer */}
                        <View style={[styles.disclaimerBox, { backgroundColor: isDarkMode ? '#1E293B' : '#FEF2F2' }]}>
                            <Ionicons name="shield-outline" size={18} color="#DC2626" />
                            <Text style={styles.disclaimerText}>
                                {report.disclaimer || t('labAnalyzer.disclaimerText')}
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitleBox: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    headerActionBtn: {
        padding: 8,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    uploadSection: {
        gap: 16,
    },
    heroBanner: {
        borderRadius: 18,
        borderWidth: 1,
        padding: 20,
        alignItems: 'center',
        textAlign: 'center',
    },
    heroIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    heroHeading: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
        textAlign: 'center',
    },
    heroText: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
    previewContainer: {
        width: '100%',
        height: 220,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    scanOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
    },
    laserLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#06B6D4',
        shadowColor: '#06B6D4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 10,
        elevation: 6,
    },
    analyzingCard: {
        borderRadius: 16,
        borderWidth: 1.5,
        padding: 24,
        alignItems: 'center',
    },
    analyzingTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    analyzingStageText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    analyzingHint: {
        fontSize: 12,
        textAlign: 'center',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    primaryActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
        elevation: 3,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    primaryActionBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
    secondaryActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        gap: 8,
    },
    secondaryActionBtnText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    demoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    demoBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    instructionsCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    instructionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    instructionsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    tipItem: {
        fontSize: 12,
        lineHeight: 18,
        marginBottom: 6,
    },
    reportSection: {
        gap: 16,
    },
    urgencyBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    urgencyTitle: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    urgencySubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    reportMetaCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    reportMetaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    reportTitleText: {
        fontSize: 17,
        fontWeight: 'bold',
        flex: 1,
    },
    metaDetailsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
    },
    metaBadgeText: {
        fontSize: 11,
    },
    overallSummaryText: {
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 16,
    },
    counterRow: {
        flexDirection: 'row',
        gap: 8,
    },
    counterBox: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 12,
    },
    counterNum: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    counterLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    filterTabsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    filterTabBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    filterTabBtnActive: {
        backgroundColor: '#6366F1',
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: '600',
    },
    testsList: {
        gap: 12,
    },
    testCard: {
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
    },
    testCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 14,
    },
    testTitleCol: {
        flex: 1,
    },
    testCodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    testName: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    codeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    codeBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    referenceText: {
        fontSize: 12,
    },
    testValueCol: {
        alignItems: 'flex-end',
    },
    testValueNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    testValueUnit: {
        fontSize: 11,
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 4,
    },
    statusTagText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    rangeBarContainer: {
        flexDirection: 'row',
        height: 3,
        width: '100%',
        opacity: 0.6,
    },
    rangeBarSegment: {},
    testExpandedBody: {
        padding: 14,
        borderTopWidth: 1,
        gap: 10,
    },
    explanationBlock: {},
    explanationLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    explanationText: {
        fontSize: 12,
        lineHeight: 18,
    },
    expandPromptBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        gap: 4,
    },
    expandPromptText: {
        fontSize: 11,
        fontWeight: '600',
    },
    sectionCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    bulletItemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 8,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 6,
    },
    bulletItemText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
    },
    questionItemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 8,
    },
    questionNumberBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        color: '#F59E0B',
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 20,
    },
    bottomActions: {
        gap: 10,
        marginTop: 4,
    },
    chatAiActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
        elevation: 3,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    chatAiActionBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    secondaryButtonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    smallActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 6,
    },
    smallActionBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    disclaimerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 11,
        color: '#DC2626',
        lineHeight: 16,
    },
});

export default LabReportAnalyzerScreen;
