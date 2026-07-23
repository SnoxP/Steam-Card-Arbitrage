async function test() {
  // Try querying two games at once: 508900 (Zup), 533300 (Zup 2)
  const marketUrl = `https://steamcommunity.com/market/search/render/?query=&start=0&count=100&search_descriptions=0&sort_column=price&sort_dir=asc&appid=753&category_753_Game%5B%5D=tag_app_508900&category_753_Game%5B%5D=tag_app_533300&category_753_item_class%5B%5D=tag_item_class_2&norender=1&currency=1`;
  const res = await fetch(marketUrl, { headers: { 'User-Agent': 'curl/8.5.0' }});
  const data = await res.json();
  console.log(data.total_count);
  console.log(data.results.map(r => r.name));
}
test();
