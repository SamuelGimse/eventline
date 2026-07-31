(function () {
	const { THEMES } = window.EventlineConfig;
	const root = document.documentElement;
	const themeBtn = document.getElementById('themeBtn');
	const themeMenu = document.getElementById('themeMenu');

	function applyTheme(name) {
		const theme = THEMES.includes(name) ? name : 'dark';
		root.setAttribute('data-theme', theme);
		localStorage.setItem('eventline-theme', theme);

		themeMenu.querySelectorAll('button').forEach(btn => {
			btn.classList.toggle('active', btn.dataset.theme === theme);
		});

		// remap needs a size pass after CSS var change
		if (window.EventlineMap && typeof window.EventlineMap.invalidate === 'function') {
			setTimeout(() => window.EventlineMap.invalidate(), 50);
		}
	}

	function initTheme() {
		const saved = localStorage.getItem('eventline-theme') || 'dark';
		applyTheme(saved);
	}

	themeBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		themeMenu.classList.toggle('hidden');
	});

	themeMenu.querySelectorAll('button').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			applyTheme(btn.dataset.theme);
			themeMenu.classList.add('hidden');
		});
	});

	document.addEventListener('click', () => {
		themeMenu.classList.add('hidden');
	});

	window.EventlineThemes = { applyTheme, initTheme };
	initTheme();
})();