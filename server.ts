import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

let topGamesCache: any[] = [];
let historyCache: any[] = [];
let isScanning = false;
let gamesScannedTotal = 0;
let currentScanListSize = 0;

async function fetchCheapGamesWithCards() {
  let games: {appId: string, title: string, price: number}[] = [];
  try {
    // Fetch the first 2000 cheapest games that have trading cards
    for (let i = 0; i < 20; i++) {
      const url = `https://store.steampowered.com/search/results/?query&start=${i * 100}&count=100&category1=998&category2=29&sort_by=Price_ASC&cc=BR`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const text = await res.text();
      
      const regex = /<a href="https:\/\/store\.steampowered\.com\/app\/(\d+)[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const appId = match[1];
        const innerHtml = match[2];
        const titleMatch = innerHtml.match(/<span class="title">([^<]+)<\/span>/);
        const title = titleMatch ? titleMatch[1] : '';
        const priceMatch = innerHtml.match(/data-price-final="(\d+)"/);
        const price = priceMatch ? parseInt(priceMatch[1]) / 100 : 0;
        
        if (appId && title) {
          games.push({ appId, title, price });
        }
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Deduplicate
    const uniqueGames: {appId: string, title: string, price: number}[] = [];
    const seen = new Set();
    for (const g of games) {
      if (!seen.has(g.appId)) {
        seen.add(g.appId);
        uniqueGames.push(g);
      }
    }
    games = uniqueGames;
  } catch (e) {
    console.error('Failed to fetch cheap games list', e);
  }
  return games;
}

async function startServer() {
  const app = express();
  let PORT = 3000;
  // Railway and Render inject dynamic PORT variables. We use them if detected.
  // Otherwise, we strictly stick to 3000 for AI Studio compatibility.
  if (process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_STATIC_URL || process.env.RENDER) {
    PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  }

  app.use(express.json());

  // API Route to analyze Steam games
  // Helper function for game analysis
  async function analyzeGame(gameParam: string | {appId: string, title: string, price: number}) {
    try {
      let appId, gameName, gamePrice, currency;

      if (typeof gameParam === 'object') {
        appId = gameParam.appId;
        gameName = gameParam.title;
        gamePrice = gameParam.price;
        currency = 'BRL';
      } else {
        appId = gameParam;
        const storeRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&filters=price_overview,basic&cc=BR`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const storeData = await storeRes.json();
        if (!storeData || !storeData[appId] || !storeData[appId].success) return null;

        gameName = storeData[appId].data.name;
        const priceOverview = storeData[appId].data.price_overview;
        gamePrice = priceOverview ? priceOverview.final / 100 : 0;
        currency = priceOverview ? priceOverview.currency : 'BRL';
      }

      let usdToBrl = 5.0;
      try {
        const exRes = await fetch('https://open.er-api.com/v6/latest/USD');
        if (exRes.ok) {
          const exData = await exRes.json();
          if (exData && exData.rates && exData.rates.BRL) {
            usdToBrl = exData.rates.BRL;
          }
        }
      } catch (e) {}

      const marketUrl = `https://steamcommunity.com/market/search/render/?query=&start=0&count=50&search_descriptions=0&sort_column=price&sort_dir=asc&appid=753&category_753_Game%5B%5D=tag_app_${appId}&category_753_item_class%5B%5D=tag_item_class_2&norender=1&currency=1`;
      const marketRes = await fetch(marketUrl, { headers: { 'User-Agent': 'curl/8.5.0' }});
      if (!marketRes.ok) return null;

      const marketData = await marketRes.json();
      if (!marketData || !marketData.results) return null;

      const allCards = marketData.results.map((r: any) => {
        const usdPrice = r.sell_price / 100;
        const brlPrice = usdPrice * usdToBrl;
        return {
          name: r.name,
          price: brlPrice,
          priceText: `R$ ${brlPrice.toFixed(2).replace('.', ',')}`,
          isFoil: r.name.toLowerCase().includes('(foil')
        };
      });

      const normalCards = allCards.filter((c: any) => !c.isFoil);
      const baseCards = normalCards.length > 0 ? normalCards : allCards;
      
      const numCards = baseCards.length;
      if (numCards === 0) return { appId, gameName, gamePrice, currency, hasCards: false };

      const cardsDropped = Math.ceil(numCards / 2);
      const lowestCardPrice = baseCards.length > 0 ? Math.min(...baseCards.map((c: any) => c.price)) : 0;
      const expectedDropValueGross = lowestCardPrice * cardsDropped;
      const expectedDropValueNet = expectedDropValueGross * 0.85;
      
      // Free games require in-game purchases to drop cards ($9 per card), so they aren't directly profitable
      const isProfitable = gamePrice > 0 && expectedDropValueNet > gamePrice;

      return {
        appId, gameName, gamePrice, currency, hasCards: true,
        numCards, cardsDropped, lowestCardPrice, expectedDropValueGross,
        expectedDropValueNet, isProfitable, cards: allCards
      };
    } catch (e) {
      return null;
    }
  }

  const allAnalyzedAppIds = new Set<string>();
  const userHistories: Record<string, any[]> = {};

  let forceRestartScan = false;

  // Background scanner to maintain cache without rate limits
  async function runBackgroundScanner() {
    if (isScanning) return;
    isScanning = true;
    
    while (true) {
      console.log('Fetching new list of cheap games to scan...');
      let scanList: any[] = await fetchCheapGamesWithCards();
      
      const cheapAppIds = new Set(scanList.map((g: any) => g.appId));
      for (const appId of allAnalyzedAppIds) {
        if (!cheapAppIds.has(appId)) {
          scanList.push(appId);
        }
      }
      
      if (scanList.length === 0) {
        await new Promise(r => setTimeout(r, 60000));
        continue;
      }

      currentScanListSize = scanList.length;
      console.log(`Starting scan of ${scanList.length} games...`);

      for (const game of scanList) {
        if (forceRestartScan) {
          console.log('Scan manually restarted.');
          forceRestartScan = false;
          break; // break inner loop to fetch new list
        }

        gamesScannedTotal++;
        try {
          const currentAppId = typeof game === 'string' ? game : game.appId;
          const data = await analyzeGame(game);
          
          if (data) {
            // Update user histories if the game is there
            for (const username in userHistories) {
              const idx = userHistories[username].findIndex((g: any) => g.appId === currentAppId);
              if (idx >= 0) {
                userHistories[username][idx] = { ...data, foundAt: userHistories[username][idx].foundAt };
              }
            }

            if (data.hasCards && data.isProfitable) {
              const existingIdx = topGamesCache.findIndex(g => g.appId === currentAppId);
              if (existingIdx >= 0) {
                topGamesCache[existingIdx] = data;
              } else {
                topGamesCache.push(data);
              }
              
              const historyIdx = historyCache.findIndex(g => g.appId === currentAppId);
              if (historyIdx >= 0) {
                historyCache[historyIdx] = { ...data, foundAt: historyCache[historyIdx].foundAt };
              } else {
                historyCache.push({ ...data, foundAt: new Date().toISOString() });
              }
            } else {
              // Remove if no longer profitable
              topGamesCache = topGamesCache.filter(g => g.appId !== currentAppId);
              
              // Update history data if it exists, so we know it's no longer profitable
              const historyIdx = historyCache.findIndex(g => g.appId === currentAppId);
              if (historyIdx >= 0) {
                historyCache[historyIdx] = { ...data, foundAt: historyCache[historyIdx].foundAt };
              }
            }
          }
        } catch (e) {}
        
        // Sort dynamically based on profit margin
        topGamesCache.sort((a, b) => (b.expectedDropValueNet - b.gamePrice) - (a.expectedDropValueNet - a.gamePrice));
        historyCache.sort((a, b) => new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime());
        
        // Wait 1.5 seconds between each game to avoid Steam Market rate limits
        await new Promise(r => setTimeout(r, 1500));
      }
      
      console.log('Finished full scan cycle. Restarting fetch...');
      // Wait a few seconds before restarting the full scan loop
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  // Start the background scanner automatically
  runBackgroundScanner();

  app.post('/api/restart-scan', (req, res) => {
    forceRestartScan = true;
    gamesScannedTotal = 0; // Reset scanned counter optionally
    res.json({ ok: true, message: 'Scan restarted' });
  });

  app.post('/api/analyze', async (req, res) => {
    const { appId, username } = req.body;
    if (!appId) return res.status(400).json({ error: 'App ID is required.' });

    if (username) {
    }

    allAnalyzedAppIds.add(appId);

    const result = await analyzeGame(appId);
    if (!result) return res.status(500).json({ error: 'Erro ao analisar o jogo.' });
    
    if (username) {
      if (!userHistories[username]) userHistories[username] = [];
      userHistories[username] = userHistories[username].filter((g: any) => g.appId !== result.appId);
      userHistories[username].unshift({ ...result, foundAt: new Date().toISOString() });
      if (userHistories[username].length > 50) userHistories[username].pop();
    }

    return res.json(result);
  });

  app.post('/api/ping', (req, res) => {
    const { username } = req.body;
    if (username) {
    }
    res.json({ ok: true });
  });

  app.get('/api/user-history/:username', (req, res) => {
    const username = req.params.username;
    res.json(userHistories[username] || []);
  });

  app.get('/api/analyze/:appid', async (req, res) => {
    const result = await analyzeGame(req.params.appid);
    if (!result) return res.status(500).json({ error: 'Erro ao analisar o jogo.' });
    if (!result.hasCards) return res.json(result);
    return res.json(result);
  });

  app.get('/api/scan-top', (req, res) => {
    // Instantly return the cached results from the background scanner
    res.json(topGamesCache);
  });

  app.get('/api/scan-history', (req, res) => {
    res.json(historyCache);
  });

  app.get('/api/scan-stats', (req, res) => {
    res.json({
      scannedTotal: gamesScannedTotal,
      currentScanSize: currentScanListSize
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
