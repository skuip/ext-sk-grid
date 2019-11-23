/* vim:set textwidth=80: */
'use strict';

/**
 * Returns the default settings.
 */
function defaults () {
	return {
		breakpoint: [
			{ width:    0, columns:  6, gutter: 16, margin: 16, name: `mobile` },
			{ width:  576, columns: 12, gutter: 16, margin: 16, name: `portrait` },
			{ width:  768, columns: 24, gutter: 16, margin: 24, name: `landscape` },
			{ width:  992, columns: 24, gutter: 16, margin: 32, name: `desktop` },
			{ width: 1264, columns: 24, gutter: 16, margin: 32, name: `large` }
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
					sendResponse(data);
				});
			});
			break;

		case `maxWidth`:
			chrome.storage.local.get(null, function(options) {
				if (options.maxWidth) {
					for (var i = 0; i < options.maxWidth.length; i++) {
						options.maxWidth[i].active = i === r.index;
					}
					chrome.storage.local.set(options);
				}
			});
			break;
		case `finished`:
			chrome.runtime.onMessage.removeListener(handleOnMessage);
			chrome.tabs.onZoomChange.removeListener(handleOnZoomChange);
			break;
	}

	return true;
}

/**
 * Only inject content script and stylesheet when activated.
 */
chrome.browserAction.onClicked.addListener(function (tab) {
	var data = { action: `knock-knock` };

	/**
	 * Message the content script the zoom level has changed,
	 * so it can update the state
	 */
	chrome.tabs.onZoomChange.addListener(handleOnZoomChange);
	chrome.runtime.onMessage.addListener(handleOnMessage);

	chrome.tabs.getZoom(tab.id, function (zoomFactor) {
		data.zoomFactor = zoomFactor;

		// Send message to tab. This will fail the first time, since the content
		// script and stylesheet aren't injected yet.
		chrome.tabs.sendMessage(tab.id, data, function () {
			if (!chrome.runtime.lastError) return;
			chrome.tabs.insertCSS(tab.id, {file: `content_style.css`}, function () {
				chrome.tabs.executeScript(tab.id, {file: `content_script.js`});
			});
		});
	});
});

