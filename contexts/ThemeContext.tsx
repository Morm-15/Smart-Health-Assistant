import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    colors: {
        background: string;
        surface: string;
        text: string;
        textSecondary: string;
        primary: string;
        border: string;
        card: string;
        shadow: string;
        // ألوان إضافية للكروت
        cardGradientStart: string;
        cardGradientEnd: string;
        cardIconBg: string;
    };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('darkModeEnabled');
            if (savedTheme !== null) {
                setIsDarkMode(JSON.parse(savedTheme));
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    };

    const toggleDarkMode = async () => {
        try {
            const newValue = !isDarkMode;
            setIsDarkMode(newValue);
            await AsyncStorage.setItem('darkModeEnabled', JSON.stringify(newValue));
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const colors = isDarkMode
        ? {
            // Dark Mode Colors - Deep obsidian slate
            background: '#090D16',
            surface: '#111827',
            text: '#F8FAFC',
            textSecondary: '#94A3B8',
            primary: '#6366F1',
            border: '#1E293B',
            card: '#111827',
            shadow: '#000000',
            cardGradientStart: '#4F46E5',
            cardGradientEnd: '#7C3AED',
            cardIconBg: 'rgba(99, 102, 241, 0.18)',
        }
        : {
            // Light Mode Colors - Modern crisp clinical palette
            background: '#F8FAFC',
            surface: '#FFFFFF',
            text: '#0F172A',
            textSecondary: '#64748B',
            primary: '#4F46E5',
            border: '#E2E8F0',
            card: '#FFFFFF',
            shadow: '#0F172A',
            cardGradientStart: '#4F46E5',
            cardGradientEnd: '#6366F1',
            cardIconBg: 'rgba(79, 70, 229, 0.08)',
        };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};
