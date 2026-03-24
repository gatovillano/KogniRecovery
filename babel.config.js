module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@navigation': './src/navigation',
            '@store': './src/store',
            '@utils': './src/utils',
            '@types': './src/types',
            '@assets': './src/assets',
            '@theme': './src/theme',
            '@hooks': './src/hooks',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};