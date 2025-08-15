import React, { useState } from 'react';
import { TextInput, StyleSheet, Dimensions } from 'react-native';
import i18n from '../i18n';

const { width } = Dimensions.get('window');

interface CustomInputProps {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: any;
}

const CustomInput: React.FC<CustomInputProps> = ({
                                                     placeholder,
                                                     value,
                                                     onChangeText,
                                                     secureTextEntry = false,
                                                     keyboardType = 'default',
                                                 }) => {
    const [isFocused, setIsFocused] = useState(false);
    const isRTL = i18n.dir() === 'rtl';

    return (
        <TextInput
            style={[styles.input, isFocused && styles.inputFocused]}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            textAlign={isRTL ? 'right' : 'left'}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
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
    inputFocused: {
        borderColor: '#007AFF', // لون أزرق عند التركيز
        borderWidth: 2,
    },
});

export default CustomInput;
