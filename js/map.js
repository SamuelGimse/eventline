(function () {
	const { COUNTRY_COORDS } = window.EventlineConfig;

	let map = null;
	let mapMarkers = [];

	function ensureMap() {
		if (map) {
			map.invalidateSize(true);
			return map;
		}

		map = L.map('map', {
			worldCopyJump: true,
			minZoom: 1,
			maxZoom: 6
		}).setView([20, 0], 2);

		L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
			attribution: '&copy; OpenStreetMap &copy; CARTO',
			subdomains: 'abcd',
			maxZoom: 6
		}).addTo(map);

		return map;
	}

	function clearMarkers() {
		if (!map) return;
		mapMarkers.forEach(x => {
			try { map.removeLayer(x); } catch (e) {}
		});
		mapMarkers = [];
	}

	function invalidate() {
		if (map) map.invalidateSize(true);
	}

	function render(groups, handlers = {}) {
		const m = ensureMap();
		clearMarkers();

		const countries = window.EventlineRender.collectCountries(groups);

		for (const c of countries) {
			const coords = COUNTRY_COORDS[c.country] || COUNTRY_COORDS.Global;
			const radius = Math.min(28, 10 + c.count * 3);

			const circle = L.circleMarker(coords, {
				radius,
				color: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff6a00',
				weight: 1,
				fillColor: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff6a00',
				fillOpacity: 0.25
			}).addTo(m);

			circle.bindPopup(`<b>${c.country}</b><br>${c.count} events`);
			circle.on('click', () => {
				if (handlers.onCountry) handlers.onCountry(c.country, coords);
			});

			mapMarkers.push(circle);
		}

		setTimeout(() => m.invalidateSize(true), 80);
	}

	function focusCountry(country) {
		if (!map) return;
		const coords = COUNTRY_COORDS[country] || COUNTRY_COORDS.Global;
		map.setView(coords, 3);
	}

	window.EventlineMap = {
		ensureMap,
		clearMarkers,
		invalidate,
		render,
		focusCountry
	};
})();