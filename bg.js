var isPlaying = false;
var isAlarmStarted = false;
var isAlarmStopped = false;

var isDirty = false;
var isWatchDog = false;
var media_url = '';

function watchdog() {
    if (isWatchDog == false) {
	isWatchDog = true;
	$('#player').everyTime(1000, function () {
	    /* Player Watchdog */
	    if (isDirty) {
		isDirty = false;
		if (isPlaying) {
		    $('#player').empty().append(
			'<embed autostart="1" src="' + media_url + '"'
			+ 'type="application/x-mplayer2"></embed>');
		} else {
		    $('#player').empty();
		}
	    }
	    /* Alarm Watchdog */
	    if (isAlarmStarted || isAlarmStopped) {
		var now = new Date();
		var now_hour = now.getHours();
		var now_minute = now.getMinutes();

		if (isAlarmStarted) {
		    if (now_hour == localStorage['start_hour'] && now_minute == localStorage['start_minute']) {
			isAlarmStarted = false;
			if (isPlaying == false) {
			    isDirty = true;
			}
			isPlaying = true;
		    }
		}

		if (isAlarmStopped) {
		    if (now_hour == localStorage['stop_hour'] && now_minute == localStorage['stop_minute']) {
			isAlarmStopped = false;
			if (isPlaying) {
			    isDirty = true;
			}
			isPlaying = false;
		    }
		}
	    }
	});
    }
}

function play(url) {
    media_url = url;
    isPlaying = true;
    isDirty = true;
}

function stop() {
    isPlaying = false;
    isDirty = true;
}

function check_alarm(start_or_stop, fn) {
    if (start_or_stop == '#start') {
	var hour = localStorage['start_hour'];
	var minute = localStorage['start_minute'];

	if (hour === undefined) {
	    hour = 0;
	    localStorage['start_hour'] = 0;
	}

	if (minute === undefined) {
	    minute = 0;
	    localStorage['start_minute'] = 0;
	}

	return fn(isAlarmStarted, hour, minute);
    } else if (start_or_stop == '#stop') {
	var hour = localStorage['stop_hour'];
	var minute = localStorage['stop_minute'];

	if (hour === undefined) {
	    hour = 0;
	    localStorage['stop_hour'] = 0;
	}

	if (minute === undefined) {
	    minute = 0;
	    localStorage['stop_minute'] = 0;
	}
	return fn(isAlarmStopped, hour, minute);
    }
}

function set_alarm(alarm_url, start_or_stop, on_off, hour, minute) {
    media_url = alarm_url;
    if (start_or_stop == '#start') {
	isAlarmStarted = on_off;
	localStorage['start_hour'] = hour;
	localStorage['start_minute'] = minute;
    } else if (start_or_stop == '#stop') {
	isAlarmStopped = on_off;
	localStorage['stop_hour'] = hour;
	localStorage['stop_minute'] = minute;
    }
}
