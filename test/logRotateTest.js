var fs = require("fs"); //Load the filesystem module
var Logger =  require("../lib/Logger.js"); // import logger module
var path = require("path"); // import path module
var logger = new Logger(path.basename(__filename), "debug"); // set up logger

var logRotate = require("../lib/logRotate.js")

var fileData = "Test test data\n";
var fileName = __dirname + "/test.file";
var newFileName = __dirname + "/test2.file";

var logFile = "/home/rstidolph/apps/128t-slackbot/log/128t-slackbot.log";
var rotatedLogFile = "/home/rstidolph/apps/128t-slackbot/log/128t-slackbot.1.log";

// over-writes data already in the file
fs.writeFile(fileName, fileData, (e)=>{
    if(e) {
        logger.log("debug", `error writing to ${fileName}`, e);
    } else {
        logger.log("debug", `data recorded to ${fileName}`);
    }
});

logRotate.copyFile(fileName, newFileName, (err)=>{
	if (err) {
		logger.log("debug", "error copying file:", err);
	} else {
		logger.log("debug", "copy complete");
		logRotate.clearFile(fileName, (err)=>{
			if (err) {
				logger.log("debug", "error clearing file:", err);
			} else {
				logger.log("debug", "file clearing complete");
			}
		})
	}
})

var size = logRotate.getFilesizeInBytes(logFile);
var backupSize = logRotate.getFilesizeInBytes(rotatedLogFile);
logger.log("debug", `log file is ${size} bytes`);
logger.log("debug", `backup log file is ${backupSize} bytes`);

logRotate.copyFile(logFile, rotatedLogFile, (err)=>{
	if (err) {
		logger.log("debug", "error copying file:", err);
	} else {
		logger.log("debug", "copy complete");
		logRotate.clearFile(logFile, (err)=>{
			if (err) {
				logger.log("debug", "error clearing file:", err);
			} else {
				logger.log("debug", "file clearing complete");
				var newSize = logRotate.getFilesizeInBytes(logFile);
				var newBackupSize = logRotate.getFilesizeInBytes(rotatedLogFile);
				logger.log("debug", `log file is now ${newSize} bytes`);
				logger.log("debug", `backup log file is now ${newBackupSize} bytes`);
			}
		})
	}
})
