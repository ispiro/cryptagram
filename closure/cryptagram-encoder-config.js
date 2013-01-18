{
  "id": "cryptagram",
  "inputs": [ "src/closure/renaming_map.js",
              "src/cryptagram/DragAndDropHandler.js",
              "src/cryptagram/encoder.js",
              "src/cryptagram/experiment.js",
              "src/cryptagram/requality.js",
              "src/cryptagram/resizing.js",
              "src/cryptagram/resizevalidator.js",
              "src/thirdparty/sjcl.js",
              "src/thirdparty/jszip.js",
              "src/thirdparty/downloadify.js",
              "src/thirdparty/swfobject.js",
              "soy/demo.soy",
              "soy/experiment.soy"],
  "paths": ["src"],
  "externs": ["externs/sjcl.js",
              "externs/downloadify.js",
              "externs/swfobject.js",
              "externs/chrome_extensions.js"],
  "mode": "RAW",                // RAW, WHITESPACE, SIMPLE, ADVANCED.
  "jsdoc-html-output-path": "docs"
}
