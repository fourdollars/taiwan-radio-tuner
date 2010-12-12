;(function($) {

var cat = [];
var userAgent = navigator.userAgent.toLowerCase();

$.browser = {
    version: (userAgent.match( /.+(?:rv|it|ra|ie|me)[\/: ]([\d.]+)/ ) || [])[1],
    chrome: /chrome/.test( userAgent ),
    safari: /webkit/.test( userAgent ) && !/chrome/.test( userAgent ),
    opera: /opera/.test( userAgent ),
    msie: /msie/.test( userAgent ) && !/opera/.test( userAgent ),
    mozilla: /mozilla/.test( userAgent ) && !/(compatible|webkit)/.test( userAgent )
};

$.os = {
    windows: /windows/.test( userAgent ),
    mac: /macintosh/.test( userAgent ),
    linux: /linux/.test( userAgent )
};

var save = function(category, channel) {
    if (window.localStorage === undefined) {
        $.cookie('category', category);
        $.cookie('channel', channel);
    } else {
        localStorage['category'] = category;
        localStorage['channel'] = channel;
    }
}

var load_category = function() {
    var category;
    if (window.localStorage === undefined) {
        category = $.cookie('category');
    } else {
        category = localStorage['category'];
    }
    if (category === undefined || category === null) {
        category = 0;
    }
    $('#category').val(category);
    return category;
}

var load_channel = function() {
    var channel;
    if (window.localStorage === undefined) {
        channel = $.cookie('channel');
    } else {
        channel = localStorage['channel'];
    }
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
    var title = cat[category].channel[channel].title;
    var player = $('#player');
    if ($.browser.safari && $.os.mac) {
        if (cat[category].channel[channel].id === undefined) {
            player.empty().append(
                '<object type="application/x-shockwave-flash" data="player_mp3_maxi.swf" width="60" height="20">'
                + '<param name="movie" value="player_mp3_maxi.swf">'
                + '<param name="FlashVars" value="mp3=' + url
                + '&amp;width=60&amp;autoplay=1&amp;showvolume=1&amp;showslider=0">'
                + '</object>');
        } else {
            player.empty().append(
                '<audio autoplay="autoplay" controls="controls" src="'
                + url + '">UserAgent: ' + userAgent + '</audio>');
        }
    } else {
        player.empty().append(
            '<embed autostart="1" src="' + url + '"'
            + 'type="application/x-mplayer2"></embed>'
            + '<div>' + title + '</div>');
    }
    $('#control').val('■');
    save(category, channel);
}

var stop = function() {
    $('#player').empty();
    $('#control').val('▶');
}

var insert = function(selector, item, i) {
    var select = $.browser.msie ? $(selector)[0] : $(selector);
    if ($.browser.msie) {
        select.add(new Option(item.title, i), i);
    } else {
        select.append(new Option(item.title, i));
    }
}

var setAlarm = function() {
    var alarm = $('#alarm');
    alarm.bind('click', function() {
        if (alarm[0].checked == true) {
            alarm.everyTime(1000 , function () {
                var hour = $('#hour').val();
                var minute = $('#minute').val();
                var now = new Date();
                var now_hour = now.getHours();
                var now_minute = now.getMinutes();
                if (hour == now_hour && minute == now_minute) {
                    play();
                    alarm[0].checked = false;
                    alarm.stopTime();
                }
            });
        } else {
            alarm.stopTime();
        }
    });
}

var addOptionHours = function() {
    var hour = new Date().getHours();
    var select = $.browser.msie ? $('#hour')[0] : $('#hour');
    for (var i = 0; i < 24; i++) {
        if ($.browser.msie) {
            select.add(new Option(i, i), i);
        } else {
            select.append(new Option(i, i));
        }
    }
    $('#hour').val(hour);
}

var addOptionMinutes = function() {
    var minute = Math.ceil(new Date().getMinutes() / 5) * 5;
    var select = $.browser.msie ? $('#minute')[0] : $('#minute');
    for (var i = 0; i < 60; i+=5) {
        if ($.browser.msie) {
            select.add(new Option(i, i), i);
        } else {
            select.append(new Option(i, i));
        }
    }
    if (minute == 60) {
        $('#minute').val(0);
    } else {
        $('#minute').val(minute);
    }
}

var handleStateChange = function(data, stat) {
    if (stat == 'success') {
        $.each(data.category, function(i, item) {
            if (item) {
                cat[i] = item;
                insert('#category', item, i);
            }
        });
        var category = load_category();
        $.each(data.category[category].channel, function(i, item) {
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
            } else {
                stop();
            }
        });
        addOptionHours();
        addOptionMinutes();
        setAlarm();
    }
}

var xhr;

var handleStateChange2 = function() {
    if (xhr.readyState == 4 && xhr.status == 0) {
        var data = eval("(" + xhr.responseText + ")"); // This is dangerous, but we made the data so that is OK.
        handleStateChange(data, "success");
    }
}

xhr = new XMLHttpRequest();
xhr.onreadystatechange = handleStateChange2;
xhr.open("GET", chrome.extension.getURL('taiwan.json'), true);
xhr.send();

})(jQuery);
