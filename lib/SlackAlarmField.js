// constructor function for creating alarm slack
// message attachment fields
function SlackAlarmField(title, value){
	this.short = true;
	this.title = title || "default title";
	this.value = value || "default alarm message";
}

module.exports = SlackAlarmField;