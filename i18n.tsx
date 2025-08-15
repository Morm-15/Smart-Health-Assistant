import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import ar from './locales/ar.json';
import tr from './locales/tr.json';

interface Resources {
    [key: string]: {
        translation: Record<string, string>;
    };
}

const resources: Resources = {
    en: { translation: en },
    ar: { translation: ar },
    tr: { translation: tr },
};

const deviceLocale = (Localization as any).locale || 'en';
const languageCode = deviceLocale.split('-')[0];

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: languageCode,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
