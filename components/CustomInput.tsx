import React, { forwardRef } from 'react';
import { TextInput, View, StyleSheet, TextInputProps } from 'react-native';

interface CustomInputProps extends TextInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    secureTextEntry?: boolean;
}

const CustomInput = forwardRef<TextInput, CustomInputProps>(
    ({ value, onChangeText, placeholder, secureTextEntry = false, ...rest }, ref) => {
        return (
            <View style={styles.container}>
                <TextInput
                    ref={ref}
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    secureTextEntry={secureTextEntry}
                    {...rest} // <-- هذا يسمح بتمرير returnKeyType, onSubmitEditing وغيرها
                />
            </View>
        );
    }
);

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        width: '100%',
    },
});

export default CustomInput;
