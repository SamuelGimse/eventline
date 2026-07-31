(function () {
	function sleep(ms) {
		return new Promise(r => setTimeout(r, ms));
	}

	function tvUrl(symbol) {
		return `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(symbol)}&interval=D&theme=dark&style=1&locale=en&hide_top_toolbar=1&hide_legend=1&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=0a0a0a`;
	}

	function pctText(v) {
		if (v == null || Number.isNaN(Number(v))) return '';
		const n = Number(v);
		return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
	}

	function stanceHtml(group) {
		const stance = (group.stance || 'watch').toLowerCase();
		const horizon = (group.time_horizon || '').toLowerCase();
		const confidence = (group.confidence || '').toLowerCase();

		const stanceText = {
			watch: 'Watch — monitor, no clear action yet',
			constructive: 'Constructive — possible upside if thesis holds',
			cautious: 'Cautious — higher risk / unclear payoff'
		}[stance] || 'Watch — monitor, no clear action yet';

		const horizonText = {
			days: 'Days — short-term move',
			weeks: 'Weeks — medium-term setup',
			months: 'Months — longer theme'
		}[horizon] || '';

		const confidenceText = {
			low: 'Low confidence',
			medium: 'Medium confidence',
			high: 'High confidence'
		}[confidence] || '';

		return `
      <div class="stance stance-${stance}">
        <div>${stanceText}</div>
        <div class="stance-sub">${[horizonText, confidenceText].filter(Boolean).join(' · ')}</div>
      </div>
    `;
	}

	function stockBuckets(group) {
		const direct = group.direct_stocks || [];
		const related = group.related_stocks || [];
		const fallback = group.stocks || [];
		const movers = group.movers || [];
		if (direct.length || related.length) return { direct, related, movers };
		return { direct: fallback, related: [], movers };
	}

	function bubbleBtn(s) {
		const pct = pctText(s.changePercent);
		const tone =
			s.changePercent == null
				? ''
				: Number(s.changePercent) >= 0
					? 'mover-up'
					: 'mover-down';

		return `
      <button class="bubble ${tone}" data-symbol="${s.symbol}" title="${s.name || s.symbol}">
        ${s.symbol}${pct ? ' ' + pct : ''}
      </button>
    `;
	}

	function clustersForSymbol(groups, symbol) {
		const s = (symbol || '').toUpperCase();
		return (groups || []).filter(g => {
			const all = [
				...(g.direct_stocks || []),
				...(g.related_stocks || []),
				...(g.stocks || []),
				...(g.movers || [])
			];
			return all.some(x => (x.symbol || '').toUpperCase() === s);
		});
	}

	function clustersForCountry(groups, country) {
		return (groups || []).filter(g =>
			(g.articles || []).some(a => {
				const primary = a.primary_country || 'Global';
				const list = Array.isArray(a.countries) ? a.countries : [primary];
				return primary === country || list.includes(country);
			})
		);
	}

	function collectCountries(groups) {
		const counts = {};
		for (const g of groups || []) {
			for (const a of g.articles || []) {
				const c = a.primary_country || 'Global';
				counts[c] = (counts[c] || 0) + 1;
			}
		}
		return Object.entries(counts)
			.map(([country, count]) => ({ country, count }))
			.sort((a, b) => b.count - a.count);
	}

	function articlesForCountry(groups, country) {
		const out = [];
		for (const g of groups || []) {
			for (const a of g.articles || []) {
				const primary = a.primary_country || 'Global';
				const list = Array.isArray(a.countries) ? a.countries : [primary];
				if (primary === country || list.includes(country)) {
					out.push({ ...a, cluster: g.name || '' });
				}
			}
		}
		const seen = new Set();
		return out.filter(a => {
			const key = (a.title || '') + '|' + (a.link || '');
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	}

	function renderRelatedClusters(title, clusters, mountEl) {
		if (!mountEl) return;
		let panel = mountEl.querySelector('.related-clusters-panel');
		if (!panel) {
			panel = document.createElement('div');
			panel.className = 'related-clusters related-clusters-panel';
			mountEl.appendChild(panel);
		}

		panel.innerHTML = `
      <div class="related-head">
        <div class="related-title">${title}</div>
        <div class="related-count">${clusters.length} cluster${clusters.length === 1 ? '' : 's'}</div>
      </div>
      <div class="related-list">
        ${
			clusters.length
				? clusters.map(g => `
                <button class="related-item" data-cluster="${g.name}">
                  <div class="t">${g.name}</div>
                  <div class="s">${(g.articles || []).length} articles · ${((g.direct_stocks || g.stocks || []).length)} stocks</div>
                </button>
              `).join('')
				: '<div class="related-empty">No related clusters</div>'
		}
      </div>
    `;

		panel.querySelectorAll('.related-item').forEach(btn => {
			btn.addEventListener('click', () => {
				if (window.EventlineApp) window.EventlineApp.jumpToCluster(btn.dataset.cluster);
			});
		});
	}

	function buildGroupElement(group, index, currentGroups) {
		const { direct, related, movers } = stockBuckets(group);
		const angles = group.opportunity_angles || group.angles || [];
		const articles = group.articles || [];
		const count = group.count || articles.length || 0;
		const eventsView = document.getElementById('eventsView');

		const el = document.createElement('section');
		el.className = 'group';
		el.dataset.cluster = group.name || '';

		el.innerHTML = `
      <div class="group-top">
        <div class="group-name">${group.name || 'Cluster'}</div>
        ${stanceHtml(group)}
      </div>

      <div class="linked-stocks">
        <div class="linked-block">
          <div class="linked-label">Directly linked</div>
          <div class="bubbles-scroll">
            ${direct.length ? direct.map(bubbleBtn).join('') : '<span style="color:var(--text-meta);font-size:12px">None mapped</span>'}
          </div>
        </div>

        <div class="linked-block">
          <div class="linked-label">Second-order exposure</div>
          <div class="bubbles-scroll">
            ${related.length ? related.map(bubbleBtn).join('') : '<span style="color:var(--text-meta);font-size:12px">None mapped</span>'}
          </div>
        </div>

        <div class="linked-block">
          <div class="linked-label">Connected movers</div>
          <div class="bubbles-scroll">
            ${
			movers.length
				? movers.map(m => {
					const up = (m.changePercent || 0) >= 0;
					return `
                      <button class="mover-chip ${up ? 'mover-up' : 'mover-down'}" data-symbol="${m.symbol}" title="${m.name || m.symbol}">
                        ${up ? '▲' : '▼'} ${m.symbol} ${pctText(m.changePercent)}
                      </button>
                    `;
				}).join('')
				: '<span style="color:var(--text-meta);font-size:12px">None linked</span>'
		}
          </div>
        </div>
      </div>

      <div class="box">
        <div class="reason">${group.reason || group.summary || ''}</div>
        ${angles.map(a => `<div class="angle">• ${a}</div>`).join('')}
        <div class="chart" id="chart-${index}"></div>
        <button class="toggle-articles" type="button">Show articles (${count})</button>
      </div>

      <div class="grid articles hidden">
        ${articles.map(a => `
          <div class="card">
            <div class="card-title">${a.title || ''}</div>
            <div class="card-meta">
              ${a.source || ''}
              ${a.date ? ' · ' + new Date(a.date).toLocaleString() : ''}
              ${a.primary_country ? `<span class="country-pill">${a.primary_country}</span>` : ''}
            </div>
            <div class="card-summary">${a.short_summary || a.summary || ''}</div>
            ${a.link ? `<a href="${a.link}" target="_blank">Read →</a>` : ''}
          </div>
        `).join('')}
      </div>
    `;

		const toggleBtn = el.querySelector('.toggle-articles');
		const articlesGrid = el.querySelector('.articles');
		toggleBtn.addEventListener('click', () => {
			const hidden = articlesGrid.classList.contains('hidden');
			articlesGrid.classList.toggle('hidden', !hidden);
			toggleBtn.textContent = hidden ? `Hide articles (${count})` : `Show articles (${count})`;
		});

		const chart = el.querySelector(`#chart-${index}`);
		const allChips = el.querySelectorAll('.bubble, .mover-chip');

		const showChart = (symbol, name) => {
			chart.innerHTML = `
        <div class="chart-name">${symbol} — ${name}</div>
        <iframe src="${tvUrl(symbol)}" width="100%" height="360" frameborder="0" allowtransparency="true" scrolling="no"></iframe>
      `;
		};

		allChips.forEach(btn => {
			btn.addEventListener('click', () => {
				const symbol = btn.dataset.symbol;
				const name = btn.getAttribute('title') || symbol;
				allChips.forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
				showChart(symbol, name);
				renderRelatedClusters(
					`Clusters linked to ${symbol}`,
					clustersForSymbol(currentGroups, symbol),
					eventsView
				);
			});
		});

		const first = direct[0] || related[0] || (group.stocks || [])[0];
		if (first) {
			const firstBtn = el.querySelector(`[data-symbol="${first.symbol}"]`);
			if (firstBtn) firstBtn.classList.add('active');
			showChart(first.symbol, first.name || first.symbol);
		}

		return el;
	}

	async function renderEvents(groups, currentGroups) {
		const eventsView = document.getElementById('eventsView');
		eventsView.innerHTML = '';

		if (!groups.length) {
			eventsView.innerHTML = '<p style="color:var(--text-meta)">No clusters in this publish</p>';
			return;
		}

		for (let i = 0; i < groups.length; i++) {
			const el = buildGroupElement(groups[i], i, currentGroups);
			eventsView.appendChild(el);
			requestAnimationFrame(() => el.classList.add('show'));
			await sleep(50);
		}
	}

	function renderCountryPanel(groups, onCountry) {
		const countryPanel = document.getElementById('countryPanel');
		const countries = collectCountries(groups);

		countryPanel.innerHTML = countries.map(c => `
      <div class="country-card" data-country="${c.country}">
        <div class="c-name">${c.country}</div>
        <div class="c-count">${c.count} event${c.count === 1 ? '' : 's'}</div>
      </div>
    `).join('');

		countryPanel.querySelectorAll('.country-card').forEach(card => {
			card.addEventListener('click', () => onCountry(card.dataset.country));
		});
	}

	function highlightCountryCard(country) {
		document.querySelectorAll('.country-card').forEach(card => {
			card.classList.toggle('active', card.dataset.country === country);
		});
	}

	function renderCountryArticles(groups, country) {
		const countryArticles = document.getElementById('countryArticles');
		if (!country) {
			countryArticles.innerHTML = `
        <div class="country-articles-head">
          <div class="c-count">Select a country</div>
        </div>
      `;
			return;
		}

		const items = articlesForCountry(groups, country);
		countryArticles.innerHTML = `
      <div class="country-articles-head">
        <div class="c-name">${country}</div>
        <div class="c-count">${items.length} article${items.length === 1 ? '' : 's'}</div>
      </div>
      <div class="grid">
        ${
			items.length
				? items.map(a => `
                <div class="card">
                  <div class="card-title">${a.title || ''}</div>
                  <div class="card-meta">
                    ${a.cluster ? a.cluster + ' · ' : ''}${a.source || ''}
                    ${a.date ? ' · ' + new Date(a.date).toLocaleString() : ''}
                  </div>
                  <div class="card-summary">${a.short_summary || a.summary || ''}</div>
                  ${a.link ? `<a href="${a.link}" target="_blank">Read →</a>` : ''}
                </div>
              `).join('')
				: '<p style="color:var(--text-meta)">No articles for this country</p>'
		}
      </div>
    `;
	}

	function renderDaysList(publishes, publishIndex, onSelect) {
		const daysView = document.getElementById('daysView');
		daysView.innerHTML = publishes.map((p, i) => `
      <div class="day-item ${i === publishIndex ? 'active' : ''}" data-index="${i}">
        <div>
          <div class="t">${p.title || 'Publish #' + p.id}</div>
          <div class="s">${new Date(p.created_at).toLocaleString()}</div>
        </div>
        <div class="s">${(p.groups_json || []).length} clusters</div>
      </div>
    `).join('');

		daysView.querySelectorAll('.day-item').forEach(item => {
			item.addEventListener('click', () => onSelect(Number(item.dataset.index)));
		});
	}

	window.EventlineRender = {
		sleep,
		collectCountries,
		clustersForSymbol,
		clustersForCountry,
		renderEvents,
		renderCountryPanel,
		highlightCountryCard,
		renderCountryArticles,
		renderRelatedClusters,
		renderDaysList
	};
})();