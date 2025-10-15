// AddMedicationScreen.tsx
import React, { useState } from 'react';
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
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import BackButton from '../components/BackButton';

const stomachOptions = [
    { label: 'لا يهم', value: 'لا يهم', icon: { name: 'circle-outline', lib: 'MaterialCommunityIcons', color: '#9CA3AF' } },
    { label: 'فارغة', value: 'فارغة', icon: { name: 'food-apple-outline', lib: 'MaterialCommunityIcons', color: '#f59e42' } },
    { label: 'ممتلئة', value: 'ممتلئة', icon: { name: 'food-drumstick-outline', lib: 'MaterialCommunityIcons', color: '#34d399' } },
];

const reminderTypeOptions = [
    { label: 'إشعار', value: 'notification', icon: { name: 'notifications-outline', lib: 'Ionicons', color: '#10b981' } },
    { label: 'صوت', value: 'alarm', icon: { name: 'alarm-outline', lib: 'Ionicons', color: '#f97316' } },
    { label: 'كلاهما', value: 'both', icon: { name: 'volume-high', lib: 'Ionicons', color: '#6366f1' } },
];

const renderOptionIcon = (icon: { name: string; lib: string; color?: string }, size = 20) => {
    const color = icon.color ?? '#333';
    if (icon.lib === 'Ionicons') return <Ionicons name={icon.name as any} size={size} color={color} />;
    if (icon.lib === 'FontAwesome5') return <FontAwesome5 name={icon.name as any} size={size} color={color} />;
    // default to MaterialCommunityIcons
    return <MaterialCommunityIcons name={icon.name as any} size={size} color={color} />;
};

