const url = 'https://steamcommunity.com/market/search?appid=753&category_Game=app_3751950';
fetch(url).then(r => r.text()).then(t => console.log(t.match(/searchResults_total">([\d,]+)/)));
