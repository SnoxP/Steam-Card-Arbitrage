async function fetchCheapGames() {
  let appIds = [];
  for (let i = 0; i < 5; i++) {
    const url = `https://store.steampowered.com/search/results/?query&start=${i * 100}&count=100&category1=998&category2=29&sort_by=Price_ASC&cc=BR`;
    const res = await fetch(url);
    const text = await res.text();
    const ids = [...text.matchAll(/data-ds-appid="([^"]+)"/g)].map(m => m[1]);
    appIds.push(...ids);
  }
  // Deduplicate
  appIds = [...new Set(appIds)];
  console.log('Found', appIds.length, 'games.');
  console.log(appIds.slice(0, 10));
}
fetchCheapGames();
