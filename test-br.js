async function test() {
  const storeRes = await fetch('https://store.steampowered.com/api/appdetails?appids=508900&filters=price_overview,basic&cc=BR');
  const storeData = await storeRes.json();
  console.log('Store:', storeData['508900'].data.price_overview);

  const marketUrl = 'https://steamcommunity.com/market/search/render/?query=&start=0&count=50&search_descriptions=0&sort_column=price&sort_dir=asc&appid=753&category_753_Game%5B%5D=tag_app_508900&category_753_item_class%5B%5D=tag_item_class_2&norender=1&currency=7';
  const marketRes = await fetch(marketUrl, { headers: { 'User-Agent': 'curl/8.5.0' }});
  const marketData = await marketRes.json();
  console.log('Market cards:', marketData.total_count);
  console.log('Sample card:', marketData.results[0].name, marketData.results[0].sell_price_text);
}
test();
