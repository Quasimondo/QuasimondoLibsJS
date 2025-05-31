QuasimondoLibsJS
================

QuasimondoLibsJS is a JavaScript library primarily focused on 2D geometry operations and algorithms. It is a migration of the original ActionScript QuasimondoLibs.

For some drawing functionalities and UI elements, Qlib can integrate with EaselJS, but EaselJS is not required for core geometric operations. Many intersection algorithms are based on work by Kevin Lindsey.

Detailed API documentation, generated from source code comments, is available to help you understand and use the library.

## Documentation

This project uses [JSDoc](https://jsdoc.app/) to generate API documentation from source code comments.

To build the documentation:
1. Ensure you have Node.js and npm installed.
2. Install development dependencies: `npm install`
3. Generate the documentation: `npm run docs`

The generated documentation will be available in the `docs` directory. Open `docs/index.html` (or `docs/app/1.0.0/index.html` depending on your JSDoc setup) in your browser to view it.

## Original Notes

Migrating the original QuasimondoLibs to Javascript. Mostly 2D Geometry.

For the drawing part and some of the UI elements Qlib uses EaselJS - for
pure geometric operation it is not required though.

A big part of the intersection algorithms and their helper methods (most of which I still have to port from my ActionScript library)
were originally taken from Kevin Lindsey: http://www.kevlindev.com/gui/math/intersection/index.htm
