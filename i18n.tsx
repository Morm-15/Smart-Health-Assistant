import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import ar from './locales/ar.json';
import tr from './locales/tr.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import de from './locales/de.json';
import it from './locales/it.json';
import ru from './locales/ru.json';
import pt from './locales/pt.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import hi from './locales/hi.json';
import id from './locales/id.json';
import fa from './locales/fa.json';
import ur from './locales/ur.json';

export const resources = {
    en: { translation: en },
    ar: { translation: ar },
    tr: { translation: tr },
    fr: { translation: fr },
    es: { translation: es },
    de: { translation: de },
    it: { translation: it },
    ru: { translation: ru },
    pt: { translation: pt },
    zh: { translation: zh },
    ja: { translation: ja },
    ko: { translation: ko },
    hi: { translation: hi },
    id: { translation: id },
    fa: { translation: fa },
    ur: { translation: ur },
};

export const getDeviceLanguageCode = (): string => {
    try {
        const locales = Localization.getLocales ? Localization.getLocales() : [];
        if (locales && locales.length > 0 && locales[0].languageCode) {
            return locales[0].languageCode;
        }
        const locale = (Localization as any).locale || 'en';
        return locale.split('-')[0];
    } catch {
        return 'en';
    }
};

const initI18n = async () => {
    let savedLanguage = await AsyncStorage.getItem('userLanguage');

    if (!savedLanguage || savedLanguage === 'system') {
        const deviceCode = getDeviceLanguageCode();
        savedLanguage = resources[deviceCode as keyof typeof resources] ? deviceCode : 'en';
    }

    i18n
        .use(initReactI18next)
        .init({
            resources,
            lng: savedLanguage,
            fallbackLng: 'en',
            interpolation: {
                escapeValue: false,
            },
        });
};

initI18n();

export default i18n;
