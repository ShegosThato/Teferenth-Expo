module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Important: The decorators plugin must come before class-properties.
      ['@babel/plugin-proposal-decorators', { 'legacy': true }]
    ]
  };
};