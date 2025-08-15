import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../i18n';

const { width } = Dimensions.get('window');

const LanguagePicker = () => {
    const [language, setLanguage] = useState(i18n.language || 'en');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const loadLanguage = async () => {
            const savedLang = await AsyncStorage.getItem('user-language');
            if (savedLang && savedLang !== language) {
                setLanguage(savedLang);
                i18n.changeLanguage(savedLang);
            }
        };
        loadLanguage();
    }, []);

    const changeAppLanguage = async (lang: string) => {
        setLanguage(lang);
        await AsyncStorage.setItem('user-language', lang);
        i18n.changeLanguage(lang);
    };

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => setIsFocused(true)}
            onPressOut={() => setIsFocused(false)}
            style={[styles.wrapper, isFocused && styles.wrapperFocused]}
        >
            <View style={styles.container}>
                <Ionicons name="language-outline" size={18} color="#555" style={styles.icon} />
                <Picker
                    selectedValue={language}
                    onValueChange={changeAppLanguage}
                    style={styles.picker}
                    dropdownIconColor="#555"
                    itemStyle={styles.pickerItem}
                >
                    <Picker.Item label="English" value="en" />
                    <Picker.Item label="العربية" value="ar" />
                    <Picker.Item label="Türkçe" value="tr" />
                </Picker>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginVertical: 15,
        alignSelf: 'center', // لتوسيط العنصر
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        width: width * 0.5, // 80% من عرض الشاشة
    },
    wrapperFocused: {
        borderColor: '#007AFF',
        borderWidth: 2,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 55,
        width: '100%',
    },
    icon: {
        marginRight: 10,
    },
    picker: {
        flex: 1,
        color: '#333',
        height: 55,
    },
    pickerItem: {
        fontSize: 16,
        height: 55,
    },
});

export default LanguagePicker;
