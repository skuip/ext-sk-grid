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

	function generateMedia (bp, maxWidth) {
		var css = [`
			@media (min-width: ${bp.width + 1}px) and (max-width: ${maxWidth}px) {
				sk-grid {
					border-left: ${bp.margin}px solid rgba(0,0,128,0.10);
					border-right: ${bp.margin}px solid rgba(0,0,128,0.10);
				}
				sk-column {
					border-width: 0 ${bp.gutter / 2}px;
				}
				sk-column:nth-child(n + ${bp.columns + 1}) {
					display: none;
				}
				sk-column:after {
					left: ${bp.gutter}px;
					right: ${bp.gutter}px;
				}
			}
		`];

		// Hide inner padding lines when column is less 32px. It doesn`t fit anymore
		var minWidthInnerLine = bp.columns * (3 * bp.gutter) + 2 * bp.margin - bp.gutter;
		if (minWidthInnerLine < maxWidth) {
			css.push(`
				@media (min-width: ${minWidthInnerLine + 1}px) and (max-width: ${maxWidth}px) {
					sk-column:after {
						display: block;
					}
				}
			`);
		}

		return css.join(``);
	}

	function enableGrid (options) {
		var i, column, infoColumn;

		// Create grid element
		grid = document.createElement(`sk-grid`);
		grid.style[`font-size`] = (12 / options.zoomFactor).toFixed(2) + `px`;

		options.maxWidth.forEach(function (item) {
			if (item.active) grid.style.maxWidth = item.width + `px`;
		});

		for (i = 12; i > 0; i--) {
			infoColumn = document.createElement(`sk-grid-info`);
			infoColumn.innerHTML = i;

			column = document.createElement(`sk-grid-column`);
			column.appendChild(infoColumn);

			grid.insertBefore(column, grid.firstElementChild);
		}

		var show = document.createElement(`sk-grid-show`);
		grid.appendChild(show);

		var maxw = document.createElement(`sk-grid-max-width`);
		maxw.textContent = `⟺`;
		grid.appendChild(maxw);

		var maxi = document.createElement(`sk-grid-max-info`);
		grid.appendChild(maxi);

		document.body.appendChild(grid);

		var css = ``;
		for (i = 0; i < options.breakpoint.length; i++) {
			if (i + 1 < options.breakpoint.length) {
				css += generateMedia(options.breakpoint[i], options.breakpoint[i + 1].width);
			} else {
				css += generateMedia(options.breakpoint[i], 1e6);
			}
		}

		var s = document.createElement(`style`);
		s.textContent = css;
		document.head.appendChild(s);

		function handleResize () {
			var height = window.innerHeight;
			var width = window.innerWidth;
			var infoWidth = parseFloat(window.getComputedStyle(infoColumn.parentNode).width) - 16;
			infoColumn.innerHTML = infoWidth.toFixed(1) + `px`;

			for (var i = options.breakpoint.length - 1; i >= 0; i--) {
				if (options.breakpoint[i].width < width) {
					show.innerHTML = options.breakpoint[i].name + ` - ` + width + `x` + height;
					break;
				}
				maxi.innerHTML = parseInt(window.getComputedStyle(grid).width) + `px`;
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
