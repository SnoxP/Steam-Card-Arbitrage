const url = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent('https://steamcommunity.com/market/search?appid=753&category_753_Game[]=tag_app_3751950&category_753_item_class[]=tag_item_class_2');
fetch(url).then(r => r.text()).then(t => console.log(t.match(/searchResults_total">([\d,]+)/)));
