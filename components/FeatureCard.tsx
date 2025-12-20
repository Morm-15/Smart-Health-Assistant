import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

interface FeatureCardProps {
    icon: string;
    title: string;
    color?: string;
    onPress?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, color, onPress }) => {
    const { colors, isDarkMode } = useTheme();

    // ألوان متدرجة وجذابة للكروت في الوضع الداكن
    const cardColors = isDarkMode ? {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        solid: '#2D3748',
        iconColor: '#667eea',
        textColor: '#E2E8F0',
    } : {
        background: colors.surface,
        solid: '#FFFFFF',
        iconColor: color || '#009688',
        textColor: '#009688',
    };

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: isDarkMode ? cardColors.solid : cardColors.background,
                    borderColor: isDarkMode ? '#4A5568' : colors.border,
                    borderWidth: isDarkMode ? 1 : 0,
                }
            ]}
            onPress={onPress}
        >
            <View style={[
                styles.iconContainer,
                { backgroundColor: isDarkMode ? 'rgba(102, 126, 234, 0.2)' : 'rgba(0, 150, 136, 0.1)' }
            ]}>
                <Ionicons
                    name={icon}
                    size={45}
                    color={isDarkMode ? '#667eea' : (color || '#009688')}
                />
            </View>
            <Text style={[
                styles.cardText,
                { color: isDarkMode ? cardColors.textColor : cardColors.textColor }
            ]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '48%',
        borderRadius: 20,
        paddingVertical: 30,
        paddingHorizontal: 15,
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 6,
        minHeight: 160,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    cardText: {
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '600',
        lineHeight: 20,
    },
});

export default FeatureCard;
