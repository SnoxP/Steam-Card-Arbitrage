const url = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://steamcommunity.com/market/search?appid=753&category_753_Game[]=tag_app_3751950&category_753_item_class[]=tag_item_class_2');
fetch(url).then(r => r.json()).then(d => console.log(d.contents.match(/searchResults_total">([\d,]+)/)));
