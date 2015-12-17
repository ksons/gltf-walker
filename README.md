# gltf-walker [![Build Status](https://img.shields.io/travis/ksons/gltf-walker/master.svg)](https://travis-ci.org/ksons/gltf-walker)  [![Build Status](https://img.shields.io/npm/l/gltf-walker.svg)](http://opensource.org/licenses/MIT)

This is a convenience library to support processing of [Khronos glTF](https://github.com/KhronosGroup/glTF) files. 
It is inspired by Fabrice Robinet's [glTF-parser.js](https://github.com/KhronosGroup/glTF/blob/master/loaders/glTF-parser.js) but
provides some convenience functionality and is available as [NPM package](https://www.npmjs.com/package/gltf-walker).

## Installation

    $ npm install gltf-walker


## Functionality
* Callbacks for all components in order of dependencies textures
* Resolves named references in JSON to real object references in JavaScript
* Buffers: Creates [ArrayBuffer](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) objects from [data URLs](https://en.wikipedia.org/wiki/Data_URI_scheme)
* Shaders: Creates strings from [data URLs](https://en.wikipedia.org/wiki/Data_URI_scheme)
* Resolve relative URIs (optional)

## Usage

```js
var walker = require("gltf-walker");
var json = JSON.parse(/* glTF file here */);

// Callbacks for all components, called in order of dependencies
walker(json, {
  buffers: function (buffer, id) {
    console.log(buffer._buffer); // Only set if buffer is defined as data URL 
    console.log(buffer._uri); // Only set if buffer is not a data URL and baseURL is defined
  },
  materials: function (material, id) {
  
  },
  images: function (image, id) {
  
  },
  ...
  default: function (desc, id) {
    // Callback for all categories that do not have a dedicated callback
  }
}, { 
  // Optional user context object.
  // Available as 'this' in callbacks
  context: null,
  // The library will resolve relative
  // URLs, if this (optional) base URL is defined
  baseURL: null
});  
  

```

## TODO
  
  * Fetch external resources (optional)

## License

  MIT License (MIT)