const AddMedicationScreen = ({ navigation }: any) => {
    const [medName, setMedName] = useState('');
    const [stomachStatus, setStomachStatus] = useState('لا يهم');
    const [reminderType, setReminderType] = useState('notification');
    const [doseAmount, setDoseAmount] = useState('');
    const [reminderTime, setReminderTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);

    // custom pickers
    const [showStomachPicker, setShowStomachPicker] = useState(false);
    const [showReminderPicker, setShowReminderPicker] = useState(false);

    const handleAddMedication = async () => {
        try {
            if (!medName || !doseAmount) {
                Alert.alert('تنبيه', 'يرجى إدخال جميع الحقول المطلوبة');
                return;
            }
            await addMedication(medName, stomachStatus, reminderType, Number(doseAmount), reminderTime);
            Alert.alert('تم', 'تمت إضافة الدواء بنجاح');
            navigation.goBack();
        } catch (error) {
            Alert.alert('خطأ', 'حدث خطأ أثناء إضافة الدواء');
        }
    };

    // Time picker change handler for Android (dialog) and iOS (modal spinner)
    const onChangeTimeAndroid = (_event: any, selectedDate?: Date) => {
        // On Android the event has type 'set' when user confirms, 'dismissed' when cancelled.
        setShowTimePicker(false);
        if (selectedDate) setReminderTime(selectedDate);
    };

    return (
        <View style={styles.container}>
            <BackButton  />
            <Text style={styles.title}>إضافة دواء جديد</Text>

            {/* اسم الدواء */}
            <View style={styles.fieldRow}>
                <View style={styles.labelRow}>
                    <Text style={styles.label}>اسم الدواء</Text>
                    <MaterialCommunityIcons name="pill" size={20} color="#3b82f6" />
                </View>
                <TextInput
                    style={styles.input}
                    value={medName}
                    onChangeText={setMedName}
                    placeholder="أدخل اسم الدواء"
                    placeholderTextColor="#999"
                />
            </View>

            {/* حالة المعدة (custom picker with icons) */}
            <View style={styles.fieldRow}>
                <View style={styles.labelRow}>
                    <Text style={styles.label}>حالة المعدة</Text>
                    <MaterialCommunityIcons name="stomach" size={20} color="#f59e42" />
                </View>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setShowStomachPicker(true)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {/* show selected icon */}
                        {renderOptionIcon(stomachOptions.find(o => o.value === stomachStatus)!.icon, 18)}
                        <Text style={styles.pickerText}>{stomachStatus}</Text>
                        <Ionicons name="chevron-down" size={18} color="#666" style={{ marginLeft: 6 }} />
                    </View>
                </TouchableOpacity>
            </View>

            {/* نوع التذكير (custom picker with icons) */}
            <View style={styles.fieldRow}>
                <View style={styles.labelRow}>
                    <Text style={styles.label}>نوع التذكير</Text>
                    <Ionicons name="notifications-outline" size={20} color="#10b981" />
                </View>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setShowReminderPicker(true)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {renderOptionIcon(reminderTypeOptions.find(o => o.value === reminderType)!.icon, 18)}
                        <Text style={styles.pickerText}>
                            {reminderTypeOptions.find(o => o.value === reminderType)!.label}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color="#666" style={{ marginLeft: 6 }} />
                    </View>
                </TouchableOpacity>
            </View>

            {/* كمية الجرعة */}
            <View style={styles.fieldRow}>
                <View style={styles.labelRow}>
                    <Text style={styles.label}>كمية الجرعة</Text>
                    <FontAwesome5 name="syringe" size={18} color="#ef4444" />
                </View>
                <TextInput
                    style={styles.input}
                    value={doseAmount}
                    onChangeText={setDoseAmount}
                    placeholder="أدخل كمية الجرعة"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                />
            </View>

            {/* وقت التذكير */}
            <View style={styles.fieldRow}>
                <View style={styles.labelRow}>
                    <Text style={styles.label}>وقت التذكير</Text>
                    <Ionicons name="time-outline" size={20} color="#6366f1" />
                </View>

                <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => {
                        // On Android we show native dialog by rendering DateTimePicker inline (no modal).
                        // On iOS we show a custom modal with spinner to match UI.
                        setShowTimePicker(true);
                    }}
                >
                    <Text style={styles.timeText}>
                        {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#6366f1" />
                </TouchableOpacity>
            </View>

            {/* Android: render native DateTimePicker (dialog style) when showTimePicker true */}
            {showTimePicker && Platform.OS === 'android' && (
                <DateTimePicker
                    value={reminderTime}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={onChangeTimeAndroid}
                />
            )}

            {/* iOS: modal spinner */}
            {Platform.OS === 'ios' && (
                <Modal visible={showTimePicker} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
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
                            <Button title="تم" onPress={() => setShowTimePicker(false)} color="#6366f1" />
                        </View>
                    </View>
                </Modal>
            )}

            <View style={{ marginTop: 30 }}>
                <Button title="إضافة الدواء" color="#3b82f6" onPress={handleAddMedication} />
            </View>

            {/* Stomach Picker Modal */}
            <Modal visible={showStomachPicker} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalListContainer]}>
                        <Text style={styles.modalTitle}>اختر حالة المعدة</Text>
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
                                        pressed ? { backgroundColor: '#f3f4f6' } : undefined,
                                    ]}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <Text style={styles.optionLabel}>{item.label}</Text>
                                        <View style={{ width: 10 }} />
                                        {renderOptionIcon(item.icon, 20)}
                                    </View>
                                </Pressable>
                            )}
                        />
                        <Button title="إلغاء" onPress={() => setShowStomachPicker(false)} color="#ef4444" />
                    </View>
                </View>
            </Modal>

            {/* Reminder Type Picker Modal */}
            <Modal visible={showReminderPicker} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalListContainer]}>
                        <Text style={styles.modalTitle}>اختر نوع التذكير</Text>
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
                                        pressed ? { backgroundColor: '#f3f4f6' } : undefined,
                                    ]}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <Text style={styles.optionLabel}>{item.label}</Text>
                                        <View style={{ width: 10 }} />
                                        {renderOptionIcon(item.icon, 20)}
                                    </View>
                                </Pressable>
                            )}
                        />
                        <Button title="إلغاء" onPress={() => setShowReminderPicker(false)} color="#ef4444" />
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
