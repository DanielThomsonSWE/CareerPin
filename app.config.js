const androidGoogleMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
const iosGoogleMapsApiKey = process.env.GOOGLE_MAPS_IOS_API_KEY;

module.exports = ({ config }) => {
  const mapKeys = {
    ...(androidGoogleMapsApiKey ? { androidGoogleMapsApiKey } : {}),
    ...(iosGoogleMapsApiKey ? { iosGoogleMapsApiKey } : {}),
  };

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ...(Object.keys(mapKeys).length > 0
        ? [['react-native-maps', mapKeys]]
        : []),
    ],
  };
};
