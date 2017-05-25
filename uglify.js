#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var UglifyJS = require('uglify-js');
var CleanCSS = require('clean-css');
var ngAnnotate = require('ng-annotate');
var cssMinifier = new CleanCSS({
    noAdvanced: true,
    keepSpecialComments: 0
});

var rootDir = process.argv[2];
var platformPath = path.join(rootDir, 'platforms');
var platform = process.env.CORDOVA_PLATFORMS;
var cliCommand = process.env.CORDOVA_CMDLINE;

// hook configuration
var isRelease = (cliCommand.indexOf('--release') > -1);
var doUglify = (cliCommand.indexOf('--uglify') > -1);

var recursiveFolderSearch = true;

var foldersToProcess = [
    'dist_js',
    'dist_css'
];


if (!isRelease && !doUglify) {

console.log(' ---- ');
console.log(' content is not uglified, use either --release or --uglify commands to get it uglified');
console.log(' ---- ');

    return;
}

switch (platform) {
    case 'android':
        platformPath = path.join(platformPath, platform, 'assets', 'www');
        break;
    case 'ios':
        platformPath = path.join(platformPath, platform, 'www');
        break;
    default:
        console.log('this hook only supports android and ios currently');
        return;
}

foldersToProcess.forEach(function(folder) {
    processFiles(path.join(platformPath, folder));
});

function processFiles(dir) {
    fs.readdir(dir, function (err, list) {
        if (err) {
            console.log('processFiles err: ' + err);
            return;
        }
        list.forEach(function(file) {
            file = path.join(dir, file);
            fs.stat(file, function(err, stat) {
                if (recursiveFolderSearch && stat.isDirectory()) {
                    processFiles(file);
                } else{
                    compress(file);
                }
            });
        });
    });
}

function compress(file) {
    var ext = path.extname(file);
    var result;
    switch(ext) {
        case '.js':
            console.log('uglifying js file ' + file);
            var res = ngAnnotate(String(fs.readFileSync(file)), { add: true });
            result = UglifyJS.minify(res.src, {
                compress: {
                    drop_console: false,
                    keep_fnames: false,
                    keep_fargs: false
                },
                fromString: true
            });
            fs.writeFileSync(file, result.code, 'utf8');
            break;
        case '.css':
            console.log('minifying css file ' + file);
            var source = fs.readFileSync(file, 'utf8');
            result = cssMinifier.minify(source);
            fs.writeFileSync(file, result.styles, 'utf8');
            break;
        default:
            console.log('encountered a ' + ext + ' file, not compressing it');
            break;
    }
}
