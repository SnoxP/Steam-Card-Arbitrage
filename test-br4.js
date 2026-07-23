async function test() {
  const marketUrl = 'https://steamcommunity.com/market/search/render/?query=&start=0&count=1&search_descriptions=0&sort_column=price&sort_dir=asc&appid=753&category_753_Game%5B%5D=tag_app_508900&category_753_item_class%5B%5D=tag_item_class_2&norender=1&cc=br';
  const res = await fetch(marketUrl, { headers: { 'User-Agent': 'curl/8.5.0' }});
  const data = await res.json();
  console.log(data.results[0].sell_price_text, data.results[0].sell_price);
}
test();
