var pmc = require('./lib/pmc'),
    path = require('path'),
    srcPath = path.resolve(__dirname, '../src/'),
    distPath = path.resolve(__dirname, '../dist/');

pmc.config({
        dist: distPath,
        src: srcPath,
        /*base:'P.core.Pano',*/
        output:'P'
});
// build with only one package.