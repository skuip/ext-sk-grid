/* vim:set textwidth=80: */
'use strict';

(function (window, document) {
	var grid = document.querySelector(`sk-grid`);

	console.log(`SK-Grid enabled`);

	chrome.runtime.onMessage.addListener(handleMessage);
	chrome.runtime.sendMessage({ action: `options` }, enableGrid);

	function handleMessage (data, sender, sendResponse) {
		switch (data.action) {
			case `knock-knock`:
				if (grid.getAttribute(`aria-hidden`) === `true`) {
					grid.removeAttribute(`aria-hidden`);
					console.log(`SK-Grid enabled`);
				} else {
					grid.setAttribute(`aria-hidden`, `true`);
					console.log(`SK-Grid disabled`);
				}
				sendResponse({});
				break;

			case `zoomChange`:
				break;
		}

		grid.style[`font-size`] = (12 / data.zoomFactor).toFixed(2) + `px`;
	}


	function enableGrid (options) {
		var i, breakpointIdx = -1, columns = [];

		// Create grid element
		grid = document.createElement(`sk-grid`);
		grid.style[`font-size`] = (12 / options.zoomFactor).toFixed(2) + `px`;

		options.maxWidth.forEach(function (item) {
			if (item.active) grid.style.maxWidth = item.width + `px`;
		});

		const maxColumns = options.breakpoint.reduce((acc, cur) => {
			return Math.max(acc, cur.columns);
		}, 0);

		for (i = maxColumns; i > 0; i--) {
			columns[i] = document.createElement(`sk-grid-column`);
			columns[i].innerHTML = `<sk-grid-info>${i}</sk-grid-info>`;
		}

		var show = document.createElement(`sk-grid-show`);
		grid.appendChild(show);

		var maxw = document.createElement(`sk-grid-max-width`);
		maxw.textContent = `⟺`;
		grid.appendChild(maxw);

		document.body.appendChild(grid);

		function handleResize () {
			var height = window.innerHeight;
			var width = window.innerWidth;
			var infoWidth = columns[1].getBoundingClientRect();
			columns[1].firstElementChild.innerHTML = infoWidth.width.toFixed(1) + `px`;
			console.log(columns);

			for (var i = options.breakpoint.length - 1; i >= 0; i--) {
				var bp = options.breakpoint[i];

				if (bp.width <= width) {
					show.innerHTML = options.breakpoint[i].name + ` - ` + width + `x` + height;

					if (i !== breakpointIdx) {
						breakpointIdx = i;
						for (var j = 1; j < columns.length; j++) {
							console.log(j, columns[j]);
							if (j <= bp.columns) {
								grid.appendChild(columns[j]);
							} else if (columns[j].parentNode) {
								grid.removeChild(columns[j]);
							}
						}

						grid.style.setProperty(`--grid-columns`, bp.columns);
						grid.style.setProperty(`--grid-gutter`, bp.gutter + `px`);
						grid.style.setProperty(`--grid-margin`, bp.margin + `px`);
					}

					break;
				}
			}
		}


		window.addEventListener(`resize`, handleResize);

		grid.addEventListener(`click`, function handleClick () {
			var width = parseInt(grid.style.maxWidth);

			if (isNaN(width) || width === 0) {
				width = 4096;
			}

			var maxWidth;
			for (var i = options.maxWidth.length - 1; i >= 0; i--) {
				maxWidth = options.maxWidth[i].width
				if (window.innerWidth > maxWidth) {
					if (width > maxWidth) {
						chrome.runtime.sendMessage({
							action: `maxWidth`,
							index: i
						});
						break;
					} else {
						maxWidth = 4096;
					}
				}
			}
			grid.style.maxWidth = maxWidth + `px`;

			handleResize();
		});

		handleResize();
	}

})(window, document);
