import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import ar from './locales/ar.json';
import tr from './locales/tr.json';

const resources = {
    en: { translation: en },
    ar: { translation: ar },
    tr: { translation: tr },
};

const initI18n = async () => {
    let savedLanguage = await AsyncStorage.getItem('userLanguage');

    if (!savedLanguage) {
        const deviceLocale = (Localization as any).locale || 'en';
        savedLanguage = deviceLocale.split('-')[0];
    }

    i18n
        .use(initReactI18next)
        .init({
            resources,
            lng: savedLanguage || 'en',
            fallbackLng: 'en',
            interpolation: {
                escapeValue: false,
            },
        });
};

initI18n();

export default i18n;
