;(function($) {

var cat = [];
var userAgent = navigator.userAgent.toLowerCase();

$.extend({
    getURLVars: function(){
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    },
    getURLVar: function(name){
        return $.getURLVars()[name];
    },
    stripURLVar: function(){
        var url = window.location.href.substr(0, window.location.href.indexOf('?'));
        window.location.replace(url);
    }
});

var save = function(category, channel) {
    localStorage['category'] = category;
    localStorage['channel'] = channel;
}

var load_category = function() {
    var category;

    category = localStorage['category'];

    if (category === undefined || category === null) {
        category = 0;
    }

    $('#category').val(category);

    return category;
}

var load_channel = function() {
    var channel;

    channel = localStorage['channel'];

    if (channel === undefined || channel === null) {
        channel = 0;
    }

    $('#channel').val(channel);

    return channel;
}

var play = function() {
    var category = $('#category').val();
    var channel = $('#channel').val();
    var url = cat[category].channel[channel].url;
    var title = '<div><a href="?category=' + category + '&channel=' + channel + '"></div>' +
        cat[category].channel[channel].title + '</a>';
    chrome.extension.getBackgroundPage().play(url);
    $('#control').val('■');
    save(category, channel);
}

var stop = function() {
    chrome.extension.getBackgroundPage().stop();
    $('#control').val('▶');
}

var insert = function(selector, item, i) {
    var select = $(selector);
    select.append(new Option(item.title, i));
}

var attachTimer = function(selector) {
    var select = $(selector);
    var hour = $(selector + '_hour');
    var minute = $(selector + '_minute');

    chrome.extension.getBackgroundPage().check_alarm(selector, function (on_off, a_hour, a_minute) {
	select[0].checked = on_off;
	hour.val(a_hour);
	minute.val(a_minute);
    });

    var callback = function(event) {
	var category = $('#category').val();
	var channel = $('#channel').val();
	var url = cat[category].channel[channel].url;
	chrome.extension.getBackgroundPage().set_alarm(url, selector, select[0].checked, hour.val(), minute.val());
    }
    select.bind('click', callback);
    hour.bind('change', callback);
    minute.bind('change', callback);
}

var addOption = function(selector) {
    addOptionHours(selector + '_hour');
    addOptionMinutes(selector + '_minute', selector + '_hour');
}

var addOptionHours = function(item) {
    var hour = new Date().getHours();
    var select = $(item);
    for (var i = 0; i < 24; i++) {
	select.append(new Option(i, i));
    }
    $(item).val(hour);
}

var addOptionMinutes = function(item, hour) {
    var step = 5;
    var minute = Math.ceil(new Date().getMinutes() / step) * step;
    var select = $(item);
    for (var i = 0; i < 60; i += step) {
	select.append(new Option(i, i));
    }
    if (minute == 60) {
        var num = new Number($(hour).val());
        $(item).val(0);
        if (num == 23) {
            $(hour).val(0);
        }
        else {
            $(hour).val(num + 1);
        }
    }
    else {
        $(item).val(minute);
    }
}

var sortChannel = function(A,B) {
    return A.title.localeCompare(B.title);
}

var handleStateChange = function(db, stat) {
    if (stat == 'success') {
	var all = db.category.length;
	db.category[all] = new Object();
	db.category[all].title = "所有電台";
	db.category[all].channel = new Array();
	for (var i = 0; i < all; i++) {
	    for (var j = 0; j < db.category[i].channel.length; j++) {
		db.category[all].channel[db.category[all].channel.length] = db.category[i].channel[j];
	    }
	}
	db.category[all].channel.sort(sortChannel);
	$.each(db.category, function(i, item) {
	    if (item) {
		cat[i] = item;
		insert('#category', item, i);
	    }
	});
	var category = load_category();
	$.each(db.category[category].channel, function(i, item) {
	    if (item) {
		insert('#channel', item, i);
	    }
	});
	load_channel();
	$('#category').bind('change', function() {
	    $('#channel').empty();
	    $.each(cat[this.value].channel, function(i, item) {
		if (item) {
		    insert('#channel', item, i);
		}
	    });
	    play();
	});
	$('#channel').bind('change', function() {
	    play();
	});
	$('#control').bind('click', function() {
	    if ($(this).val() == '▶') {
		play();
	    }
	    else {
		stop();
	    }
	});
	addOption('#start');
	addOption('#stop');
	attachTimer('#start');
	attachTimer('#stop');
	chrome.extension.getBackgroundPage().watchdog();
	$('#control').everyTime(1000, function () {
	    if (chrome.extension.getBackgroundPage().isPlaying) {
		$('#control').val('■');
	    } else {
		$('#control').val('▶');
	    }
	    $('#start')[0].checked = chrome.extension.getBackgroundPage().isAlarmStarted;
	    $('#stop')[0].checked = chrome.extension.getBackgroundPage().isAlarmStopped;
	});
    }
}

var xhr;

var handleStateChange2 = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
        var data = eval("(" + xhr.responseText + ")"); // This is dangerous, but we made the data so that is OK.
	if (chrome.extension.getBackgroundPage().isPlaying) {
	    $('#control').val('■');
	} else {
	    $('#control').val('▶');
	}
	$('#start')[0].checked = chrome.extension.getBackgroundPage().isAlarmStarted;
	$('#stop')[0].checked = chrome.extension.getBackgroundPage().isAlarmStopped;
        handleStateChange(data, "success");
    }
}

xhr = new XMLHttpRequest();
xhr.onreadystatechange = handleStateChange2;
xhr.open("GET", chrome.extension.getURL('taiwan.json'), true);
xhr.send();

})(jQuery);
