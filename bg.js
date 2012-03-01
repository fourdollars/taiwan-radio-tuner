var isPlaying = false;

function play(url) {
    var player = $('#player');
    player.empty().append(
	    '<embed autostart="1" src="' + url + '"'
	    + 'type="application/x-mplayer2"></embed>');
    isPlaying = true;
}

function stop() {
    $('#player').empty();
    isPlaying = false;
}
