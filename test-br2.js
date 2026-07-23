async function test() {
  const marketUrl = 'https://steamcommunity.com/market/search/render/?query=&start=0&count=50&search_descriptions=0&sort_column=price&sort_dir=asc&appid=753&category_753_Game%5B%5D=tag_app_508900&category_753_item_class%5B%5D=tag_item_class_2&norender=1';
  const marketRes = await fetch(marketUrl, { headers: { 'User-Agent': 'curl/8.5.0', 'Cookie': 'steamCurrencyId=7' }});
  const marketData = await marketRes.json();
  console.log('Sample card:', marketData.results[0].name, marketData.results[0].sell_price_text, marketData.results[0].sell_price);
}
test();
