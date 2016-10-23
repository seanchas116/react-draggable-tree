"use strict";

const webpack = require("webpack")

module.exports = {
  entry: "./index.tsx",
  output: {
    filename: "./bundle.js"
  },
  resolve: {
    extensions: ["", ".ts", ".tsx", ".js"]
  },
  module: {
    loaders: [
      { test: /\.tsx?$/, loader: "ts-loader", },
      { test: /\.css$/, loader: "style-loader!css-loader" },
    ],
  },
  devServer: {
    contentBase: '.',
    port: 22000
  },
}