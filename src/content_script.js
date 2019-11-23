/* vim:set textwidth=80: */
'use strict';

(function (window, document) {
	console.log(`SK-Grid loaded`);

	const gridElement = document.createElement(`div`);
	gridElement.attachShadow({ mode: `open` });
	gridElement.setAttribute(`hidden`, `hidden`);
	document.body.appendChild(gridElement);

	let grid;

	chrome.runtime.onMessage.addListener(handleMessage);
	chrome.runtime.sendMessage({ action: `options` }, enableGrid);

	function handleMessage (data, sender, sendResponse) {
		switch (data.action) {
			case `knock-knock`:
				if (gridElement.hasAttribute(`hidden`)) {
					gridElement.removeAttribute(`hidden`);
					console.log(`SK-Grid enabled`);
				} else {
					gridElement.setAttribute(`hidden`, `hidden`);
					console.log(`SK-Grid disabled`);
				}
				sendResponse({});
				break;

			case `zoomChange`:
				break;
		}
	}

	function enableGrid (options) {
		var i, breakpoint = `unknown`, columns = [ null ];

		gridElement.shadowRoot.innerHTML = options.shadowRoot;
		grid = gridElement.shadowRoot.querySelector(`.grid`);

		for (i = 0; i < options.maxWidth.length; i++) {
			let item = options.maxWidth[i];

			if (window.innerWidth < item.width) break;

			grid.style.setProperty(`--grid-width`, item.width + `px`);

			if (item.active) break;
		}

		const maxColumns = options.breakpoint.reduce((acc, cur) => {
			return Math.max(acc, cur.columns);
		}, 0);

		columns[1] = grid.querySelector(`.column`);


		for (i = 2; i <= maxColumns; i++) {
			columns[i] = columns[1].cloneNode();
			columns[i].setAttribute(`data-column`, i);
			grid.appendChild(columns[i]);
		}

		const show = grid.querySelector(`.show`);

		function handleResize () {
			var height = window.innerHeight;
			var width = window.innerWidth;
			var infoWidth = columns[1].getBoundingClientRect();

			columns[1].setAttribute(`data-width`, infoWidth.width.toFixed(1) + `px`);

			const bp = options.breakpoint.reduce((acc, cur) => {
				if (acc.width > width) return cur;
				if (cur.width > width) return acc;
				return acc.width < cur.width ? cur : acc;
			});

			show.innerHTML = bp.name + ` - ` + width + `x` + height;

			if (bp.name !== breakpoint) {
				breakpoint = bp.name;

				for (var j = 1; j < columns.length; j++) {
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
		}


		window.addEventListener(`resize`, handleResize);

		grid.addEventListener(`click`, function handleClick () {
			let width = parseInt(grid.style.getPropertyValue(`--grid-width`));
			if (isNaN(width) || width >= 4096) width = 0;

			const widths = options.maxWidth.filter(i => window.innerWidth > i.width);
			widths.push({ width: 4096 });

			const bigger = widths.filter(i => i.width > width);

			const maxWidth = bigger.length ? bigger[0].width : widths.width;

			grid.style.setProperty(`--grid-width`, maxWidth + `px`);

			handleResize();
		});

		handleResize();
	}

})(window, document);

`OK`;
