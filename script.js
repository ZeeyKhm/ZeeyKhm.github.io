if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker.register("/sw.js").catch(() => {
			// Service worker registration can fail on local file preview; ignore quietly.
		});
	});
}

