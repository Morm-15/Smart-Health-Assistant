// AddMedicationScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Modal,
    Platform,
    FlatList,
    Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addMedication } from '../services/medicationService';
import { registerForPushNotificationsAsync } from '../services/notificationService';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import BackButton from '../components/BackButton';

const AddMedicationScreen = ({ navigation }: any) => {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const [medName, setMedName] = useState('');
    const [stomachStatus, setStomachStatus] = useState('doesntMatter');
    const [reminderType, setReminderType] = useState('notification');
    const [doseAmount, setDoseAmount] = useState('');
    const [reminderTime, setReminderTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showStomachPicker, setShowStomachPicker] = useState(false);
    const [showReminderPicker, setShowReminderPicker] = useState(false);

    // طلب أذونات الإشعارات عند تحميل الشاشة
    useEffect(() => {
        registerForPushNotificationsAsync();
    }, []);

    const stomachOptions = [
        { label: t('medication.stomachDoesntMatter'), value: 'doesntMatter', icon: { name: 'circle-outline', lib: 'MaterialCommunityIcons', color: '#9CA3AF' } },
        { label: t('medication.stomachEmpty'), value: 'empty', icon: { name: 'food-apple-outline', lib: 'MaterialCommunityIcons', color: '#f59e42' } },
        { label: t('medication.stomachFull'), value: 'full', icon: { name: 'food-drumstick-outline', lib: 'MaterialCommunityIcons', color: '#34d399' } },
    ];

    const reminderTypeOptions = [
        { label: t('medication.notification'), value: 'notification', icon: { name: 'notifications-outline', lib: 'Ionicons', color: '#10b981' } },
        { label: t('medication.alarm'), value: 'alarm', icon: { name: 'alarm-outline', lib: 'Ionicons', color: '#f97316' } },
        { label: t('medication.both'), value: 'both', icon: { name: 'volume-high', lib: 'Ionicons', color: '#6366f1' } },
    ];

    const renderOptionIcon = (icon: { name: string; lib: string; color?: string }, size = 20) => {
        const color = icon.color ?? '#333';
        if (icon.lib === 'Ionicons') return <Ionicons name={icon.name as any} size={size} color={color} />;
        if (icon.lib === 'FontAwesome5') return <FontAwesome5 name={icon.name as any} size={size} color={color} />;
        return <MaterialCommunityIcons name={icon.name as any} size={size} color={color} />;
    };

    const handleAddMedication = async () => {
        try {
            if (!medName || !doseAmount) {
                Alert.alert(t('medication.warning'), t('medication.fillAllFields'));
                return;
            }
            await addMedication(medName, stomachStatus, reminderType, Number(doseAmount), reminderTime);
            Alert.alert(t('medication.successTitle'), t('medication.successMessage'));
            navigation.goBack();
        } catch (error) {
            Alert.alert(t('medication.errorTitle'), t('medication.errorMessage'));
        }
    };

    const onChangeTimeAndroid = (_event: any, selectedDate?: Date) => {
        setShowTimePicker(false);
        if (selectedDate) setReminderTime(selectedDate);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <BackButton  />
            <Text style={[styles.title, { color: colors.primary }]}>{t('medication.addTitle')}</Text>

            <View style={styles.fieldRow}>
                <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('medication.medicineName')}</Text>
                    <MaterialCommunityIcons name="pill" size={20} color={colors.primary} />
                </View>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={medName}
                    onChangeText={setMedName}
                    placeholder={t('medication.enterMedicineName')}
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            <View style={styles.fieldRow}>
                <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('medication.stomachStatus')}</Text>
                    <MaterialCommunityIcons name="stomach" size={20} color="#f59e42" />
                </View>
                <TouchableOpacity style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShowStomachPicker(true)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {renderOptionIcon(stomachOptions.find(o => o.value === stomachStatus)!.icon, 18)}
                        <Text style={[styles.pickerText, { color: colors.text }]}>{stomachOptions.find(o => o.value === stomachStatus)!.label}</Text>
                        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} style={{ marginLeft: 6 }} />
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.fieldRow}>
                <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('medication.reminderType')}</Text>
                    <Ionicons name="notifications-outline" size={20} color="#10b981" />
                </View>
                <TouchableOpacity style={[styles.pickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShowReminderPicker(true)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {renderOptionIcon(reminderTypeOptions.find(o => o.value === reminderType)!.icon, 18)}
                        <Text style={[styles.pickerText, { color: colors.text }]}>
                            {reminderTypeOptions.find(o => o.value === reminderType)!.label}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} style={{ marginLeft: 6 }} />
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.fieldRow}>
                <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('medication.doseAmount')}</Text>
                    <FontAwesome5 name="syringe" size={18} color="#ef4444" />
                </View>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={doseAmount}
                    onChangeText={setDoseAmount}
                    placeholder={t('medication.enterDoseAmount')}
                    keyboardType="numeric"
                    placeholderTextColor={colors.textSecondary}
                />
            </View>

            <View style={styles.fieldRow}>
                <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.text }]}>{t('medication.reminderTime')}</Text>
                    <Ionicons name="time-outline" size={20} color="#6366f1" />
                </View>
                <TouchableOpacity style={[styles.timeButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShowTimePicker(true)}>
                    <Text style={[styles.timeText, { color: colors.text }]}>
                        {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#6366f1" />
                </TouchableOpacity>
            </View>

            {showTimePicker && Platform.OS === 'android' && (
                <DateTimePicker
                    value={reminderTime}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={onChangeTimeAndroid}
                />
            )}

            {Platform.OS === 'ios' && (
                <Modal visible={showTimePicker} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <DateTimePicker
                                value={reminderTime}
                                mode="time"
                                is24Hour={true}
                                display="spinner"
                                onChange={(_e, selectedDate) => {
                                    if (selectedDate) setReminderTime(selectedDate);
                                }}
                                style={{ width: '100%' }}
                            />
                            <Button title={t('common.done')} onPress={() => setShowTimePicker(false)} color="#6366f1" />
                        </View>
                    </View>
                </Modal>
            )}

            <View style={{ marginTop: 30 }}>
                <Button title={t('medication.addMedication')} color="#3b82f6" onPress={handleAddMedication} />
            </View>

            <Modal visible={showStomachPicker} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalListContainer, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('medication.stomachStatus')}</Text>
                        <FlatList
                            data={stomachOptions}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => {
                                        setStomachStatus(item.value);
                                        setShowStomachPicker(false);
                                    }}
                                    style={({ pressed }) => [
                                        styles.optionRow,
                                        pressed ? { backgroundColor: colors.border } : undefined,
                                    ]}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <Text style={[styles.optionLabel, { color: colors.text }]}>{item.label}</Text>
                                        <View style={{ width: 10 }} />
                                        {renderOptionIcon(item.icon, 20)}
                                    </View>
                                </Pressable>
                            )}
                        />
                        <Button title={t('common.cancel')} onPress={() => setShowStomachPicker(false)} color="#ef4444" />
                    </View>
                </View>
            </Modal>

            <Modal visible={showReminderPicker} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalListContainer, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('medication.reminderType')}</Text>
                        <FlatList
                            data={reminderTypeOptions}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <Pressable
                                    onPress={() => {
                                        setReminderType(item.value);
                                        setShowReminderPicker(false);
                                    }}
                                    style={({ pressed }) => [
                                        styles.optionRow,
                                        pressed ? { backgroundColor: colors.border } : undefined,
                                    ]}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <Text style={[styles.optionLabel, { color: colors.text }]}>{item.label}</Text>
                                        <View style={{ width: 10 }} />
                                        {renderOptionIcon(item.icon, 20)}
                                    </View>
                                </Pressable>
                            )}
                        />
                        <Button title={t('common.cancel')} onPress={() => setShowReminderPicker(false)} color="#ef4444" />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f4f9ff',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#3b82f6',
        textAlign: 'center',
        marginBottom: 18,
        marginTop: 10,
    },
    fieldRow: {
        marginBottom: 18,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 6,
    },
    label: {
        fontSize: 15,
        color: '#333',
        textAlign: 'right',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#fff',
        textAlign: 'right',
    },
    pickerButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
    },
    pickerText: {
        fontSize: 15,
        color: '#333',
        marginRight: 8,
        textAlign: 'right',
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#fff',
        justifyContent: 'space-between',
    },
    timeText: {
        fontSize: 16,
        color: '#6366f1',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        width: 320,
    },
    modalListContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        width: 320,
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
    },
    optionRow: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    optionLabel: {
        fontSize: 15,
        color: '#333',
        textAlign: 'right',
        marginRight: 8,
    },
});

export default AddMedicationScreen;
