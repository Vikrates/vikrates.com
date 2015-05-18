// base framework
var fs = require( 'fs' );
var postcss = require( 'postcss' );

// include plugins
var mixins = require( 'postcss-mixins' );
var nested = require( 'postcss-nested' );
var customSelectors = require( 'postcss-custom-selectors' );
var customProperties = require( 'postcss-custom-properties' );
var customMedia = require( 'postcss-custom-media' );
var customMediaMinMax = require( 'postcss-media-minmax' );
var autoprefixer = require( 'autoprefixer' );
var cssnext = require( 'cssnext' );
var colorFunction = require( 'postcss-color-function' );
var cssgrace = require( 'cssgrace' );
var mqPacker = require( 'css-mqpacker' );
var mergeRules = require( 'postcss-merge-rules' );

// css to be processed
var css = fs.readFileSync( 'compile-css/input.css', 'utf8' );

// process css using plugins (ORDER IS IMPORTANT)
var out = postcss()
    .use( mixins() )
    .use( nested() )
    .use( customSelectors() )
    .use( customProperties() )
    .use( customMedia() )
    .use( customMediaMinMax() )
    .use( autoprefixer() )
    .use( cssnext() )
    .use( colorFunction() )
    .use( cssgrace ) // This is correct
    .use( mqPacker() )
    .use( mergeRules() )
    .process( css )
    .css;

// output processed css
fs.writeFileSync( 'assets/css/style.css', out );