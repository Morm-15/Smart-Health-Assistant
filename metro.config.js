const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// إضافة الامتدادات bin و json لقائمة الملفات التي يفهمها التطبيق
// هذا ضروري جداً لكي يتمكن TensorFlow من قراءة أوزان الموديل
config.resolver.assetExts.push('bin');
config.resolver.assetExts.push('json');

module.exports = config;