import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import BackButton from '../components/BackButton';
import { getMedications, deleteMedication, Medication } from '../services/medicationService';
import { useFocusEffect } from '@react-navigation/native';

const ManageMedicationsScreen = ({ navigation }: any) => {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const [medications, setMedications] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);

    const loadMedications = async () => {
        try {
            setLoading(true);
            const meds = await getMedications();
            setMedications(meds);
        } catch (error) {
            Alert.alert(t('error'), t('medication.errorLoadingMedications'));
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadMedications();
        }, [])
    );

    const handleDeleteMedication = (id: string, medName: string) => {
        Alert.alert(
            t('medication.deleteTitle'),
            t('medication.deleteConfirmation', { medName }),
            [
                {
                    text: t('medication.cancel'),
                    style: 'cancel',
                },
                {
                    text: t('medication.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMedication(id);
                            await loadMedications();
                            Alert.alert(t('success'), t('medication.deleteSuccess'));
                        } catch (error) {
                            Alert.alert(t('error'), t('medication.errorDeletingMedication'));
                        }
                    },
                },
            ]
        );
    };

    const getStomachIcon = (status: string) => {
        switch (status) {
            case 'empty':
                return { name: 'food-apple-outline', color: '#f59e42' };
            case 'full':
                return { name: 'food-drumstick-outline', color: '#34d399' };
            default:
                return { name: 'circle-outline', color: '#9CA3AF' };
        }
    };

    const getReminderIcon = (type: string) => {
        switch (type) {
            case 'alarm':
                return { name: 'alarm-outline', color: '#f97316' };
            case 'both':
                return { name: 'volume-high', color: '#6366f1' };
            default:
                return { name: 'notifications-outline', color: '#10b981' };
        }
    };

    const formatTime = (date: any) => {
        if (!date) return '';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderMedicationCard = ({ item }: { item: Medication }) => {
        const stomachIcon = getStomachIcon(item.stomachStatus);
        const reminderIcon = getReminderIcon(item.reminderType);

        return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <MaterialCommunityIcons name="pill" size={24} color={colors.primary} />
                        <Text style={[styles.medName, { color: colors.text }]}>{item.medName}</Text>
                    </View>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('AddMedicationScreen', {
                                medication: item,
                                isEdit: true
                            })}
                            style={styles.editButton}
                        >
                            <Ionicons name="pencil-outline" size={22} color="#3b82f6" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleDeleteMedication(item.id!, item.medName)}
                            style={styles.deleteButton}
                        >
                            <Ionicons name="trash-outline" size={22} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons
                            name={stomachIcon.name as any}
                            size={20}
                            color={stomachIcon.color}
                        />
                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                            {t(`medication.stomach${item.stomachStatus.charAt(0).toUpperCase() + item.stomachStatus.slice(1)}`)}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons
                            name={reminderIcon.name as any}
                            size={20}
                            color={reminderIcon.color}
                        />
                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                            {t(`medication.${item.reminderType}`)}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={20} color={colors.primary} />
                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                            {formatTime(item.reminderTime)}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="pill" size={20} color="#8B5CF6" />
                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                            {t('medication.dose')}: {item.doseAmount}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <BackButton />
            <Text style={[styles.title, { color: colors.primary }]}>
                {t('home.manageMedications')}
            </Text>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : medications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="pill" size={80} color={colors.textSecondary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {t('medication.noMedications')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('AddMedicationScreen')}
                    >
                        <Ionicons name="add-circle-outline" size={24} color="#fff" />
                        <Text style={styles.addButtonText}>{t('medication.addNewMedication')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={medications}
                    renderItem={renderMedicationCard}
                    keyExtractor={(item) => item.id!}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {medications.length > 0 && (
                <TouchableOpacity
                    style={[styles.floatingButton, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate('AddMedicationScreen')}
                >
                    <Ionicons name="add" size={30} color="#fff" />
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        marginTop: 20,
        marginBottom: 30,
        textAlign: 'center',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    listContainer: {
        paddingBottom: 100,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    medName: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    editButton: {
        padding: 8,
    },
    deleteButton: {
        padding: 8,
    },
    cardBody: {
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoText: {
        fontSize: 15,
    },
    floatingButton: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
});

export default ManageMedicationsScreen;

