const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// إضافة الامتداد bin لقائمة الملفات التي يفهمها التطبيق كأصول ثابتة
// هذا ضروري جداً لكي يتمكن TensorFlow من قراءة أوزان الموديل الثنائية (.bin)
config.resolver.assetExts.push('bin');

module.exports = config;