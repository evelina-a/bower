var path = require('path');
var Q = require('q');
var fs = require('graceful-fs');


// This promise is resolved with [json]
// - json: The read json

function readLockFile(file, options) {

    options = options || {};


    // Read
    return Q.nfcall(readFile, file, options)
    .spread(function (json, jsonFile) {


        return [json];
    }, function (err) {
        // No json file was found
        if (err.code === 'ENOENT' ) {
            return [undefined, false, true];
        }

        err.details = err.message;

        if (err.file) {
            err.message = 'Failed to read ' + err.file;
            err.data = { filename: err.file };
        } else {
            err.message = 'Failed to read json from ' + file;
        }

        throw err;
    });
}

function readFile(file, options, callback) {

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    // Check if file is a directory
    fs.stat(file, function (err, stat) {
        if (err) {
            return callback(err);
        }

        // It's a directory, so we find the json inside it
        if (stat.isDirectory()) {
            return find(file, function (err, file) {
                if (err) {
                    return callback(err);
                }

                read(file, options, callback);
            });
        }

        // Otherwise read it
        fs.readFile(file, function (err, contents) {

            var json;

            if (err) {
                return callback(err);
            }

            try {
                json = JSON.parse(contents.toString());
            } catch (err) {
                err.file = path.resolve(file);
                err.code = 'EMALFORMED';
                return callback(err);
            }



            callback(null, json, file);
        });
    });
}

module.exports = readLockFile;
