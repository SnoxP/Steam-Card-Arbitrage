/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Gamepad2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  AlertCircle,
  Info,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import type { AnalysisResult } from "./types";

export default function App() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<string | null>(
    localStorage.getItem("username"),
  );
  const [userHistoryGames, setUserHistoryGames] = useState<AnalysisResult[]>(
    [],
  );

  const [topGames, setTopGames] = useState<AnalysisResult[]>([]);
  const [historyGames, setHistoryGames] = useState<AnalysisResult[]>([]);
  const [scanStats, setScanStats] = useState<{
    scannedTotal: number;
    currentScanSize: number;
  } | null>(null);
  const [loadingTop, setLoadingTop] = useState(false);

  useEffect(() => {
    const fetchTopGames = async () => {
      try {
        const [topRes, statsRes, historyRes] = await Promise.all([
          fetch("/api/scan-top"),
          fetch("/api/scan-stats"),
          fetch("/api/scan-history"),
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
        console.error("Failed to fetch top games, stats, or history", e);
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
      const res = await fetch(
        `/api/user-history/${encodeURIComponent(currentUser)}`,
      );
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

  useEffect(() => {
    if (!currentUser) return;
    const ping = () => {
      fetch("/api/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: currentUser }),
      }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const presetGames = [
    { id: "508900", name: "Zup! S" },
    { id: "437580", name: "Montaro" },
    { id: "400", name: "Portal" },
    { id: "105600", name: "Terraria" },
    { id: "3751950", name: "Assassin's Creed Black Flag Resynced" },
  ];

  const parseAppId = (text: string) => {
    const numericMatch = text.match(/^\d+$/);
    if (numericMatch) return text;

    const urlMatch = text.match(/\/app\/(\d+)/);
    if (urlMatch) return urlMatch[1];

    return null;
  };

  const [isRestartingScan, setIsRestartingScan] = useState(false);

  const handleRestartScan = async () => {
    if (isRestartingScan) return;
    setIsRestartingScan(true);
    try {
      await fetch("/api/restart-scan", { method: "POST" });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsRestartingScan(false), 1000);
    }
  };

  const handleViewCached = (game: AnalysisResult) => {
    setResult(game);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAnalyze = async (gameInput: string) => {
    const appId = parseAppId(gameInput);
    if (!appId) {
      setError("Por favor, insira um App ID válido ou a URL do jogo na Steam.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, username: currentUser }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao analisar o jogo.");
      }

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
        fetchUserHistory();
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number, currency: string = "BRL") => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(val);
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-violet-500/30 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none h-[50vh] bottom-0 top-auto"></div>

      <div className="relative max-w-5xl mx-auto px-4 py-8 md:py-16">
        {/* User Login & Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-16 gap-4 border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3 text-violet-400">
            <div className="p-2.5 bg-violet-500/10 rounded-md">
              <Gamepad2 size={28} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              SteamTracker
            </span>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-4 bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 ">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-zinc-300 text-sm font-medium hidden sm:inline">
                  Olá, {currentUser}
                </span>
              </div>
              <div className="w-px h-4 bg-zinc-800 mx-2"></div>
              <button
                onClick={() => {
                  setResult(null);
                  setTimeout(() => {
                    document
                      .getElementById("historico")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1.5 font-medium"
              >
                <Search size={14} />
                <span className="hidden sm:inline">Histórico</span>
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("username");
                  setCurrentUser(null);
                }}
                className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors font-medium ml-2"
              >
                Sair
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const user = fd.get("username") as string;
                if (user && user.trim()) {
                  localStorage.setItem("username", user.trim());
                  setCurrentUser(user.trim());
                }
              }}
              className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-lg border border-zinc-800 "
            >
              <input
                type="text"
                name="username"
                placeholder="Nome de usuário..."
                className="bg-transparent text-zinc-200 px-3 py-1.5 w-40 sm:w-48 text-sm focus:outline-none placeholder:text-zinc-500"
                required
              />
              <button
                type="submit"
                className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-md transition-all font-medium shadow-lg shadow-violet-500/20"
              >
                Entrar
              </button>
            </form>
          )}
        </div>

        {!currentUser ? (
          <div className="text-center max-w-2xl mx-auto mt-20">
            <div className="inline-flex items-center justify-center p-4 bg-zinc-900 rounded-md mb-8 border border-zinc-800 shadow-2xl ">
              <Gamepad2 size={48} className="text-violet-400" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
              Steam Card Arbitrage
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl mb-12 leading-relaxed">
              Descubra se as cartas de um jogo valem mais que o próprio jogo.
              Monitoramento em tempo real de oportunidades de lucro no mercado
              da Steam.
            </p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-md p-8 shadow-2xl  inline-block text-left">
              <h2 className="text-xl font-bold text-zinc-200 mb-2 flex items-center gap-2">
                <Search className="text-violet-400" size={20} />
                Identifique-se
              </h2>
              <p className="text-zinc-400 mb-6 text-sm">
                Digite um nome de usuário no topo da tela para acessar o
                analisador e salvar o seu histórico de pesquisas pessoal.
              </p>
              <div className="flex items-center gap-3 text-sm text-zinc-500 bg-zinc-950 p-3 rounded-md border border-zinc-800">
                <Info size={16} className="text-violet-400 shrink-0" />
                <span>
                  O sistema continua escaneando o mercado ativamente enquanto
                  usuários estão conectados.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <header className="mb-12 text-center space-y-4 max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
                Steam Card Arbitrage
              </h1>
              <p className="text-zinc-400 text-lg">
                Insira a URL ou App ID para analisar em tempo real.
              </p>
            </header>

            {/* Search Box */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-md p-2 md:p-3 mb-8 shadow-2xl  flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-zinc-500">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze(input)}
                  placeholder="Ex: 508900 ou URL da Steam..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-4 pl-14 pr-4 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition-all"
                />
              </div>
              <button
                onClick={() => handleAnalyze(input)}
                disabled={loading || !input.trim()}
                className="bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-900 disabled:text-zinc-500 text-white font-medium px-8 py-4 rounded-lg transition-all flex items-center justify-center min-w-[160px] shadow-lg shadow-violet-500/20 disabled:shadow-none"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  "Analisar Jogo"
                )}
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 justify-center mb-12 items-center">
              <span className="text-zinc-500 text-sm font-medium mr-2">
                Exemplos:
              </span>
              {presetGames.map((game) => (
                <button
                  key={game.id}
                  onClick={() => {
                    setInput(game.id);
                    handleAnalyze(game.id);
                  }}
                  className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full text-sm text-zinc-300 transition-colors "
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
                  className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center gap-3 mb-8 "
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
                  <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2 text-violet-400">
                      <Sparkles size={24} />
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Oportunidades Ao Vivo
                      </h2>
                      <button
                        onClick={handleRestartScan}
                        disabled={isRestartingScan}
                        title="Reiniciar processo de verificação global"
                        className="ml-2 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          size={18}
                          className={
                            isRestartingScan
                              ? "animate-spin text-violet-400"
                              : ""
                          }
                        />
                      </button>
                    </div>
                    {scanStats && scanStats.currentScanSize > 0 && (
                      <div className="text-xs text-violet-400/80 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-500/20 font-medium">
                        Analisando {scanStats.currentScanSize} (Verificados:{" "}
                        {scanStats.scannedTotal})
                      </div>
                    )}
                  </div>

                  <p className="text-zinc-400 text-sm mb-6">
                    Monitorando dezenas de jogos baratos conhecidos em tempo
                    real. Os jogos listados aqui possuem cartas que, ao serem
                    dropadas, superam o valor do jogo. (Devido aos limites da
                    API da Steam, não é possível escanear 100% da loja ao mesmo
                    tempo).
                  </p>

                  {loadingTop ? (
                    <div className="flex justify-center p-12 bg-zinc-900 rounded-md border border-zinc-800 ">
                      <Loader2
                        className="animate-spin text-violet-500"
                        size={32}
                      />
                    </div>
                  ) : topGames.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {topGames.map((game) => (
                        <div
                          key={game.appId}
                          className="bg-zinc-900 border border-emerald-500/30 rounded-lg p-4 flex gap-4 hover:bg-zinc-800 transition-all cursor-pointer shadow-xl  group"
                          onClick={() => handleViewCached(game)}
                        >
                          <div className="overflow-hidden rounded-md w-24 shrink-0">
                            <img
                              src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appId}/capsule_sm_120.jpg`}
                              alt={game.gameName}
                              className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-center">
                            <h3 className="font-bold text-white truncate text-lg tracking-tight leading-tight">
                              {game.gameName}
                            </h3>
                            <div className="flex justify-between items-end mt-3 text-sm bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                              <div>
                                <div className="text-zinc-500 text-[10px] uppercase tracking-wider font-semibold">
                                  Preço
                                </div>
                                <div className="text-zinc-200 font-medium">
                                  {formatCurrency(
                                    game.gamePrice,
                                    game.currency,
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-emerald-500/70 text-[10px] uppercase tracking-wider font-semibold">
                                  Lucro (Drop)
                                </div>
                                <div className="text-emerald-400 font-bold">
                                  +
                                  {formatCurrency(
                                    (game.expectedDropValueNet || 0) -
                                      game.gamePrice,
                                    game.currency,
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-zinc-500 p-8 text-center bg-zinc-900 rounded-md border border-zinc-800  shadow-xl">
                      Nenhuma oportunidade clara encontrada nos jogos
                      monitorados no momento.
                    </div>
                  )}
                </motion.div>
              )}

              {/* User Personal History */}
              {!result && currentUser && userHistoryGames.length > 0 && (
                <motion.div
                  id="historico"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-12 space-y-4"
                >
                  <div className="flex items-center gap-2 text-violet-400 mb-6 border-b border-zinc-800 pb-4">
                    <Search size={24} />
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      Seu Histórico de Pesquisas
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {userHistoryGames.map((game: any) => (
                      <div
                        key={game.appId}
                        className={`bg-zinc-900 border ${game.isProfitable ? "border-emerald-500/20" : "border-zinc-800"} rounded-lg p-4 flex gap-4 cursor-pointer hover:bg-zinc-800 transition-all shadow-xl  group`}
                        onClick={() => handleViewCached(game)}
                      >
                        <div className="overflow-hidden rounded-md w-16 shrink-0 shadow-md">
                          <img
                            src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appId}/capsule_sm_120.jpg`}
                            alt={game.gameName}
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col justify-center">
                          <h3 className="font-semibold text-sm text-zinc-100 truncate">
                            {game.gameName}
                          </h3>
                          <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">
                            Pesquisado em{" "}
                            {new Date(game.foundAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs mt-1.5 font-medium">
                            {game.isProfitable ? (
                              <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                                Lucro{" "}
                                {formatCurrency(
                                  (game.expectedDropValueNet || 0) -
                                    game.gamePrice,
                                  game.currency,
                                )}
                              </span>
                            ) : (
                              <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md">
                                Prejuízo{" "}
                                {formatCurrency(
                                  game.gamePrice -
                                    (game.expectedDropValueNet || 0),
                                  game.currency,
                                )}
                              </span>
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
                  className="mb-12 space-y-4"
                >
                  <div className="flex items-center gap-2 text-zinc-400 mb-6 border-b border-zinc-800 pb-4">
                    <Search size={24} />
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-300">
                      Histórico Global de Oportunidades
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {historyGames.map((game: any) => (
                      <div
                        key={game.appId}
                        className={`bg-zinc-900 border ${game.isProfitable ? "border-emerald-500/20" : "border-zinc-800"} rounded-lg p-4 flex gap-4 cursor-pointer hover:bg-zinc-800 transition-all shadow-xl  group`}
                        onClick={() => handleViewCached(game)}
                      >
                        <div className="overflow-hidden rounded-md w-16 shrink-0 shadow-md">
                          <img
                            src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appId}/capsule_sm_120.jpg`}
                            alt={game.gameName}
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!game.isProfitable && "grayscale opacity-50"}`}
                          />
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col justify-center">
                          <h3
                            className={`font-semibold text-sm truncate ${!game.isProfitable ? "text-zinc-400" : "text-zinc-100"}`}
                          >
                            {game.gameName}
                          </h3>
                          <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">
                            Visto em{" "}
                            {new Date(game.foundAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs mt-1.5 font-medium">
                            {game.isProfitable ? (
                              <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                                Lucro{" "}
                                {formatCurrency(
                                  (game.expectedDropValueNet || 0) -
                                    game.gamePrice,
                                  game.currency,
                                )}
                              </span>
                            ) : (
                              <span className="text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md">
                                Já não é mais rentável
                              </span>
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
                  <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden shadow-2xl ">
                    {/* Game Banner */}
                    <div className="relative h-56 md:h-72 bg-black">
                      <img
                        src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${result.appId}/header.jpg`}
                        alt={result.gameName}
                        className="w-full h-full object-cover opacity-50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/600x400/1e293b/475569?text=Sem+Imagem";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                          {result.gameName}
                        </h2>
                        <div className="flex items-center gap-2 text-zinc-300 bg-zinc-800 w-fit px-3 py-1 rounded-full  border border-zinc-800 text-sm font-medium">
                          App ID: {result.appId}
                        </div>
                      </div>
                    </div>

                    {!result.hasCards ? (
                      <div className="p-12 text-center text-zinc-400">
                        <div className="inline-flex p-4 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
                          <Info size={40} className="text-zinc-500" />
                        </div>
                        <p className="text-lg font-medium text-zinc-300">
                          Este jogo não possui cartas colecionáveis no Mercado
                          da Steam.
                        </p>
                      </div>
                    ) : (
                      <div className="p-6 md:p-8">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 shadow-inner">
                            <div className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                              Preço do Jogo <DollarSign size={14} />
                            </div>
                            <div className="text-3xl font-bold text-white">
                              {formatCurrency(
                                result.gamePrice,
                                result.currency,
                              )}
                            </div>
                            {result.gamePrice === 0 && (
                              <div className="text-emerald-400 text-xs mt-1 font-medium bg-emerald-400/10 px-2 py-0.5 rounded w-fit">
                                Gratuito
                              </div>
                            )}
                          </div>

                          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 shadow-inner">
                            <div className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                              Menor Preço de Carta
                            </div>
                            <div className="text-3xl font-bold text-zinc-200">
                              {formatCurrency(
                                result.lowestCardPrice || 0,
                                result.currency,
                              )}
                            </div>
                            <div className="text-zinc-500 text-xs mt-1">
                              Baseado no mercado atual
                            </div>
                          </div>

                          <div
                            className={`rounded-lg p-6 border relative overflow-hidden shadow-inner ${
                              result.isProfitable
                                ? "bg-emerald-500/10 border-emerald-500/30"
                                : "bg-rose-500/10 border-rose-500/30"
                            }`}
                          >
                            <div className="absolute -top-4 -right-4 p-4 opacity-10">
                              {result.isProfitable ? (
                                <TrendingUp
                                  size={96}
                                  className="text-emerald-500"
                                />
                              ) : (
                                <TrendingDown
                                  size={96}
                                  className="text-rose-500"
                                />
                              )}
                            </div>
                            <div
                              className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2 ${
                                result.isProfitable
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              Retorno Líquido
                            </div>
                            <div
                              className={`text-4xl font-bold ${
                                result.isProfitable
                                  ? "text-emerald-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {formatCurrency(
                                result.expectedDropValueNet || 0,
                                result.currency,
                              )}
                            </div>
                            <div className="text-zinc-400 text-xs mt-2 relative z-10">
                              Venda de {result.cardsDropped} cartas (metade do
                              set) após taxas
                            </div>
                          </div>
                        </div>

                        {/* Verdict */}
                        <div
                          className={`p-6 md:p-8 mb-8 rounded-md border shadow-xl ${
                            result.isProfitable
                              ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-50"
                              : "bg-zinc-900 border-zinc-800 text-zinc-300"
                          }`}
                        >
                          <div className="flex items-start gap-4 md:gap-6">
                            <div
                              className={`p-4 rounded-lg shrink-0 ${
                                result.isProfitable
                                  ? "bg-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                  : "bg-zinc-800"
                              }`}
                            >
                              {result.isProfitable ? (
                                <TrendingUp
                                  size={32}
                                  className="text-emerald-300"
                                />
                              ) : (
                                <Info size={32} className="text-zinc-400" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-2xl tracking-tight mb-2">
                                {result.isProfitable
                                  ? "Oportunidade de Lucro!"
                                  : "Sem Arbitragem"}
                              </h3>
                              <p
                                className={`text-base leading-relaxed ${result.isProfitable ? "text-emerald-100/80" : "text-zinc-400"}`}
                              >
                                {result.isProfitable
                                  ? `Comprar o jogo por ${formatCurrency(result.gamePrice)} e vender as ${result.cardsDropped} cartas que dropam renderá cerca de ${formatCurrency(result.expectedDropValueNet || 0)} líquidos (descontadas taxas da Steam), resultando em lucro na carteira.`
                                  : "O valor estimado de drop das cartas não cobre o preço atual do jogo. Pode não valer a pena apenas para farmar cartas."}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Cards List */}
                        {result.cards && result.cards.length > 0 && (
                          <div className="mt-12">
                            <h3 className="text-xl font-bold text-zinc-200 mb-6 flex items-center gap-2">
                              Cartas no Mercado{" "}
                              <span className="bg-zinc-800 px-2 py-0.5 rounded-md text-sm">
                                {result.cards.length}
                              </span>
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                              {result.cards.map((card, idx) => (
                                <div
                                  key={idx}
                                  className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col justify-between hover:bg-zinc-900 hover:border-zinc-800 transition-colors"
                                >
                                  <span className="text-zinc-300 text-sm font-medium mb-3 break-words">
                                    {card.name}
                                  </span>
                                  <div className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded w-fit text-sm">
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
                  <div className="text-center text-zinc-500 text-xs">
                    Valores listados em BRL (R$). Estimativa baseada no preço
                    mínimo de venda atual no Mercado da Comunidade Steam. O drop
                    real de cartas geralmente corresponde à metade (arredondado
                    para cima) do total do set do jogo.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
