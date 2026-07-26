import fetch from 'node-fetch';
async function test() {
  const storeRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=508900&filters=price_overview,basic&cc=BR`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
  });
  console.log("Store:", storeRes.status);
  const t1 = await storeRes.text();
  console.log(t1.substring(0, 100));

  const marketUrl = `https://steamcommunity.com/market/search/render/?query=&start=0&count=50&search_descriptions=0&sort_column=price&sort_dir=asc&appid=753&category_753_Game%5B%5D=tag_app_508900&category_753_item_class%5B%5D=tag_item_class_2&norender=1&currency=1`;
  const marketRes = await fetch(marketUrl, { headers: { 'User-Agent': 'curl/8.5.0' }});
  console.log("Market:", marketRes.status);
  const t2 = await marketRes.text();
  console.log(t2.substring(0, 100));
}
test();
