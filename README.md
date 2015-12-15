# gltf-walker

This is a convenience library to support processing of [Khronos glTF](https://github.com/KhronosGroup/glTF) files. 
It is inspired by Fabrice Robinet's [glTF-parser.js](https://github.com/KhronosGroup/glTF/blob/master/loaders/glTF-parser.js) but available as [NPM package](https://www.npmjs.com/package/gltf-walker) (and maybe a little bit cleaner).

## Installation

    $ npm install gltf-walker


## Functionality
* Callbacks for all components in order of dependencies textures
* Resolves named references in JSON to real object references in JavaScript
    * Warning: Currently only for buffers, bufferViews, materials, accessors, meshes, nodes, scenes, and textures
* Creates [ArrayBuffer](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer) objects from [data URLs](https://en.wikipedia.org/wiki/Data_URI_scheme)


## Usage

```js
var walker = require("gltf-walker");
var json = JSON.parse(/* glTF file here */);

// Callbacks for all components, called in order of dependencies
walker(json, {
  buffers: function () {
  
  },
  materials: function () {
  
  },
  images: function () {
  
  }
  ...
});  
  

```

## TODO
  
  * Tests and automated builds
  * Resolve relative URIs (optional)
  * Fetch external resources (optional)

## License

  MIT License (MIT)
