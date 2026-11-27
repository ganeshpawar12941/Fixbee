const fs = require('fs');
const path = require('path');

const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const configuredGoogleServicesFile = process.env.GOOGLE_SERVICES_FILE?.trim();
const googleServicesFile = configuredGoogleServicesFile
  ? path.resolve(__dirname, configuredGoogleServicesFile)
  : path.join(__dirname, 'google-services.json');

if (!googleIosClientId) {
  throw new Error("Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID");
}

if (configuredGoogleServicesFile && !fs.existsSync(googleServicesFile)) {
  throw new Error(`GOOGLE_SERVICES_FILE does not exist: ${googleServicesFile}`);
}

const googleIosUrlScheme = `com.googleusercontent.apps.${googleIosClientId.replace(
  /\.apps\.googleusercontent\.com$/,
  ''
)}`;

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(fs.existsSync(googleServicesFile)
      ? { googleServicesFile }
      : {}),
  },
  extra: {
    ...config.extra,
    fixbeeAndroidFirebaseConfigured: fs.existsSync(googleServicesFile),
  },
  plugins: [
    ...(config.plugins || []).filter(
      (plugin) =>
        (Array.isArray(plugin) ? plugin[0] : plugin) !==
        '@react-native-google-signin/google-signin'
    ),
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: googleIosUrlScheme,
      },
    ],
  ],
});