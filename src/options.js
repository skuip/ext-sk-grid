/* vim:set textwidth=80: */
'use strict';

var options = {};

/*
 * breakpoints
 */

function addBreakpoint (ev) {
	var row = ev.currentTarget.closest(`tr`);

	options.breakpoint.push({
		columns: parseInt(row.querySelector(`.columns`).value),
		gutter: parseInt(row.querySelector(`.gutter`).value),
		margin: parseInt(row.querySelector(`.margin`).value),
		name: row.querySelector(`.name`).value,
		width: parseInt(row.querySelector(`.width`).value)
	});

	options.breakpoint.sort(function (a, b) {
		return a.width - b.width;
	});

	chrome.storage.local.set(options, saved);
}

function delBreakpoint (ev) {
	var row = ev.target.closest(`tr`);
	var idx = row.getAttribute(`data-idx`);

	options.breakpoint.splice(idx, 1);

	chrome.storage.local.set(options, saved);
}

/*
 * Max width
 */

function addMaxWidth (ev) {
	var row = ev.currentTarget.closest(`tr`);

	options.maxWidth.push({
		width: parseInt(row.querySelector(`.width`).value),
		active: false
	});

	options.maxWidth.sort(function (a, b) {
		return a.width - b.width;
	});

	chrome.storage.local.set(options, saved);
}

function delMaxWidth (ev) {
	var row = ev.target.closest(`tr`);
	var idx = row.getAttribute(`data-idx`);

	options.maxWidth.splice(idx, 1);

	chrome.storage.local.set(options, saved);
}

function chgActive (ev) {
	var row = ev.target.closest(`tr`);
	var idx = parseInt(row.getAttribute(`data-idx`));

	for (var i = 0; i < options.maxWidth.length; i++) {
		options.maxWidth[i].active = i === idx;
	}

	chrome.storage.local.set(options, saved);
}

function reset () {
	chrome.runtime.sendMessage({ action: `reset` }, show);
}

function saved () {
	show(options);
}

function show (data) {
	var tmpl;

	options = data;

	[].forEach.call(document.querySelectorAll(`.row`), function (element) {
		element.parentNode.removeChild(element);
	});

	if (options.breakpoint && options.breakpoint.length) {
		tmpl = document.querySelector(`.breakpoint .tmpl`);
		options.breakpoint.forEach(function (item, idx) {
			var row = tmpl.cloneNode(true);

			row.classList.add(`row`);
			row.classList.remove(`tmpl`);
			row.setAttribute(`data-idx`, idx);

			row.querySelector(`.columns`).textContent = item.columns;
			row.querySelector(`.del`).addEventListener(`click`, delBreakpoint);
			row.querySelector(`.gutter`).textContent = item.gutter + `px`;
			row.querySelector(`.margin`).textContent = item.margin + `px`;
			row.querySelector(`.name`).textContent = item.name;
			row.querySelector(`.width`).textContent = item.width + `px`;

			tmpl.parentNode.appendChild(row);
		});
	}

	if (options.maxWidth && options.maxWidth.length) {
		tmpl = document.querySelector(`.max-width .tmpl`);
		options.maxWidth.forEach(function (item, idx) {
			var row = tmpl.cloneNode(true);

			row.classList.add(`row`);
			row.classList.remove(`tmpl`);
			row.setAttribute(`data-idx`, idx);

			row.querySelector(`.width`).textContent = item.width + `px`;
			row.querySelector(`.active`).checked = item.active;
			row.querySelector(`.active`).addEventListener(`change`, chgActive);
			row.querySelector(`.del`).addEventListener(`click`, delMaxWidth);

			tmpl.parentNode.appendChild(row);
		});
	}
}

chrome.runtime.sendMessage({ action: `options` }, function (data) {
	show(data);
	document.querySelector(`.breakpoint .add`).addEventListener(`click`, addBreakpoint);
	document.querySelector(`.max-width .add`).addEventListener(`click`, addMaxWidth);
	document.querySelector(`.reset`).addEventListener(`click`, reset);
});
