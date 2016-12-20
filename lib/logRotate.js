/*jshint node: true */
"use strict";

//
// This module handles simple log file rotation.
//

var fs = require("fs"); //Load the filesystem module


// returns the size in bytes, of a given file
// by acessing it in the filesystem
//
function getFilesizeInBytes(filename) {
	var stats = fs.statSync(filename);
	return stats.size;
}

// copies the contents of one file to another
//
function copyFile(source, target, callback) {
  var cbCalled = false;

  var read = fs.createReadStream(source);
  read.on("error", function(err) {
    done(err);
  });
  var write = fs.createWriteStream(target);
  write.on("error", function(err) {
    done(err);
  });
  write.on("close", function() {
    done();
  });
  read.pipe(write);

  function done(err) {
    if (!cbCalled) {
      callback(err);
      cbCalled = true;
    } else (callback());
  }
}

// clears out file contents
// 
function clearFile(filename, callback) {
	fs.writeFile(filename, "", (error)=>{
		if (error) {
			callback(error);
		} else {
			callback();
		}
	});
}

var logRotate = {
	"copyFile" : copyFile,
	"getFilesizeInBytes" : getFilesizeInBytes,
	"clearFile" : clearFile
};

module.exports = logRotate;