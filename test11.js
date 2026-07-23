const url = 'https://steamcommunity.com/market/search?appid=753&category_753_Game[]=tag_app_3751950';
fetch(url).then(r => r.text()).then(t => console.log(t.substring(0, 500)));
