const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/js/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash:8].js',
    clean: true,
  },
  module: {
    rules: [
      { test: /\.css$/i, use: ['style-loader', 'css-loader'] },
    ],
  },
  resolve: {
    // `ice` carga fs y net solo en Node (protegido por typeof process); en el navegador no se usan
    fallback: { fs: false, net: false },
  },
  // Aviso conocido del código generado por slice2js (no se edita): usa require de forma dinámica
  ignoreWarnings: [
    { module: /generated[\\/]BookingService\.js/, message: /Critical dependency/ },
  ],
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' }),
  ],
  devServer: {
    port: 3000,
  },
};
