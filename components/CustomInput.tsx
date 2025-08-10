// components/CustomInput.tsx
import React from 'react';
import {TextInput, StyleSheet, Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

interface CustomInputProps {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: any;
}

const CustomInput: React.FC<CustomInputProps> =
    ({
         placeholder,
         value,
         onChangeText,
         secureTextEntry = false,
         keyboardType = 'default',}
    ) => {
    return (
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            textAlign="right"
        />
    );
};

const styles = StyleSheet.create({
    input: {
        width: '100%',
        height: width * 0.13,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: width * 0.04,
        marginBottom: width * 0.05,
    },
});

export default CustomInput;
