(function () {
	const { SUPABASE_URL, SUPABASE_ANON_KEY, BOOT_LINES } = window.EventlineConfig;
	const R = window.EventlineRender;
	const M = window.EventlineMap;

	const main = document.getElementById('main');
	const eventsView = document.getElementById('eventsView');
	const mapView = document.getElementById('mapView');
	const daysView = document.getElementById('daysView');
	const status = document.getElementById('status');
	const meta = document.getElementById('meta');
	const boot = document.getElementById('boot');
	const bootLog = document.getElementById('bootLog');
	const dayBar = document.getElementById('dayBar');
	const dayLabel = document.getElementById('dayLabel');
	const prevDayBtn = document.getElementById('prevDay');
	const nextDayBtn = document.getElementById('nextDay');
	const countryArticles = document.getElementById('countryArticles');
	const relatedClusters = document.getElementById('relatedClusters');

	const navEvents = document.getElementById('navEvents');
	const navMap = document.getElementById('navMap');
	const navDays = document.getElementById('navDays');

	let publishes = [];
	let publishIndex = 0;
	let currentGroups = [];
	let activeView = 'events';

	async function runBootSequence() {
		boot.classList.remove('hidden');
		bootLog.textContent = '';
		for (const line of BOOT_LINES) {
			bootLog.textContent += line + '\n';
			bootLog.scrollTop = bootLog.scrollHeight;
			await R.sleep(18 + Math.random() * 140);
		}
		await R.sleep(200);
		boot.classList.add('hidden');
	}

	function clearUi() {
		eventsView.innerHTML = '';
		document.getElementById('countryPanel').innerHTML = '';
		countryArticles.innerHTML = '';
		daysView.innerHTML = '';
		relatedClusters.innerHTML = '';
		document.querySelectorAll('.related-clusters-panel').forEach(el => { el.innerHTML = ''; });
		M.clearMarkers();
	}

	function updateDayBar() {
		const p = publishes[publishIndex];
		if (!p) {
			dayBar.classList.add('hidden');
			return;
		}
		dayBar.classList.remove('hidden');
		dayLabel.textContent = `${p.title || 'Publish'} · ${new Date(p.created_at).toLocaleString()}`;
		prevDayBtn.disabled = publishIndex >= publishes.length - 1;
		nextDayBtn.disabled = publishIndex <= 0;
	}

	function onCountrySelect(country) {
		R.highlightCountryCard(country);
		R.renderCountryArticles(currentGroups, country);
		R.renderRelatedClusters(
			`Clusters in ${country}`,
			R.clustersForCountry(currentGroups, country),
			mapView
		);
		M.focusCountry(country);
	}

	function renderMapView() {
		R.renderCountryPanel(currentGroups, onCountrySelect);
		countryArticles.innerHTML = `
      <div class="country-articles-head">
        <div class="c-count">Select a country</div>
      </div>
    `;
		relatedClusters.innerHTML = '';
		M.render(currentGroups, {
			onCountry: (country) => onCountrySelect(country)
		});
	}

	async function applyPublish() {
		clearUi();

		const p = publishes[publishIndex];
		if (!p) {
			meta.textContent = 'No publish yet';
			status.textContent = 'Admin has not published a feed yet';
			currentGroups = [];
			updateDayBar();
			return;
		}

		currentGroups = Array.isArray(p.groups_json) ? p.groups_json : [];
		meta.textContent = new Date(p.created_at).toLocaleString();
		status.textContent = `${currentGroups.length} clusters · publish #${p.id}`;
		updateDayBar();

		if (activeView === 'events') {
			await R.renderEvents(currentGroups, currentGroups);
		} else if (activeView === 'map') {
			renderMapView();
		} else {
			R.renderDaysList(publishes, publishIndex, async (idx) => {
				publishIndex = idx;
				await applyPublish();
				setView('events');
			});
		}
	}

	function setView(which) {
		activeView = which;

		eventsView.classList.add('hidden');
		mapView.classList.add('hidden');
		daysView.classList.add('hidden');
		navEvents.classList.remove('active');
		navMap.classList.remove('active');
		navDays.classList.remove('active');
		main.classList.toggle('map-mode', which === 'map');

		if (which === 'events') {
			eventsView.classList.remove('hidden');
			navEvents.classList.add('active');
			R.renderEvents(currentGroups, currentGroups);
		} else if (which === 'map') {
			mapView.classList.remove('hidden');
			navMap.classList.add('active');
			renderMapView();
		} else {
			daysView.classList.remove('hidden');
			navDays.classList.add('active');
			R.renderDaysList(publishes, publishIndex, async (idx) => {
				publishIndex = idx;
				await applyPublish();
				setView('events');
			});
		}
	}

	async function jumpToCluster(name) {
		setView('events');
		await R.sleep(40);
		const hit = [...eventsView.querySelectorAll('.group')].find(
			el => el.dataset.cluster === name
		);
		if (hit) hit.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	async function fetchPublishes() {
		const url =
			`${SUPABASE_URL}/rest/v1/publishes` +
			`?select=id,title,notes,created_at,groups_json` +
			`&order=id.desc&limit=30`;

		const res = await fetch(url, {
			headers: {
				apikey: SUPABASE_ANON_KEY,
				Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
				Accept: 'application/json'
			}
		});

		if (!res.ok) throw new Error('Supabase error ' + res.status);
		return res.json();
	}

	navEvents.addEventListener('click', () => setView('events'));
	navMap.addEventListener('click', () => setView('map'));
	navDays.addEventListener('click', () => setView('days'));

	prevDayBtn.addEventListener('click', async () => {
		if (publishIndex >= publishes.length - 1) return;
		publishIndex += 1;
		await applyPublish();
	});

	nextDayBtn.addEventListener('click', async () => {
		if (publishIndex <= 0) return;
		publishIndex -= 1;
		await applyPublish();
	});

	window.EventlineApp = {
		setView,
		jumpToCluster,
		getCurrentGroups: () => currentGroups
	};

	async function load() {
		try {
			await runBootSequence();
			publishes = await fetchPublishes();
			publishIndex = 0;
			await applyPublish();
			setView('events');
		} catch (err) {
			console.error(err);
			boot.classList.add('hidden');
			meta.textContent = 'Error';
			status.textContent = 'Could not load from Supabase';
		}
	}

	load();
})();