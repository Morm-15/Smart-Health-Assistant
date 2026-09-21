export interface LanguageItem {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
    isRtl?: boolean;
}

export const PLAY_STORE_LANGUAGES: LanguageItem[] = [
    { code: 'system', name: 'System Default', nativeName: 'تلقائي حسب لغة الهاتف', flag: '🌐' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRtl: true },
    { code: 'en', name: 'English', nativeName: 'English (US/UK)', flag: '🇺🇸' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'zh', name: 'Chinese', nativeName: '简体中文', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', isRtl: true },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', isRtl: true },
];

export const getLanguageItem = (code: string): LanguageItem => {
    return PLAY_STORE_LANGUAGES.find(l => l.code === code) || PLAY_STORE_LANGUAGES[2]; // Default to English
};
