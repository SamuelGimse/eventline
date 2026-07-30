// Public Supabase config (use ANON / publishable key only)
const SUPABASE_URL = 'https://yrykmwjcarytyroofiar.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_I6HgMNkoKiMcAghe0oyMxA_YNKfurSq';
const list = document.getElementById('list');
const status = document.getElementById('status');
const meta = document.getElementById('meta');
const boot = document.getElementById('boot');
const bootLog = document.getElementById('bootLog');

const BOOT_LINES = [
	'> wake Eventline engine',
	'> allocate analysis threads',
	'> open global signal mesh',
	'> handshake media endpoints',
	'> ingest live news wires',
	'> scan NRK · Norway realtime',
	'> scan E24 · market desk',
	'> scan BBC World · geopolitics',
	'> scan CNBC · market tone',
	'> scan TechCrunch · technology',
	'> scan STAT · health and biotech',
	'> read Federal Reserve releases',
	'> parse macro policy language',
	'> pull SEC 8-K filings',
	'> extract material company events',
	'> map government contract flow',
	'> detect large public spending signals',
	'> measure extreme weather nodes',
	'> check heat · cold · flood risk zones',
	'> rank US session winners',
	'> rank US session losers',
	'> cross-link movers to sectors',
	'> strip noise from signal',
	'> discard weak local clutter',
	'> keep high-impact catalysts',
	'> cluster catalysts into events',
	'> merge overlapping storylines',
	'> name market-relevant themes',
	'> match events to US equities',
	'> identify exposed companies',
	'> score stance · watch / constructive / cautious',
	'> estimate horizon · days / weeks / months',
	'> weight confidence level',
	'> build opportunity map',
	'> package clean overview',
	'> surface what matters now'
];

function sleep(ms) {
	return new Promise(r => setTimeout(r, ms));
}

async function runBootSequence() {
	boot.classList.remove('hidden');
	bootLog.textContent = '';

	for (const line of BOOT_LINES) {
		bootLog.textContent += line + '\n';
		bootLog.scrollTop = bootLog.scrollHeight;
		await sleep(20 + Math.random() * 220);
	}

	await sleep(350);
	boot.classList.add('hidden');
}

function tvUrl(symbol) {
	return `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(symbol)}&interval=D&theme=dark&style=1&locale=en&hide_top_toolbar=1&hide_legend=1&hidesidetoolbar=1&symboledit=0&saveimage=0&toolbarbg=0a0a0a`;
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

function buildGroupElement(group, index) {
	const stocks = group.stocks || [];
	const angles = group.opportunity_angles || group.angles || [];
	const articles = group.articles || [];
	const count = group.count || articles.length || 0;

	const el = document.createElement('section');
	el.className = 'group';

	el.innerHTML = `
    <div class="group-top">
      <div class="group-left">
        <div class="group-name">${group.name || 'Group'}</div>
        <div class="bubbles">
          ${stocks.map(s => `
            <button class="bubble" data-symbol="${s.symbol}" title="${s.name || s.symbol}">
              ${s.symbol}
            </button>
          `).join('')}
        </div>
      </div>
      ${stanceHtml(group)}
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
          <div class="card-meta">${a.source || ''} ${a.date ? '· ' + new Date(a.date).toLocaleString() : ''}</div>
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
		if (hidden) {
			articlesGrid.classList.remove('hidden');
			toggleBtn.textContent = `Hide articles (${count})`;
		} else {
			articlesGrid.classList.add('hidden');
			toggleBtn.textContent = `Show articles (${count})`;
		}
	});

	const chart = el.querySelector(`#chart-${index}`);
	const showChart = (symbol, name) => {
		chart.innerHTML = `
      <div class="chart-name">${symbol} — ${name}</div>
      <iframe
        src="${tvUrl(symbol)}"
        width="100%"
        height="360"
        frameborder="0"
        allowtransparency="true"
        scrolling="no">
      </iframe>
    `;
	};

	const bubbles = el.querySelectorAll('.bubble');
	bubbles.forEach(btn => {
		btn.addEventListener('click', () => {
			const symbol = btn.dataset.symbol;
			const name = btn.getAttribute('title') || symbol;
			bubbles.forEach(b => b.classList.remove('active'));
			btn.classList.add('active');
			showChart(symbol, name);
		});
	});

	if (stocks.length > 0) {
		const first = stocks[0];
		if (bubbles[0]) bubbles[0].classList.add('active');
		showChart(first.symbol, first.name || first.symbol);
	}

	return el;
}

async function render(groups) {
	list.innerHTML = '';

	if (!groups.length) {
		list.innerHTML = '<p style="color:#666">No published groups yet</p>';
		return;
	}

	for (let i = 0; i < groups.length; i++) {
		const el = buildGroupElement(groups[i], i);
		list.appendChild(el);
		// pop in one by one
		requestAnimationFrame(() => el.classList.add('show'));
		await sleep(220);
	}
}

async function load() {
	try {
		await runBootSequence();

		const url =
			`${SUPABASE_URL}/rest/v1/publishes` +
			`?select=id,title,notes,created_at,groups_json` +
			`&order=id.desc&limit=1`;

		const res = await fetch(url, {
			headers: {
				apikey: SUPABASE_ANON_KEY,
				Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
				Accept: 'application/json'
			}
		});

		if (!res.ok) {
			status.textContent = `Supabase error ${res.status}`;
			meta.textContent = 'Error';
			return;
		}

		const rows = await res.json();
		const latest = rows[0];

		if (!latest) {
			meta.textContent = 'No publish yet';
			status.textContent = 'Admin has not published a feed yet';
			return;
		}

		const groups = latest.groups_json || [];
		meta.textContent = ` ${new Date(latest.created_at).toLocaleString()}`;
		status.textContent = `${groups.length} groups mapped`;
		await render(groups);
	} catch (err) {
		console.error(err);
		boot.classList.add('hidden');
		meta.textContent = 'Error';
		status.textContent = 'Could not load from Supabase';
	}
}

load();
