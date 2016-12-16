#!/usr/bin/env node

try {
	var colors = require('colors'),
		cproc = require('child_process').spawn,
		argv = require('minimist')(process.argv.slice(2)),
		fs = require('fs'),
		path = require('path');
} catch (e) {
	if (e.code === 'MODULE_NOT_FOUND') {
		process.stdout.write('128T-Slackbot could not be started because it\'s dependencies have not been installed.\n');
		process.stdout.write('Please ensure that you have executed "npm install --production" prior to running 128T-Slackbot.\n\n');
		process.stdout.write('For more information, please see: https://docs.128t-slackbot.org/en/latest/installing/os.html\n\n');
		process.stdout.write('Could not start: ' + e.code + '\n');

		process.exit(1);
	}
}

var getRunningPid = function (callback) {
		fs.readFile(__dirname + '/cache/.pidfile', {
			encoding: 'utf-8'
		}, function (err, pid) {
			if (err) {
				return callback(err);
			}

			try {
				process.kill(parseInt(pid, 10), 0);
				callback(null, parseInt(pid, 10));
			} catch(e) {
				callback(e);
			}
		});
	};

switch(process.argv[2]) {
	case 'status':
		getRunningPid(function (err, pid) {
			if (!err) {
				process.stdout.write('\n128T-Slackbot Running '.bold + '(pid '.cyan + pid.toString().cyan + ')\n'.cyan);
				process.stdout.write('\t"' + './128t-slackbot stop'.yellow + '" to stop the 128T-Slackbot server\n');
				process.stdout.write('\t"' + './128t-slackbot log'.yellow + '" to view server output\n');
				process.stdout.write('\t"' + './128t-slackbot restart'.yellow + '" to restart 128T-Slackbot\n\n');
			} else {
				process.stdout.write('\n128T-Slackbot is not running\n'.bold);
				process.stdout.write('\t"' + './128t-slackbot start'.yellow + '" to launch the 128T-Slackbot server\n\n');
			}
		});
		break;

	case 'start':
		process.stdout.write('\nStarting 128T-Slackbot\n'.bold);
		process.stdout.write('  "' + './128t-slackbot stop'.yellow + '" to stop the 128T-Slackbot server\n');
		process.stdout.write('  "' + './128t-slackbot log'.yellow + '" to view server output\n');
		process.stdout.write('  "' + './128t-slackbot restart'.yellow + '" to restart 128T-Slackbot\n\n');

		// Spawn a new 128T-Slackbot process
		var slackbotProc = cproc(__dirname + '/loader.js', {
			env: process.env,
			detached : true,
			stdio : "ignore"
		});

		slackbotProc.unref();
		break;

	case 'stop':
		getRunningPid(function (err, pid) {
			if (!err) {
				process.kill(pid, 'SIGTERM');
				process.stdout.write('Stopping 128T-Slackbot. Goodbye!\n');
			} else {
				process.stdout.write('128T-Slackbot is already stopped.\n');
			}
		});
		break;

	case 'restart':
		getRunningPid(function (err, pid) {
			if (!err) {
				process.kill(pid, 'SIGHUP');
				process.stdout.write('\nRestarting 128T-Slackbot\n'.bold);
			} else {
				process.stdout.write('128T-Slackbot could not be restarted, as a running instance could not be found.\n');
			}
		});
		break;

	default:
		process.stdout.write('\nWelcome to 128T-Slackbot!\n\n'.bold);
		process.stdout.write('Usage: ./128t-slackbot {start|stop|restart|status}\n\n');
		process.stdout.write('\t' + 'start'.yellow + '\t\tStart the 128T-Slackbot\n');
		process.stdout.write('\t' + 'stop'.yellow + '\t\tStops the 128T-Slackbot\n');
		process.stdout.write('\t' + 'restart'.yellow + '\t\tRestarts 128T-Slackbot\n');
		process.stdout.write('\t' + 'status'.yellow + '\t\tView status of 128T-Slackbot\n');
		process.stdout.write('\n');
		break;
}