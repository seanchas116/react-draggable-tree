"use strict";

const path = require("path")
const webpack = require("webpack")

module.exports = {
  entry: {
    tree: path.resolve(__dirname, "tree.tsx"),
    list: path.resolve(__dirname, "list.tsx"),
  },
  output: {
    path: __dirname,
    filename: "bundle-[name].js"
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