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
    }
    else {
        localStorage['category'] = category;
        localStorage['channel'] = channel;
    }
}

var autoplay = function(isAuto) {
    if (isAuto !== undefined) {
        if (window.localStorage === undefined) {
            if (isAuto) {
                $.cookie('autoplay', 1);
            }
            else {
                $.cookie('autoplay', null);
            }
        }
        else {
            if (isAuto) {
                localStorage['autoplay'] = 1;
            }
            else {
                localStorage.removeItem('autoplay');
            }
        }
    }
    else {
        if (window.localStorage === undefined) {
            return $.cookie('autoplay');
        } else {
            return localStorage['autoplay'];
        }
    }
}

var load_category = function() {
    var category;

    if (window.localStorage === undefined) {
        category = $.cookie('category');
    }
    else {
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
    }
    else {
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
    var select = $.browser.msie ? $(selector)[0] : $(selector);
    if ($.browser.msie) {
        select.add(new Option(item.title, i), i);
    }
    else {
        select.append(new Option(item.title, i));
    }
}

var attachTimer = function(selector, fn, state) {
    var select = $(selector);
    var hour = $(selector + '_hour');
    var minute = $(selector + '_minute');
    var callback = function(event) {
        if (select[0].checked == true) {
            select.stopTime();
            select.everyTime(1000 , function () {
                var now = new Date();
                var now_hour = now.getHours();
                var now_minute = now.getMinutes();
                if (hour.val() == now_hour && minute.val() == now_minute && $('#control').val() == state) {
                    select[0].checked = false;
                    select.stopTime();
                    fn();
                }
            });
        }
        else {
            select.stopTime();
        }
    }
    select[0].checked = false;
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
    var select = $.browser.msie ? $(item)[0] : $(item);
    for (var i = 0; i < 24; i++) {
        if ($.browser.msie) {
            select.add(new Option(i, i), i);
        }
        else {
            select.append(new Option(i, i));
        }
    }
    $(item).val(hour);
}

var addOptionMinutes = function(item, hour) {
    var step = 5;
    var minute = Math.ceil(new Date().getMinutes() / step) * step;
    var select = $.browser.msie ? $(item)[0] : $(item);
    for (var i = 0; i < 60; i += step) {
        if ($.browser.msie) {
            select.add(new Option(i, i), i);
        }
        else {
            select.append(new Option(i, i));
        }
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
        if ($.getURLVar('category') !== undefined && $.getURLVar('channel') !== undefined) {
            save($.getURLVar('category'), $.getURLVar('channel'));
            autoplay(true);
            $.stripURLVar();
        }
        else {
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
            addOption('#end');
            attachTimer('#start', play, '▶');
            attachTimer('#end', stop, '■');
            if (autoplay()) {
                play();
                autoplay(false);
            }
        }
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

        handleStateChange(data, "success");
    }
}

xhr = new XMLHttpRequest();
xhr.onreadystatechange = handleStateChange2;
xhr.open("GET", chrome.extension.getURL('taiwan.json'), true);
xhr.send();

})(jQuery);
