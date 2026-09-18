import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BackButton from './BackButton';
import { useTheme } from '../contexts/ThemeContext';

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    rightElement?: React.ReactNode;
    onBackPress?: () => void;
    showBack?: boolean;
}

export default function ScreenHeader({
    title,
    subtitle,
    rightElement,
    onBackPress,
    showBack = true,
}: ScreenHeaderProps) {
    const { colors } = useTheme();

    return (
        <View style={[styles.headerContainer, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
            <View style={styles.sideCol}>
                {showBack ? <BackButton onPress={onBackPress} /> : <View style={styles.placeholder} />}
            </View>

            <View style={styles.centerCol}>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                    {title}
                </Text>
                {subtitle ? (
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>

            <View style={[styles.sideCol, { alignItems: 'flex-end' }]}>
                {rightElement || <View style={styles.placeholder} />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    sideCol: {
        width: 42,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    centerCol: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    placeholder: {
        width: 40,
        height: 40,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
        textAlign: 'center',
    },
});
