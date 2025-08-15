import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

interface FooterProps {
    onHomePress?: () => void;
    onProfilePress?: () => void;
    onSettingsPress?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onHomePress, onProfilePress, onSettingsPress }) => {
    return (
        <View style={styles.footer}>
            <TouchableOpacity style={styles.footerItem} onPress={onHomePress}>
                <Ionicons name="home-outline" size={30} color="#007acc" />
                <Text style={styles.footerText}>الرئيسية</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.footerItem} onPress={onProfilePress}>
                <Ionicons name="person-outline" size={30} color="#007acc" />
                <Text style={styles.footerText}>الملف</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.footerItem} onPress={onSettingsPress}>
                <Ionicons name="settings-outline" size={30} color="#007acc" />
                <Text style={styles.footerText}>الإعدادات</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        paddingVertical: 15,
        width: width,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: -2 },
        shadowRadius: 6,
        elevation: 4,
    },
    footerItem: {
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#007acc',
        marginTop: 5,
        fontWeight: '500',
    },
});

export default Footer;
