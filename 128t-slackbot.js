#!/usr/bin/env node

//
// Controller of the 128T slackbot.
//

const pidfile = "/cache/.pidfile";
var argv;

try {
	var childProcess = require('child_process').spawn,
		fs = require('fs'),
		path = require('path');
} catch (e) {
    console.log(e);
	process.stdout.write('Could not start: ' + e.code + '\n');
	process.exit(1);
}

if (process.argv[2]) ()=>{
  argv = process.argv[2];
}

var getRunningPid = function (callback) {
	fs.readFile(__dirname + pidfile, {
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
				process.stdout.write('\n128T-Slackbot Running (pid ' + pid.toString() + ')\n');
				process.stdout.write('   "./128t-slackbot stop"     to stop the 128T-Slackbot\n');
				process.stdout.write('   "./128t-slackbot restart"  to restart 128T-Slackbot\n\n');
			} else {
				process.stdout.write('\n128T-Slackbot is not running\n');
				process.stdout.write('   "./128t-slackbot start" to launch the 128T-Slackbot\n\n');
			}
		});
		break;

	case 'start':
        getRunningPid(function (err, pid) {
            if (!err) {
                process.stdout.write('\n128T-Slackbot is already started.\n');
                process.stdout.write('   "./128t-slackbot stop"     to stop the 128T-Slackbot\n');
                process.stdout.write('   "./128t-slackbot restart"  to restart 128T-Slackbot\n\n');
            } else {
                process.stdout.write('\nStarting 128T-Slackbot\n');
                process.stdout.write('   "./128t-slackbot stop"     to stop the 128T-Slackbot\n');
                process.stdout.write('   "./128t-slackbot restart"  to restart 128T-Slackbot\n\n');

                // Spawn a new 128T-Slackbot process
                var slackbotProc = childProcess(__dirname + '/main.js', {
                    env: process.env,
                    detached : true,
                    stdio : "ignore"
                });

                slackbotProc.unref();
            }
        });
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
				process.stdout.write('\nRestarting 128T-Slackbot\n');
			} else {
				process.stdout.write('128T-Slackbot could not be restarted, as a running instance could not be found.\n');
			}
		});
		break;

	default:
		process.stdout.write('\nWelcome to 128T-Slackbot!\n\n');
		process.stdout.write('Usage: ./128t-slackbot {start|stop|restart|status}\n\n');
		process.stdout.write('\t' + 'start' + '\t\tStart the 128T-Slackbot\n');
		process.stdout.write('\t' + 'stop' + '\t\tStops the 128T-Slackbot\n');
		process.stdout.write('\t' + 'restart' + '\t\tRestarts 128T-Slackbot\n');
		process.stdout.write('\t' + 'status' + '\t\tView status of 128T-Slackbot\n');
		process.stdout.write('\n');
		break;
}