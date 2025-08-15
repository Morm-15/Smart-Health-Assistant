import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface HeaderProps {
    userName: string;
    onProfilePress?: () => void;
    onSettingsPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, onProfilePress, onSettingsPress }) => {
    return (
        <View style={styles.header}>
            <Image source={{ uri: 'https://yourdomain.com/your-logo.png' }} style={styles.logo} />
            <Text style={styles.welcomeText}>مرحبًا، {userName}!</Text>
            <View style={styles.headerIcons}>
                <TouchableOpacity style={styles.iconButton} onPress={onProfilePress}>
                    <Ionicons name="person-circle-outline" size={30} color="#007acc" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={onSettingsPress}>
                    <Ionicons name="settings-outline" size={28} color="#007acc" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: '#ffffff',
        padding: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 3,
    },
    logo: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
        marginRight: 10,
    },
    welcomeText: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: '#007acc',
    },
    headerIcons: {
        flexDirection: 'row',
    },
    iconButton: {
        marginLeft: 10,
    },
});

export default Header;
