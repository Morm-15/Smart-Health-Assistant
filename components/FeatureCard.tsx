import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

interface FeatureCardProps {
    icon: string;
    title: string;
    description?: string;
    color?: string;
    onPress?: () => void;
    delay?: number;
    badgeText?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
    icon,
    title,
    description,
    color = '#4F46E5',
    onPress,
    delay = 0,
    badgeText,
}) => {
    const { colors, isDarkMode } = useTheme();
    const { i18n } = useTranslation();
    const scaleAnim = useRef(new Animated.Value(0.92)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const pressScale = useRef(new Animated.Value(1)).current;

    const isRtl = I18nManager.isRTL || i18n.language === 'ar';

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 350,
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
        Animated.spring(pressScale, { toValue: 0.96, useNativeDriver: true, tension: 250, friction: 12 }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 250, friction: 12 }).start();
    };

    return (
        <Animated.View
            style={{
                opacity: opacityAnim,
                transform: [{ scale: Animated.multiply(scaleAnim, pressScale) }],
                width: '48%',
                marginBottom: 14,
                height: 168,
            }}
        >
            <TouchableOpacity
                style={[
                    styles.card,
                    {
                        backgroundColor: colors.surface,
                        borderColor: isDarkMode ? '#1E293B' : '#EDF2F7',
                    },
                ]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                {/* Subtle soft gradient glow top edge */}
                <View style={[styles.topGlow, { backgroundColor: color + '15' }]} />

                {/* Header row: Icon & Status / Arrow */}
                <View style={styles.cardHeaderRow}>
                    <View style={[styles.iconBox, { backgroundColor: color + '14', borderColor: color + '28' }]}>
                        <Ionicons name={icon as any} size={24} color={color} />
                    </View>

                    <View style={[styles.arrowPill, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                        <Ionicons
                            name={isRtl ? 'chevron-back' : 'chevron-forward'}
                            size={14}
                            color={isDarkMode ? '#94A3B8' : '#64748B'}
                        />
                    </View>
                </View>

                {/* Title & Description */}
                <View style={styles.cardBody}>
                    {badgeText ? (
                        <View style={[styles.badge, { backgroundColor: color + '18' }]}>
                            <Text style={[styles.badgeText, { color }]}>{badgeText}</Text>
                        </View>
                    ) : null}

                    <Text
                        style={[styles.title, { color: colors.text }]}
                        numberOfLines={2}
                    >
                        {title}
                    </Text>

                    {description ? (
                        <Text
                            style={[styles.description, { color: colors.textSecondary }]}
                            numberOfLines={1}
                        >
                            {description}
                        </Text>
                    ) : null}
                </View>

                {/* Bottom decorative color line indicator */}
                <View style={[styles.bottomLine, { backgroundColor: color }]} />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        borderRadius: 20,
        padding: 14,
        justifyContent: 'space-between',
        borderWidth: 1,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    topGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    arrowPill: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardBody: {
        marginTop: 10,
        flex: 1,
        justifyContent: 'flex-end',
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginBottom: 4,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '700',
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 20,
        letterSpacing: -0.2,
    },
    description: {
        fontSize: 11,
        marginTop: 2,
    },
    bottomLine: {
        height: 3,
        width: 28,
        borderRadius: 2,
        marginTop: 8,
        opacity: 0.8,
    },
});

export default FeatureCard;
