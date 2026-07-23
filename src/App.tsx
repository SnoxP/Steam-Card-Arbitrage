/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Gamepad2, TrendingUp, TrendingDown, DollarSign, Loader2, AlertCircle, Info, Sparkles } from 'lucide-react';
import type { AnalysisResult } from './types';

export default function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('username'));
  const [userHistoryGames, setUserHistoryGames] = useState<AnalysisResult[]>([]);

  const [topGames, setTopGames] = useState<AnalysisResult[]>([]);
  const [historyGames, setHistoryGames] = useState<AnalysisResult[]>([]);
  const [scanStats, setScanStats] = useState<{scannedTotal: number, currentScanSize: number} | null>(null);
  const [loadingTop, setLoadingTop] = useState(false);

  useEffect(() => {
    const fetchTopGames = async () => {
      try {
        const [topRes, statsRes, historyRes] = await Promise.all([
          fetch('/api/scan-top'),
          fetch('/api/scan-stats'),
          fetch('/api/scan-history')
        ]);
        
        if (topRes.ok) {
          const data = await topRes.json();
          setTopGames(data);
        }
        
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setScanStats(statsData);
        }
        
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistoryGames(historyData);
        }
      } catch (e) {
        console.error('Failed to fetch top games, stats, or history', e);
      } finally {
        setLoadingTop(false);
      }
    };
    
    setLoadingTop(true);
    fetchTopGames();
    
    // Poll every 10 seconds to get the latest cached results from the background scanner
    const interval = setInterval(fetchTopGames, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserHistory = async () => {
    if (!currentUser) {
      setUserHistoryGames([]);
      return;
    }
    try {
      const res = await fetch(`/api/user-history/${encodeURIComponent(currentUser)}`);
      if (res.ok) {
        setUserHistoryGames(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUserHistory();
  }, [currentUser]);

  const presetGames = [
    { id: '508900', name: 'Zup! S' },
    { id: '437580', name: 'Montaro' },
    { id: '400', name: 'Portal' },
    { id: '105600', name: 'Terraria' },
    { id: '3751950', name: "Assassin's Creed Black Flag Resynced" }
  ];

  const parseAppId = (text: string) => {
    const numericMatch = text.match(/^\d+$/);
    if (numericMatch) return text;
    
    const urlMatch = text.match(/\/app\/(\d+)/);
    if (urlMatch) return urlMatch[1];
    
    return null;
  };

  const handleAnalyze = async (gameInput: string) => {
    const appId = parseAppId(gameInput);
    if (!appId) {
      setError('Por favor, insira um App ID válido ou a URL do jogo na Steam.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, username: currentUser })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao analisar o jogo.');
      }

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        fetchUserHistory();
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* User Login */}
        <div className="flex justify-end mb-4">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm">Olá, {currentUser}</span>
              <button 
                onClick={() => {
                  localStorage.removeItem('username');
                  setCurrentUser(null);
                }}
                className="text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                Sair
              </button>
            </div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const user = fd.get('username') as string;
                if (user && user.trim()) {
                  localStorage.setItem('username', user.trim());
                  setCurrentUser(user.trim());
                }
              }}
              className="flex items-center gap-2"
            >
              <input 
                type="text" 
                name="username" 
                placeholder="Seu usuário..." 
                className="bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required 
              />
              <button type="submit" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                Entrar
              </button>
            </form>
          )}
        </div>

        {/* Header */}
        <header className="mb-12 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 text-indigo-400">
            <Gamepad2 size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Steam Card Arbitrage
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Descubra se as cartas de um jogo valem mais que o próprio jogo. 
            Insira a URL ou App ID para analisar em tempo real.
          </p>
        </header>

        {/* Search Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-2 md:p-4 mb-8 shadow-2xl flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze(input)}
              placeholder="Ex: 508900 ou https://store.steampowered.com/app/508900"
              className="w-full bg-slate-950 border-0 rounded-2xl py-4 pl-12 pr-4 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
          <button
            onClick={() => handleAnalyze(input)}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium px-8 py-4 rounded-2xl transition-all flex items-center justify-center min-w-[160px]"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Analisar'}
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          <span className="text-slate-500 text-sm py-2 px-3">Exemplos Rápidos:</span>
          {presetGames.map(game => (
            <button
              key={game.id}
              onClick={() => {
                setInput(game.id);
                handleAnalyze(game.id);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm text-slate-300 transition-colors"
            >
              {game.name}
            </button>
          ))}
        </div>

        {/* Error State */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 mb-8"
            >
              <AlertCircle size={20} className="shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          {/* Top Profitable Games (Only show if no result is displayed) */}
          {!result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-12 space-y-4"
            >
              <div className="flex items-center gap-2 text-indigo-400 mb-6">
                <Sparkles size={24} />
                <h2 className="text-2xl font-bold text-white">Oportunidades Ao Vivo</h2>
              </div>
              <p className="text-slate-400 text-sm">
                Monitorando dezenas de jogos baratos conhecidos em tempo real. Os jogos listados aqui possuem cartas que, ao serem dropadas, superam o valor do jogo. (Devido aos limites da API da Steam, não é possível escanear 100% da loja ao mesmo tempo).
              </p>
              {scanStats && scanStats.currentScanSize > 0 && (
                <div className="text-xs text-indigo-400/80 mt-2 bg-indigo-500/10 w-fit px-3 py-1.5 rounded-full border border-indigo-500/20">
                  Analisando {scanStats.currentScanSize} jogos potenciais (Verificados: {scanStats.scannedTotal})
                </div>
              )}

              {loadingTop ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
              ) : topGames.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topGames.map((game) => (
                    <div key={game.appId} className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex gap-4 hover:border-emerald-500/60 transition-colors cursor-pointer" onClick={() => {
                      setInput(game.appId);
                      handleAnalyze(game.appId);
                    }}>
                      <img 
                        src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appId}/capsule_sm_120.jpg`} 
                        alt={game.gameName}
                        className="rounded-lg w-24 h-fit object-cover opacity-90"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-white truncate">{game.gameName}</h3>
                        <div className="flex justify-between items-end mt-2 text-sm">
                          <div>
                            <div className="text-slate-500 text-xs">Preço</div>
                            <div className="text-slate-200">{formatCurrency(game.gamePrice, game.currency)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-500/70 text-xs">Lucro (Drop)</div>
                            <div className="text-emerald-400 font-bold">+{formatCurrency((game.expectedDropValueNet || 0) - game.gamePrice, game.currency)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
                  Nenhuma oportunidade clara encontrada nos jogos monitorados no momento.
                </div>
              )}
            </motion.div>
          )}

          {/* User Personal History */}
          {!result && currentUser && userHistoryGames.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 mb-12"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Search className="text-indigo-400" />
                Seu Histórico de Pesquisas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {userHistoryGames.map((game: any) => (
                  <div key={game.appId} className={`bg-slate-900 border ${game.isProfitable ? 'border-emerald-500/20' : 'border-slate-800'} rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-slate-800 transition-colors`} onClick={() => {
                    setInput(game.appId);
                    handleAnalyze(game.appId);
                  }}>
                    <img 
                      src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appId}/capsule_sm_120.jpg`} 
                      alt={game.gameName}
                      className="rounded-lg w-16 h-fit object-cover opacity-80"
                    />
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-semibold text-sm text-slate-200 truncate">{game.gameName}</h3>
                      <div className="text-xs text-slate-500 mt-1">
                        Pesquisado em: {new Date(game.foundAt).toLocaleString()}
                      </div>
                      <div className="text-xs mt-1">
                        {game.isProfitable ? (
                          <span className="text-emerald-400 font-medium">Lucro de {formatCurrency((game.expectedDropValueNet || 0) - game.gamePrice, game.currency)}</span>
                        ) : (
                          <span className="text-red-400 font-medium">Prejuízo de {formatCurrency(game.gamePrice - (game.expectedDropValueNet || 0), game.currency)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Global History */}
          {!result && historyGames.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Search className="text-slate-400" />
                Histórico de Oportunidades Encontradas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {historyGames.map((game: any) => (
                  <div key={game.appId} className={`bg-slate-900 border ${game.isProfitable ? 'border-emerald-500/20' : 'border-slate-800'} rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-slate-800 transition-colors`} onClick={() => {
                    setInput(game.appId);
                    handleAnalyze(game.appId);
                  }}>
                    <img 
                      src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appId}/capsule_sm_120.jpg`} 
                      alt={game.gameName}
                      className="rounded-lg w-16 h-fit object-cover opacity-80"
                    />
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-semibold text-sm text-slate-200 truncate">{game.gameName}</h3>
                      <div className="text-xs text-slate-500 mt-1">
                        Visto em: {new Date(game.foundAt).toLocaleString()}
                      </div>
                      <div className="text-xs mt-1">
                        {game.isProfitable ? (
                          <span className="text-emerald-400 font-medium">Lucro de {formatCurrency((game.expectedDropValueNet || 0) - game.gamePrice, game.currency)}</span>
                        ) : (
                          <span className="text-slate-500">Já não é mais rentável</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                
                {/* Game Banner */}
                <div className="relative h-48 md:h-64 bg-slate-950">
                  <img 
                    src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${result.appId}/header.jpg`}
                    alt={result.gameName}
                    className="w-full h-full object-cover opacity-60"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1e293b/475569?text=Sem+Imagem';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{result.gameName}</h2>
                    <div className="flex items-center gap-2 text-slate-300 bg-slate-950/50 w-fit px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 text-sm">
                      ID: {result.appId}
                    </div>
                  </div>
                </div>

                {!result.hasCards ? (
                  <div className="p-8 text-center text-slate-400">
                    <Info size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Este jogo não possui cartas colecionáveis no Mercado da Steam.</p>
                  </div>
                ) : (
                  <div className="p-6 md:p-8">
                    
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800">
                        <div className="text-slate-500 text-sm mb-2 flex items-center gap-2">
                          Preço do Jogo <DollarSign size={14}/>
                        </div>
                        <div className="text-3xl font-bold text-white">
                          {formatCurrency(result.gamePrice, result.currency)}
                        </div>
                        {result.gamePrice === 0 && (
                          <div className="text-emerald-400 text-xs mt-1 font-medium">Gratuito</div>
                        )}
                      </div>
                      
                      <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800">
                        <div className="text-slate-500 text-sm mb-2">Menor Preço de Carta</div>
                        <div className="text-3xl font-bold text-slate-300">
                          {formatCurrency(result.lowestCardPrice || 0, result.currency)}
                        </div>
                        <div className="text-slate-500 text-xs mt-1">
                          Baseado no mercado atual
                        </div>
                      </div>

                      <div className={`rounded-2xl p-6 border relative overflow-hidden ${
                        result.isProfitable 
                          ? 'bg-emerald-500/10 border-emerald-500/30' 
                          : 'bg-rose-500/10 border-rose-500/30'
                      }`}>
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                          {result.isProfitable ? <TrendingUp size={64} className="text-emerald-500" /> : <TrendingDown size={64} className="text-rose-500" />}
                        </div>
                        <div className={`text-sm mb-2 font-medium flex items-center gap-2 ${
                          result.isProfitable ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          Retorno Esperado (Líquido)
                        </div>
                        <div className={`text-4xl font-bold ${
                          result.isProfitable ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {formatCurrency(result.expectedDropValueNet || 0, result.currency)}
                        </div>
                        <div className="text-slate-400 text-xs mt-2 relative z-10">
                          Venda de {result.cardsDropped} cartas (metade do set) após taxas
                        </div>
                      </div>
                    </div>

                    {/* Verdict */}
                    <div className={`p-6 mb-8 rounded-2xl border ${
                      result.isProfitable 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100' 
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}>
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl shrink-0 ${
                          result.isProfitable ? 'bg-emerald-500/20' : 'bg-slate-900'
                        }`}>
                          {result.isProfitable ? <TrendingUp size={24} className="text-emerald-400" /> : <Info size={24} className="text-slate-500" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-1">
                            {result.isProfitable ? 'Oportunidade de Lucro!' : 'Sem Arbitragem'}
                          </h3>
                          <p className={`text-sm ${result.isProfitable ? 'text-emerald-200/80' : 'text-slate-500'}`}>
                            {result.isProfitable 
                              ? `Comprar o jogo por ${formatCurrency(result.gamePrice)} e vender as ${result.cardsDropped} cartas que dropam renderá cerca de ${formatCurrency(result.expectedDropValueNet || 0)} líquidos (descontadas taxas da Steam), resultando em lucro na carteira.`
                              : 'O valor estimado de drop das cartas não cobre o preço atual do jogo. Pode não valer a pena apenas para farmar cartas.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cards List */}
                    {result.cards && result.cards.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-xl font-bold text-white mb-4">Cartas no Mercado ({result.cards.length})</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {result.cards.map((card, idx) => (
                            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
                              <span className="text-slate-300 text-sm font-medium mb-3 break-words">{card.name}</span>
                              <div className="text-emerald-400 font-bold">
                                {card.priceText}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
              
              {/* Note */}
              <div className="text-center text-slate-500 text-xs">
                Valores listados em BRL (R$). Estimativa baseada no preço mínimo de venda atual no Mercado da Comunidade Steam. O drop real de cartas geralmente corresponde à metade (arredondado para cima) do total do set do jogo.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
