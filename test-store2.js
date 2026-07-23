async function test() {
  // Sort by price ascending
  const url = 'https://store.steampowered.com/search/results/?query&start=0&count=20&category1=998&category2=29&sort_by=Price_ASC&cc=BR';
  const res = await fetch(url);
  const text = await res.text();
  const matches = [...text.matchAll(/data-ds-appid="([^"]+)"/g)];
  console.log('App IDs:', matches.map(m => m[1]));
}
test();
