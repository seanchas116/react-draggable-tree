"use strict";

const path = require("path")
const webpack = require("webpack")

module.exports = {
  entry: path.resolve(__dirname, "example.tsx"),
  output: {
    path: __dirname,
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    loaders: [
      { test: /\.tsx?$/, use: "ts-loader", },
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
    ],
  },
  devServer: {
    contentBase: '.',
    port: 22000
  },
}