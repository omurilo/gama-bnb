const modoDev = process.env.NODE_ENV !== "production";
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MinifyPlugin = require("babel-minify-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");

const webpackConfig = {
  mode: modoDev ? "develpment" : "production",
  entry: "./src/principal.js",
  devServer: {
    contentBase: "./dist",
    port: 9000,
    open: true,
  },
  optimization: {
    minimizer: [new MinifyPlugin({})],
  },
  output: {
    filename: "assets/js/app.min.js",
    chunkFilename: "assets/js/[id].chunk.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "/",
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({ template: "./src/index.html", minify: !modoDev }),
    new CopyWebpackPlugin([
      { context: "src/", from: "**/*.html", to: "[path][name].[ext]" },
      { context: "src/", from: "**/*.json", to: "[path][name].[ext]" },
    ]),
    new MiniCssExtractPlugin({ filename: "assets/css/app.min.css" }),
  ],
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          modoDev
            ? {
                loader: "style-loader",
                options: {
                  attributes: { type: "text/css" },
                },
              }
            : MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader",
        ],
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              outputPath: "assets/imgs",
            },
          },
        ],
      },
      {
        test: /.(ttf|otf|eot|svg|woff(2)?)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              outputPath: "assets/fonts",
            },
          },
        ],
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader",
          },
        ],
      },
    ],
  },
};

modoDev &&
  webpackConfig.optimization.minimizer.push(new OptimizeCSSAssetsPlugin({}));

module.exports = webpackConfig;
