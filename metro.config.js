const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'cjs' to source extensions so Metro can resolve Firebase CommonJS files
config.resolver.sourceExts.push('cjs');

// Disable unstable package exports so Metro uses the correct React Native bundles for Firebase
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
