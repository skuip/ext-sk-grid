/* vim:set textwidth=80: */
'use strict';

/**
 * Returns the default settings.
 */
function defaults () {
	return {
		breakpoint: [
			{ width:    0, columns:  6, gutter: 16, margin: 16, name: `XS mobile` },
			{ width:  576, columns: 12, gutter: 16, margin: 24, name: `SM portrait` },
			{ width:  768, columns: 24, gutter: 16, margin: 24, name: `MD landscape` },
			{ width:  992, columns: 24, gutter: 16, margin: 32, name: `LG desktop` },
			{ width: 1264, columns: 24, gutter: 16, margin: 32, name: `XL large` }
		],
		maxWidth: [
			{ width: 1264, active: true },
			{ width: 1440, active: false }
		]
	};
}

/**
 * Reset the settings to the default
 */
function reset (callback) {
	var options = defaults();
	chrome.storage.local.set(options, function () {
		callback(options);
	});
}

function handleOnZoomChange(options) {
	chrome.tabs.sendMessage(options.tabId, {
		action: `zoomChange`,
		zoomFactor: options.newZoomFactor
	});
}

function handleOnMessage(r, sender, sendResponse) {
	switch (r.action) {
			/* Options page request a reset of the settings */
		case `reset`:
			reset(sendResponse);
			break;

		case `options`:

			chrome.storage.local.get(null, function(data) {
				if (!data.breakpoint || !data.maxWidth) {
					data = defaults();
				}
				chrome.tabs.getZoom(sender.tab.id, function (zoomFactor) {
					data.zoomFactor = zoomFactor;

					const url = chrome.runtime.getURL(`shadow-root.html`);
					fetch(url)
						.then(response => response.text())
						.then(shadowRoot => {
							sendResponse({ ...data, shadowRoot });
						});
				});
			});
			break;

		case `finished`:
			//chrome.runtime.onMessage.removeListener(handleOnMessage);
			chrome.tabs.onZoomChange.removeListener(handleOnZoomChange);
			break;
	}

	return true;
}

/**
 * Only inject content script and stylesheet when activated.
 */
chrome.browserAction.onClicked.addListener(function (tab) {

	/**
	 * Message the content script the zoom level has changed,
	 * so it can update the state
	 */
	chrome.tabs.onZoomChange.addListener(handleOnZoomChange);
	//chrome.runtime.onMessage.addListener(handleOnMessage);

	const message = { action: `knock-knock` };

	chrome.tabs.sendMessage(tab.id, message, function (response) {
		if (response === `OK`) return console.log(tab.id, `Message received`);
		// Message fails first time, since script isn`t yet injected.
		if (chrome.runtime.lastError) {
			chrome.tabs.executeScript(tab.id, {file: `content_script.js`}, function (response) {
				if (response[0] !== `OK`) {
					return console.warn(tab.id, `Unexpected script response`, response);
				}
				chrome.tabs.sendMessage(tab.id, message, function (response) {
					if (response !== `OK`) {
						console.warn(tab.id, `Unexpected message response`);
					}
				});
			});
		}
	});
});

chrome.runtime.onMessage.addListener(handleOnMessage);

`OK`;
