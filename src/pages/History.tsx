import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { ResultView } from "../components/ResultView";
import type { AnalysisResult } from "../types";

export function History() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser] = useState<string | null>(localStorage.getItem("username"));
  const [userHistoryGames, setUserHistoryGames] = useState<AnalysisResult[]>([]);
  const [historyGames, setHistoryGames] = useState<AnalysisResult[]>([]);
  const [selectedGame, setSelectedGame] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    // If we passed a game to view directly, select it
    if (location.state && location.state.game) {
      setSelectedGame(location.state.game);
    }
  }, [location]);

  useEffect(() => {
    fetch("/api/scan-history")
      .then((res) => res.json())
      .then((data) => setHistoryGames(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetch(`/api/user-history/${encodeURIComponent(currentUser)}`)
      .then((res) => res.json())
      .then((data) => setUserHistoryGames(data))
      .catch(console.error);
  }, [currentUser]);

  const formatCurrency = (val: number, currency: string = "BRL") => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(val);
  };

  if (selectedGame) {
    return (
      <div className="relative min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-violet-500/30 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none h-[50vh] bottom-0 top-auto"></div>

        <div className="relative max-w-5xl mx-auto px-4 py-8 md:py-16">
          <button 
            onClick={() => setSelectedGame(null)} 
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full w-fit"
          >
            <ArrowLeft size={16} /> Voltar ao Histórico
          </button>
          <ResultView result={selectedGame} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-violet-500/30 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none h-[50vh] bottom-0 top-auto"></div>

      <div className="relative max-w-5xl mx-auto px-4 py-8 md:py-16">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-full w-fit"
        >
          <ArrowLeft size={16} /> Voltar ao Início
        </Link>

        {currentUser && userHistoryGames.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 space-y-4">
            <div className="flex items-center gap-2 text-violet-400 mb-6 border-b border-zinc-800 pb-4">
              <Search size={24} />
              <h2 className="text-2xl font-bold text-white tracking-tight">Seu Histórico de Pesquisas</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {userHistoryGames.map((game: any) => (
                <div
                  key={game.appId}
                  className={`bg-zinc-900 border ${game.isProfitable ? "border-emerald-500/20" : "border-zinc-800"} rounded-lg p-4 flex gap-4 cursor-pointer hover:bg-zinc-800 transition-all shadow-xl group`}
                  onClick={() => setSelectedGame(game)}
                >
                  <div className="overflow-hidden rounded-md w-16 shrink-0 shadow-md">
                    <img
                      src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appId}/capsule_sm_120.jpg`}
                      alt={game.gameName}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 overflow-hidden flex flex-col justify-center">
                    <h3 className="font-semibold text-sm text-zinc-100 truncate">{game.gameName}</h3>
                    <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">
                      Pesquisado em {new Date(game.foundAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs mt-1.5 font-medium">
                      {game.isProfitable ? (
                        <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                          Lucro {formatCurrency((game.expectedDropValueNet || 0) - game.gamePrice, game.currency)}
                        </span>
                      ) : (
                        <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md">
                          Prejuízo {formatCurrency(game.gamePrice - (game.expectedDropValueNet || 0), game.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {historyGames.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-6 border-b border-zinc-800 pb-4">
              <Search size={24} />
              <h2 className="text-2xl font-bold tracking-tight text-zinc-300">Histórico Global de Oportunidades</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {historyGames.map((game: any) => (
                <div
                  key={game.appId}
                  className={`bg-zinc-900 border ${game.isProfitable ? "border-emerald-500/20" : "border-zinc-800"} rounded-lg p-4 flex gap-4 cursor-pointer hover:bg-zinc-800 transition-all shadow-xl group`}
                  onClick={() => setSelectedGame(game)}
                >
                  <div className="overflow-hidden rounded-md w-16 shrink-0 shadow-md">
                    <img
                      src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appId}/capsule_sm_120.jpg`}
                      alt={game.gameName}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!game.isProfitable && "grayscale opacity-50"}`}
                    />
                  </div>
                  <div className="flex-1 overflow-hidden flex flex-col justify-center">
                    <h3 className={`font-semibold text-sm truncate ${!game.isProfitable ? "text-zinc-400" : "text-zinc-100"}`}>
                      {game.gameName}
                    </h3>
                    <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">
                      Visto em {new Date(game.foundAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs mt-1.5 font-medium">
                      {game.isProfitable ? (
                        <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                          Lucro {formatCurrency((game.expectedDropValueNet || 0) - game.gamePrice, game.currency)}
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
      </div>
    </div>
  );
}
