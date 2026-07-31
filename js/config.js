const SUPABASE_URL = 'https://yrykmwjcarytyroofiar.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_I6HgMNkoKiMcAghe0oyMxA_YNKfurSq';

const BOOT_LINES = [
	'> wake Eventline engine',
	'> open global signal mesh',
	'> ingest live news wires',
	'> scan BBC World · geopolitics',
	'> scan CNBC · market tone',
	'> scan Al Jazeera · global desk',
	'> scan TechCrunch · technology',
	'> scan STAT · health and biotech',
	'> scan news.com.au · asia-pacific',
	'> read Federal Reserve releases',
	'> pull SEC 8-K filings',
	'> measure earthquake / disaster nodes',
	'> rank US winners · losers · most active',
	'> strip noise from signal',
	'> cluster catalysts into events',
	'> attach country / region tags',
	'> match events to US equities',
	'> score stance · horizon · confidence',
	'> package clean overview',
	'> surface what matters now'
];

const COUNTRY_COORDS = {
	'United States': [37.1, -95.7],
	'United Kingdom': [54.0, -2.0],
	China: [35.9, 104.2],
	Taiwan: [23.7, 121.0],
	Japan: [36.2, 138.3],
	'South Korea': [35.9, 127.8],
	'North Korea': [40.3, 127.5],
	Russia: [61.5, 105.3],
	Ukraine: [48.4, 31.2],
	Iran: [32.4, 53.7],
	Israel: [31.0, 34.8],
	Palestine: [31.95, 35.23],
	Greece: [39.1, 21.8],
	Poland: [51.9, 19.1],
	Hungary: [47.2, 19.5],
	'Saudi Arabia': [23.9, 45.1],
	'United Arab Emirates': [23.4, 53.8],
	Turkey: [39.0, 35.2],
	Germany: [51.2, 10.5],
	France: [46.2, 2.2],
	Norway: [60.5, 8.5],
	'European Union': [50.1, 9.0],
	India: [20.6, 79.0],
	Australia: [-25.3, 133.8],
	Canada: [56.1, -106.3],
	Mexico: [23.6, -102.5],
	Brazil: [-14.2, -51.9],
	Global: [20, 0]
};

const THEMES = ['dark', 'dark-blue', 'white', 'cyberpunk', 'retro', 'pink', 'gray'];

window.EventlineConfig = {
	SUPABASE_URL,
	SUPABASE_ANON_KEY,
	BOOT_LINES,
	COUNTRY_COORDS,
	THEMES
};