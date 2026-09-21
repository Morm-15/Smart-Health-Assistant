import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    FlatList,
    TextInput,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { PLAY_STORE_LANGUAGES, LanguageItem } from '../constants/languages';
import { getDeviceLanguageCode, resources } from '../i18n';

interface LanguageSelectModalProps {
    visible: boolean;
    onClose: () => void;
}

const LanguageSelectModal: React.FC<LanguageSelectModalProps> = ({ visible, onClose }) => {
    const { t, i18n } = useTranslation();
    const { colors, isDarkMode } = useTheme();
    const [search, setSearch] = useState('');

    const filteredLanguages = PLAY_STORE_LANGUAGES.filter(item => {
        const query = search.toLowerCase();
        return (
            item.name.toLowerCase().includes(query) ||
            item.nativeName.toLowerCase().includes(query) ||
            item.code.toLowerCase().includes(query)
        );
    });

    const handleSelect = async (lang: LanguageItem) => {
        try {
            if (lang.code === 'system') {
                const deviceCode = getDeviceLanguageCode();
                const targetLang = resources[deviceCode as keyof typeof resources] ? deviceCode : 'en';
                await i18n.changeLanguage(targetLang);
                await AsyncStorage.setItem('userLanguage', 'system');
            } else {
                await i18n.changeLanguage(lang.code);
                await AsyncStorage.setItem('userLanguage', lang.code);
            }
        } catch (e) {
            console.error('Error changing language:', e);
        } finally {
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.sheetContainer, { backgroundColor: colors.surface }]}>
                    {/* Header */}
                    <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.headerTitleBox}>
                            <Text style={[styles.sheetTitle, { color: colors.text }]}>
                                {t('settings.selectLanguage') || 'Select Language'}
                            </Text>
                            <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                                {i18n.language === 'ar' ? 'لغات متجر جوجل بلاي المعتمدة عالمياً' : 'Official Google Play Store Languages'}
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Search Input */}
                    <View style={[styles.searchBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: colors.border }]}>
                        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder={i18n.language === 'ar' ? 'ابحث عن لغة...' : 'Search language...'}
                            placeholderTextColor={colors.textSecondary}
                            value={search}
                            onChangeText={setSearch}
                            clearButtonMode="while-editing"
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch('')}>
                                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Languages List */}
                    <FlatList
                        data={filteredLanguages}
                        keyExtractor={item => item.code}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => {
                            const isSelected = item.code === i18n.language;

                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.langRow,
                                        {
                                            backgroundColor: isSelected
                                                ? isDarkMode ? 'rgba(79, 70, 229, 0.18)' : '#EEF2FF'
                                                : 'transparent',
                                            borderColor: isSelected ? '#4F46E5' : colors.border,
                                        },
                                    ]}
                                    onPress={() => handleSelect(item)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.langLeft}>
                                        <Text style={styles.flagEmoji}>{item.flag}</Text>
                                        <View>
                                            <Text
                                                style={[
                                                    styles.nativeNameText,
                                                    {
                                                        color: isSelected ? '#4F46E5' : colors.text,
                                                        fontWeight: isSelected ? '700' : '600',
                                                    },
                                                ]}
                                            >
                                                {item.nativeName}
                                            </Text>
                                            <Text style={[styles.englishNameText, { color: colors.textSecondary }]}>
                                                {item.name}
                                            </Text>
                                        </View>
                                    </View>

                                    {isSelected ? (
                                        <Ionicons name="checkmark-circle" size={22} color="#4F46E5" />
                                    ) : (
                                        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} opacity={0.4} />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        justifyContent: 'flex-end',
    },
    sheetContainer: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingTop: 16,
        paddingHorizontal: 20,
        maxHeight: '82%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 14,
        borderBottomWidth: 1,
    },
    headerTitleBox: {
        flex: 1,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sheetSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    closeBtn: {
        padding: 6,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 14,
        marginBottom: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        padding: 0,
    },
    listContent: {
        paddingBottom: 30,
        gap: 8,
    },
    langRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
    },
    langLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    flagEmoji: {
        fontSize: 26,
    },
    nativeNameText: {
        fontSize: 15,
    },
    englishNameText: {
        fontSize: 12,
        marginTop: 1,
    },
});

export default LanguageSelectModal;
