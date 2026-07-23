const url = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent('https://steamcommunity.com/market/search?appid=753&category_753_Game[]=tag_app_3751950');
fetch(url).then(r => r.text()).then(t => {
  const matches = [...t.matchAll(/href="([^"]+)"/g)].filter(m => m[1].includes('market/listings/753/'));
  console.log(matches.slice(0, 5).map(m => m[1]));
});
