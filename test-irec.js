async function test() {
  const appId = '557260';
  const marketUrl = `https://steamcommunity.com/market/search/render/?query=&start=0&count=50&search_descriptions=0&sort_column=price&sort_dir=asc&appid=753&category_753_Game%5B%5D=tag_app_${appId}&category_753_item_class%5B%5D=tag_item_class_2&norender=1&currency=1`;
  const marketRes = await fetch(marketUrl, { headers: { 'User-Agent': 'curl/8.5.0' }});
  const marketData = await marketRes.json();
  const cards = marketData.results.map(r => r.name);
  console.log('All cards:', cards);
  
  const normalCards = cards.filter(name => !name.toLowerCase().includes('foil'));
  console.log('Normal cards:', normalCards.length, normalCards);
}
test();
