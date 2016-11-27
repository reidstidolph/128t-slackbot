var crypto = require('crypto');

function checkAlarm(hash) {
    if (sentAlarms[hash]) {
        console.log("alarm already sent...don't send again");
    } else {
        console.log("alarm not sent...sending it");
    }
}

var sentAlarms = { '0ca65559dfaa43f5e21cc758441d0b99': 
   { category: 'None',
     message: 'string',
     node: 'string',
     severity: 'INFO',
     source: 'string',
     time: '2016-11-21T22:32:00.031Z' } };

var newSentAlarms = {};

var alarm =  {
    "category": "None",
    "message": "string",
    "node": "string",
    "severity": "INFO",
    "source": "string",
    "time": "2016-11-21T22:32:00.031Z"
};
var alarmHash = crypto.createHash('md5').update(JSON.stringify(alarm)).digest('hex');
checkAlarm(alarmHash);

var newAlarm =  {
    "category": "None",
    "message": "differentString",
    "node": "string",
    "severity": "INFO",
    "source": "string",
    "time": "2016-11-21T22:32:00.031Z"
};
var newAlarmHash = crypto.createHash('md5').update(JSON.stringify(newAlarm)).digest('hex');
checkAlarm(newAlarmHash);

var anotherNewAlarm =  {
    "category": "None",
    "message": "string",
    "node": "string",
    "severity": "INFO",
    "source": "string",
    "time": "2016-11-21T21:32:00.031Z"
};
var anotherNewAlarmHash = crypto.createHash('md5').update(JSON.stringify(anotherNewAlarm)).digest('hex');
checkAlarm(anotherNewAlarmHash);

console.log(sentAlarms);

newSentAlarms[alarmHash] = alarm;
newSentAlarms[newAlarmHash] = alarm;
newSentAlarms[anotherNewAlarmHash] = alarm;
sentAlarms = newSentAlarms;
newSentAlarms = {};
console.log(sentAlarms);
