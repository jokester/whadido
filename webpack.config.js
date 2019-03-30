const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  mode: 'production',
  entry: './src/webui/dev.tsx',
  output: {
    path: path.join(__dirname, 'webui-dev'),
    filename: 'js/[name].[chunkhash:8].js',
    // filename: 'js/[name].js',
  },
  devtool: 'source-map',
  target: 'web',
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    lodash: '_',
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.jsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: false,
            compilerOptions: {
              // module: 'es6',
            },
          },
        },
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/webui/index.template.html',
    }),
    // new BundleAnalyzerPlugin(),
  ],
};
