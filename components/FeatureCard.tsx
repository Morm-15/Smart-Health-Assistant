import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface FeatureCardProps {
    icon: string;
    title: string;
    description?: string;
    color?: string;
    gradientStart?: string;
    gradientEnd?: string;
    onPress?: () => void;
    delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color = '#6366F1', onPress, delay = 0 }) => {
    const { colors, isDarkMode } = useTheme();
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const pressScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 400,
                delay,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                delay,
                tension: 80,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(pressScale, { toValue: 0.94, useNativeDriver: true, tension: 200 }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();
    };

    // Light color for icon bg
    const iconBg = color + '20';

    return (
        <Animated.View style={{
            opacity: opacityAnim,
            transform: [{ scale: Animated.multiply(scaleAnim, pressScale) }],
            width: '48%',
            marginBottom: 16,
            height: 175,  // ارتفاع ثابت موحد لجميع البطاقات
        }}>
            <TouchableOpacity
                style={[
                    styles.card,
                    {
                        backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                        borderColor: isDarkMode ? '#334155' : '#F1F5F9',
                        shadowColor: color,
                    }
                ]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                {/* Top accent bar */}
                <View style={[styles.accentBar, { backgroundColor: color }]} />

                <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                    <Ionicons name={icon as any} size={30} color={color} />
                </View>

                <Text
                    style={[styles.cardText, { color: isDarkMode ? '#E2E8F0' : '#1E293B' }]}
                    numberOfLines={2}
                >
                    {title}
                </Text>

                {/* Arrow pushed to bottom */}
                <View style={{ flex: 1 }} />

                <View style={[styles.arrowCircle, { backgroundColor: iconBg }]}>
                    <Ionicons name="arrow-forward" size={14} color={color} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,           // يملأ الارتفاع الثابت المحدد في Animated.View
        borderRadius: 20,
        paddingBottom: 14,
        paddingHorizontal: 14,
        alignItems: 'flex-start',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 16,
        elevation: 6,
        borderWidth: 1,
        overflow: 'hidden',
    },
    accentBar: {
        height: 4,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        marginBottom: 14,
    },
    iconContainer: {
        width: 54,
        height: 54,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        marginTop: 20,   // مسافة بعد الشريط العلوي
    },
    cardText: {
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 19,
        marginBottom: 2,
    },
    arrowCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default FeatureCard;
