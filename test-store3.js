async function test() {
  const url = 'https://store.steampowered.com/search/results/?query&start=100&count=50&category1=998&category2=29&sort_by=Price_ASC&cc=BR';
  const res = await fetch(url);
  const text = await res.text();
  const prices = [...text.matchAll(/data-price-final="([^"]+)"/g)].map(m => m[1]);
  const ids = [...text.matchAll(/data-ds-appid="([^"]+)"/g)].map(m => m[1]);
  console.log(ids.slice(0, 10), prices.slice(0, 10));
}
test();
