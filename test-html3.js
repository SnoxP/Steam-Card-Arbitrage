async function fetchCheapGamesWithCards() {
  let games = [];
  try {
    for (let i = 0; i < 2; i++) {
      const url = `https://store.steampowered.com/search/results/?query&start=${i * 100}&count=100&category1=998&category2=29&sort_by=Price_ASC&cc=BR`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const text = await res.text();
      
      const regex = /<a href="https:\/\/store\.steampowered\.com\/app\/(\d+)[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const appId = match[1];
        const innerHtml = match[2];
        const titleMatch = innerHtml.match(/<span class="title">([^<]+)<\/span>/);
        const title = titleMatch ? titleMatch[1] : '';
        const priceMatch = innerHtml.match(/data-price-final="(\d+)"/);
        const price = priceMatch ? parseInt(priceMatch[1]) / 100 : 0;
        
        if (appId && title) {
          games.push({ appId, title, price });
        }
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    // Deduplicate by appId
    const uniqueGames = [];
    const seen = new Set();
    for (const g of games) {
      if (!seen.has(g.appId)) {
        seen.add(g.appId);
        uniqueGames.push(g);
      }
    }
    games = uniqueGames;
  } catch (e) {
    console.error('Failed to fetch cheap games list', e);
  }
  return games;
}
fetchCheapGamesWithCards().then(games => console.log(games.slice(0, 5), games.length));
