async function test() {
  const url = 'https://steamcommunity.com/market/search?appid=753&category_753_Game[]=tag_app_508900';
  const res = await fetch(url, { headers: { 'User-Agent': 'curl/8.5.0', 'Cookie': 'steamCurrencyId=7' }});
  const text = await res.text();
  const prices = [...text.matchAll(/data-price="(\d+)"/g)];
  console.log(prices.slice(0, 5).map(m => m[1]));
}
test();
