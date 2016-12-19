/*jshint node: true */
"use strict";

//
// This module handles logging of stdout and stderr messages.
//

var fs = require("fs"); //Load the filesystem module


// returns the size in bytes, of a given file
// by acessing it in the filesystem
//
function getFilesizeInBytes(filename) {
	var stats = fs.statSync(filename);
	return stats["size"];
}