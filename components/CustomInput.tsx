import React, { forwardRef } from 'react';
import { TextInput, View, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface CustomInputProps extends TextInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    secureTextEntry?: boolean;
}

const CustomInput = forwardRef<TextInput, CustomInputProps>(
    ({ value, onChangeText, placeholder, secureTextEntry = false, style, ...rest }, ref) => {
        const { colors, isDarkMode } = useTheme();

        return (
            <View style={[styles.container, style as any]}>
                <TextInput
                    ref={ref}
                    style={[
                        styles.input,
                        {
                            backgroundColor: isDarkMode ? '#0B0F1A' : '#F8FAFF',
                            borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
                            color: isDarkMode ? '#F1F5F9' : '#1E293B',
                        }
                    ]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={isDarkMode ? '#475569' : '#94A3B8'}
                    secureTextEntry={secureTextEntry}
                    {...rest}
                />
            </View>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 0,
    },
    input: {
        height: 52,
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 16,
        fontSize: 15,
        width: '100%',
        fontWeight: '500',
    },
});

export default CustomInput;
