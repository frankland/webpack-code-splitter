# Webpack code splitter plugin

## Install

`npm install --save webpack-code-splitter`


```js
import WebpackCodeSplitter from 'webpack-code-splitter';

let webpackCodeSplitterPlugin = new WebpackCodeSplitter([
  // every module from node_module or bower_components will be placed into js/vendor.js output build script
  {
    name: 'js/vendor',
    path: ['node_modules/', 'bower_components/'],
  },
  // for bootstrap module - will be separated build script
  {
    name: 'js/bootstrap',
    path: '\/bootstrap\\.js'
  },
  // all jade and html template will be placed into js/templates.js output build scirpt
  {
    name: 'js/templates',
    path: '.+\\.(jade|html)'
  }
]);

webpack.config.plugins.push(webpackCodeSplitterPlugin);
```
