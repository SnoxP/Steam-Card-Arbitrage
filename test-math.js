async function test() {
  const appId = '557260';
  const marketUrl = `https://steamcommunity.com/market/search/render/?query=&start=0&count=50&search_descriptions=0&sort_column=price&sort_dir=asc&appid=753&category_753_Game%5B%5D=tag_app_${appId}&category_753_item_class%5B%5D=tag_item_class_2&norender=1&currency=1`;
  const marketRes = await fetch(marketUrl, { headers: { 'User-Agent': 'curl/8.5.0' }});
  const marketData = await marketRes.json();
  
  const allCards = marketData.results.map(r => ({
    name: r.name,
    price: r.sell_price / 100,
    isFoil: r.name.toLowerCase().includes('(foil')
  }));
  
  const normalCards = allCards.filter(c => !c.isFoil);
  const baseCards = normalCards.length > 0 ? normalCards : allCards;
  
  const numCards = baseCards.length;
  const cardsDropped = Math.ceil(numCards / 2);
  const lowestCardPrice = baseCards.length > 0 ? Math.min(...baseCards.map(c => c.price)) : 0;
  const expectedDropValueGross = lowestCardPrice * cardsDropped;
  const expectedDropValueNet = expectedDropValueGross * 0.85;
  
  console.log('All Cards length:', allCards.length);
  console.log('Normal Cards length (set size):', numCards);
  console.log('Cards Dropped:', cardsDropped);
  console.log('Lowest price:', lowestCardPrice);
}
test();
