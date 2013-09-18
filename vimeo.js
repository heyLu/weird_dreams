var vimeo = function(iframe) {
	var apiCall = function(method, value, cb) {
		var msg = { method: method }
		if (value) {
			msg.value = value;
		}
		dispatchTo = cb;
		iframe.contentWindow.postMessage(JSON.stringify(msg), iframe.src);
	}

	var dispatchTo = null;
	window.addEventListener("message", function(ev) {
		var data = JSON.parse(ev.data);
		if (dispatchTo != null && iframe.id == data.player_id) {
			dispatchTo(data.value);
		}
	});

	return {
		play: function() { apiCall("play"); },
		pause: function() { apiCall("pause"); },
		playPause: function() {
			apiCall("paused", null, function(isPaused) {
				if (isPaused) {
					apiCall("play");
				} else {
					apiCall("pause");
				}
			});
		},
		seekTo: function(seconds) { apiCall("seekTo", seconds); }
	}
}
