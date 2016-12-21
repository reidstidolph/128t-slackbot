/*jshint node: true */
"use strict";

//
// This exports a collection of file handling tools.
// Useful in doing file rotation.
//


var loglevel = "error";
var fs = require("fs"); //Load the filesystem module
var Logger =  require("./Logger.js"); // import logger module
var path = require("path"); // import path module
var logger = new Logger(path.basename(__filename), loglevel); // set up logger

// returns the size in bytes, of a given file
// by acessing it in the filesystem
//
function getFilesizeInBytes(filename) {
    var stats;
    try {
        stats = fs.statSync(filename);
        return stats.size;
    }
    catch (err){
        return 0;
    }
}

// copies the contents of one file to another
//
function copyFile(source, target, callback) {
    var cbCalled = false;

    var read = fs.createReadStream(source);
    // handle read error
    read.on("error", (err)=> {
        done(err);
    });

    var write = fs.createWriteStream(target);
    // handle write error
    write.on("error", (err)=> {
        done(err);
    });
    // handle done writing
    write.on("close", ()=> {
        done();
    });
    // copy from read to write
    read.pipe(write);

    function done(err) {

        if (!cbCalled) {
            callback(err);
            cbCalled = true;
        }
    }
}

// clears out file contents
// 
function clearFile(filename) {
    // using writeFileSync here, instead of asynch.
    // this halts execution of the app, but prevents errors
    // with the app writing to the same file at the same time.
    // If this creates performance issues down the road, will
    // have to come up with a better way.
    //

    /*
    fs.writeFile(filename, "", (error)=>{
        if (error) {
            callback(error);
        } else {
            callback();
        }
    });
    */
    try {
        fs.writeFile(filename, "");
    } catch (err) {
        logger.log("error", "Error clearing file during log rotation:", err);
    }
}

// watch a file for changes, and return file size on change
//
function watchFile(filename, callback) {
    fs.watchFile(filename, (newFstat) => {
        //logger.log("debug", `File changed. Size is now ${newFstat.size} bytes`);
        // fire callback, passing it the size value for an arg
        callback(newFstat.size);
    });
}

// rotate a file
//
function rotate(filename) {
    // copy file to new backup file
    copyFile(filename, filename + ".old", (err)=>{
        if (err) {
            logger.log("error", "error copying file:", err);
        } else {
            logger.log("debug", "copy complete");
            // file copy complete, clear out the file
            clearFile(filename, (err)=>{
                if (err) {
                    logger.log("error", "error clearing file:", err);
                } else {
                    logger.log("debug", "file clearing complete");
                }
            });
        }
    });
}

// functions to export
//
var logUtils = {
    "copyFile" : copyFile,
    "getFilesizeInBytes" : getFilesizeInBytes,
    "clearFile" : clearFile,
    "watchFile" : watchFile,
    "rotate" : rotate
};

module.exports = logUtils;