async function test() {
  const url = `https://store.steampowered.com/search/results/?query&start=0&count=50&category1=998&category2=29&sort_by=Price_ASC&cc=BR`;
  const res = await fetch(url, { headers: { 'User-Agent': 'curl/8.5.0' } });
  const text = await res.text();
  
  const games = [];
  const regex = /<a href="https:\/\/store\.steampowered\.com\/app\/(\d+)[^>]*>([\s\S]*?)<\/a>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const appId = match[1];
    const innerHtml = match[2];
    
    // Extract title
    const titleMatch = innerHtml.match(/<span class="title">([^<]+)<\/span>/);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Extract price
    const priceMatch = innerHtml.match(/data-price-final="(\d+)"/);
    const price = priceMatch ? parseInt(priceMatch[1]) / 100 : 0;
    
    if (appId && title) {
      games.push({ appId, title, price });
    }
  }
  
  console.log(games.slice(0, 10));
}
test();
