async function fetchCheapGames() {
  let appIds = [];
  try {
    for (let i = 0; i < 20; i++) {
      const url = `https://store.steampowered.com/search/results/?query&start=${i * 100}&count=100&category1=998&category2=29&sort_by=Price_ASC&cc=BR`;
      const res = await fetch(url, { headers: { 'User-Agent': 'curl/8.5.0' } });
      const text = await res.text();
      const ids = [...text.matchAll(/data-ds-appid="([^"]+)"/g)].map(m => m[1]);
      appIds.push(...ids);
      console.log(`Page ${i}: ${ids.length} games`);
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (e) { console.error(e); }
  appIds = [...new Set(appIds)];
  console.log('Total unique:', appIds.length);
}
fetchCheapGames();
