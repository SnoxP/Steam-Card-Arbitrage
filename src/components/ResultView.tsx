import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, DollarSign, Info } from 'lucide-react';
import type { AnalysisResult } from '../types';

export function ResultView({ result }: { result: AnalysisResult }) {
  const formatCurrency = (val: number, currency: string = "BRL") => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden shadow-2xl ">
        <div className="relative h-56 md:h-72 bg-black">
          <img
            src={`https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${result.appId}/header.jpg`}
            alt={result.gameName}
            className="w-full h-full object-cover opacity-50"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/600x400/1e293b/475569?text=Sem+Imagem";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">{result.gameName}</h2>
            <div className="flex items-center gap-2 text-zinc-300 bg-zinc-800 w-fit px-3 py-1 rounded-full border border-zinc-800 text-sm font-medium">
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
              Este jogo não possui cartas colecionáveis no Mercado da Steam.
            </p>
          </div>
        ) : (
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 shadow-inner">
                <div className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                  Preço do Jogo <DollarSign size={14} />
                </div>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(result.gamePrice, result.currency)}
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
                  {formatCurrency(result.lowestCardPrice || 0, result.currency)}
                </div>
                <div className="text-zinc-500 text-xs mt-1">Baseado no mercado atual</div>
              </div>

              <div className={`rounded-lg p-6 border relative overflow-hidden shadow-inner ${result.isProfitable ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"}`}>
                <div className="absolute -top-4 -right-4 p-4 opacity-10">
                  {result.isProfitable ? <TrendingUp size={96} className="text-emerald-500" /> : <TrendingDown size={96} className="text-rose-500" />}
                </div>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2 ${result.isProfitable ? "text-emerald-400" : "text-rose-400"}`}>
                  Retorno Líquido
                </div>
                <div className={`text-4xl font-bold ${result.isProfitable ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatCurrency(result.expectedDropValueNet || 0, result.currency)}
                </div>
                <div className="text-zinc-400 text-xs mt-2 relative z-10">
                  Venda de {result.cardsDropped} cartas (metade do set) após taxas
                </div>
              </div>
            </div>

            <div className={`p-6 md:p-8 mb-8 rounded-md border shadow-xl ${result.isProfitable ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-50" : "bg-zinc-900 border-zinc-800 text-zinc-300"}`}>
              <div className="flex items-start gap-4 md:gap-6">
                <div className={`p-4 rounded-lg shrink-0 ${result.isProfitable ? "bg-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-zinc-800"}`}>
                  {result.isProfitable ? <TrendingUp size={32} className="text-emerald-300" /> : <Info size={32} className="text-zinc-400" />}
                </div>
                <div>
                  <h3 className="font-bold text-2xl tracking-tight mb-2">
                    {result.isProfitable ? "Oportunidade de Lucro!" : "Sem Arbitragem"}
                  </h3>
                  <p className={`text-base leading-relaxed ${result.isProfitable ? "text-emerald-100/80" : "text-zinc-400"}`}>
                    {result.isProfitable ? `Comprar o jogo por ${formatCurrency(result.gamePrice)} e vender as ${result.cardsDropped} cartas que dropam renderá cerca de ${formatCurrency(result.expectedDropValueNet || 0)} líquidos (descontadas taxas da Steam), resultando em lucro na carteira.` : "O valor estimado de drop das cartas não cobre o preço atual do jogo. Pode não valer a pena apenas para farmar cartas."}
                  </p>
                </div>
              </div>
            </div>

            {result.cards && result.cards.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-bold text-zinc-200 mb-6 flex items-center gap-2">
                  Cartas no Mercado <span className="bg-zinc-800 px-2 py-0.5 rounded-md text-sm">{result.cards.length}</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {result.cards.map((card, idx) => (
                    <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col justify-between hover:bg-zinc-900 transition-colors">
                      <span className="text-zinc-300 text-sm font-medium mb-3 break-words">{card.name}</span>
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

      <div className="text-center text-zinc-500 text-xs">
        Valores listados em BRL (R$). Estimativa baseada no preço mínimo de venda atual no Mercado da Comunidade Steam. O drop real de cartas geralmente corresponde à metade (arredondado para cima) do total do set do jogo.
      </div>
    </motion.div>
  );
}
