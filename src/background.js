/* vim:set textwidth=80: */
'use strict';

chrome.browserAction.onClicked.addListener(function (tab) {
	var data = { action: `knock-knock` };

	chrome.tabs.getZoom(tab.id, function (zoomFactor) {
		data.zoomFactor = zoomFactor;

		chrome.tabs.sendMessage(tab.id, data, function () {
			if (!chrome.runtime.lastError) return;
			chrome.tabs.insertCSS(tab.id, {file: `content_style.css`}, function () {
				chrome.tabs.executeScript(tab.id, {file: `content_script.js`});
			});
		});
	});
});

chrome.tabs.onZoomChange.addListener(function (options) {
	chrome.tabs.sendMessage(options.tabId, {
		action: `zoomChange`,
		zoomFactor: options.newZoomFactor
	});
});

chrome.runtime.onMessage.addListener(function (r, sender, sendResponse) {
	switch (r.action) {
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
	}

	return true;
});

function defaults () {
	return {
		breakpoint: [
			{ width:    0, columns: 12, gutter: 16, margin: 16, name: `mobile` },
			{ width:  600, columns: 12, gutter: 16, margin: 24, name: `tablet-portrait` },
			{ width:  720, columns: 12, gutter: 16, margin: 24, name: `tablet-landscape` },
			{ width: 1120, columns: 12, gutter: 16, margin: 32, name: `laptop` },
			{ width: 1200, columns: 12, gutter: 16, margin: 32, name: `desktop` },
			{ width: 1248, columns: 12, gutter: 16, margin: 32, name: `desktop-large` },
			{ width: 2000, columns: 12, gutter: 16, margin: 32, name: `desktop-extra-large` }
		],
		maxWidth: [
			{ width: 1272, active: true },
			{ width: 1440, active: false }
		]
	};
}

function reset (callback) {
	var options = defaults();
	chrome.storage.local.set(options, function () {
		callback(options);
	});
}
