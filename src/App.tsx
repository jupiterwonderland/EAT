/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Diamond, 
  Club, 
  Spade, 
  RotateCcw, 
  Trophy, 
  User, 
  Cpu,
  Info,
  ChevronRight
} from 'lucide-react';
import { Suit, Rank, Card, GameState, GameStatus } from './types';
import { createDeck, isPlayable, shuffle } from './utils';

const SUIT_ICONS = {
  [Suit.HEARTS]: <Heart className="w-full h-full text-red-500 fill-red-500" />,
  [Suit.DIAMONDS]: <Diamond className="w-full h-full text-red-500 fill-red-500" />,
  [Suit.CLUBS]: <Club className="w-full h-full text-zinc-900 fill-zinc-900" />,
  [Suit.SPADES]: <Spade className="w-full h-full text-zinc-900 fill-zinc-900" />,
};

const PlayingCard = ({ 
  card, 
  isFaceUp = true, 
  onClick, 
  isPlayable = false,
  className = "" 
}: { 
  card?: Card, 
  isFaceUp?: boolean, 
  onClick?: () => void,
  isPlayable?: boolean,
  className?: string,
  key?: React.Key
}) => {
  return (
    <motion.div
      layout
      whileHover={isPlayable ? { y: -20, scale: 1.05 } : {}}
      onClick={onClick}
      className={`relative w-24 h-36 sm:w-32 sm:h-48 rounded-xl cursor-pointer transition-all duration-300 flex-shrink-0 card-shadow ${
        isPlayable ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-transparent' : ''
      } ${className}`}
    >
      <div className={`w-full h-full rounded-xl border-2 border-white/10 overflow-hidden ${
        isFaceUp ? 'bg-white text-zinc-900' : 'bg-blue-800'
      }`}>
        {isFaceUp && card ? (
          <div className="p-2 h-full flex flex-col justify-between relative">
            <div className="flex flex-col items-center self-start">
              <span className={`text-lg sm:text-2xl font-bold leading-none ${
                card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS ? 'text-red-500' : 'text-zinc-900'
              }`}>
                {card.rank === Rank.EIGHT ? '🍔' : card.rank}
              </span>
              <div className="w-4 h-4 sm:w-6 sm:h-6 mt-1">
                {SUIT_ICONS[card.suit]}
              </div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 opacity-20">
              {SUIT_ICONS[card.suit]}
            </div>

            <div className="flex flex-col items-center self-end rotate-180">
              <span className={`text-lg sm:text-2xl font-bold leading-none ${
                card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS ? 'text-red-500' : 'text-zinc-900'
              }`}>
                {card.rank === Rank.EIGHT ? '🍔' : card.rank}
              </span>
              <div className="w-4 h-4 sm:w-6 sm:h-6 mt-1">
                {SUIT_ICONS[card.suit]}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="w-full h-full border-4 border-white/20 rounded-lg flex items-center justify-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-white/10 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white/10 rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    discardPile: [],
    playerHand: [],
    aiHand: [],
    currentSuit: null,
    currentTurn: 'player',
    status: 'menu',
    lastAction: 'Welcome! Press Start to play.',
  });

  const initGame = useCallback(() => {
    const deck = createDeck();
    const playerHand = deck.splice(0, 8);
    const aiHand = deck.splice(0, 8);
    
    // Ensure the first discard isn't an 8 for simplicity, or handle it
    let firstDiscard = deck.pop()!;
    while (firstDiscard.rank === Rank.EIGHT) {
      deck.unshift(firstDiscard);
      shuffle(deck);
      firstDiscard = deck.pop()!;
    }

    setGameState({
      deck,
      discardPile: [firstDiscard],
      playerHand,
      aiHand,
      currentSuit: null,
      currentTurn: 'player',
      status: 'playing',
      lastAction: 'Game started! Your turn.',
    });
  }, []);

  // Removed auto-init useEffect to show menu first

  const checkWin = (state: GameState) => {
    if (state.playerHand.length === 0) return 'player_won';
    if (state.aiHand.length === 0) return 'ai_won';
    return null;
  };

  const handleDraw = () => {
    if (gameState.currentTurn !== 'player' || gameState.status !== 'playing') return;

    setGameState(prev => {
      if (prev.deck.length === 0) {
        return { ...prev, currentTurn: 'ai', lastAction: 'Deck empty! Turn skipped.' };
      }
      const newDeck = [...prev.deck];
      const drawnCard = newDeck.pop()!;
      return {
        ...prev,
        deck: newDeck,
        playerHand: [...prev.playerHand, drawnCard],
        currentTurn: 'ai',
        lastAction: 'You drew a card.',
      };
    });
  };

  const handlePlayCard = (card: Card) => {
    if (gameState.currentTurn !== 'player' || gameState.status !== 'playing') return;
    
    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    if (!isPlayable(card, topCard, gameState.currentSuit)) return;

    if (card.rank === Rank.EIGHT) {
      setGameState(prev => ({
        ...prev,
        status: 'suit_selection',
        playerHand: prev.playerHand.filter(c => c.id !== card.id),
        discardPile: [...prev.discardPile, card],
        lastAction: 'You played an 8! Pick a suit.',
      }));
    } else {
      setGameState(prev => {
        const newState = {
          ...prev,
          playerHand: prev.playerHand.filter(c => c.id !== card.id),
          discardPile: [...prev.discardPile, card],
          currentSuit: null,
          currentTurn: 'ai' as const,
          lastAction: `You played ${card.rank} of ${card.suit}.`,
        };
        const winner = checkWin(newState);
        if (winner) newState.status = winner;
        return newState;
      });
    }
  };

  const handleSuitSelect = (suit: Suit) => {
    setGameState(prev => {
      const newState = {
        ...prev,
        currentSuit: suit,
        status: 'playing' as GameStatus,
        currentTurn: 'ai' as const,
        lastAction: `Suit changed to ${suit}. AI's turn.`,
      };
      const winner = checkWin(newState);
      if (winner) newState.status = winner;
      return newState;
    });
  };

  // AI Logic
  useEffect(() => {
    if (gameState.currentTurn === 'ai' && gameState.status === 'playing') {
      const timer = setTimeout(() => {
        setGameState(prev => {
          const topCard = prev.discardPile[prev.discardPile.length - 1];
          const playableCard = prev.aiHand.find(c => isPlayable(c, topCard, prev.currentSuit));

          if (playableCard) {
            const newAiHand = prev.aiHand.filter(c => c.id !== playableCard.id);
            const newDiscardPile = [...prev.discardPile, playableCard];
            
            let newSuit = null;
            let action = `AI played ${playableCard.rank} of ${playableCard.suit}.`;
            
            if (playableCard.rank === Rank.EIGHT) {
              // Simple AI: pick suit it has most of
              const suitCounts = newAiHand.reduce((acc, c) => {
                acc[c.suit] = (acc[c.suit] || 0) + 1;
                return acc;
              }, {} as Record<Suit, number>);
              newSuit = (Object.keys(suitCounts) as Suit[]).sort((a, b) => suitCounts[b] - suitCounts[a])[0] || Suit.HEARTS;
              action = `AI played an 8 and chose ${newSuit}!`;
            }

            const newState = {
              ...prev,
              aiHand: newAiHand,
              discardPile: newDiscardPile,
              currentSuit: newSuit,
              currentTurn: 'player' as const,
              lastAction: action,
            };
            const winner = checkWin(newState);
            if (winner) newState.status = winner;
            return newState;
          } else {
            // AI must draw
            if (prev.deck.length === 0) {
              return { ...prev, currentTurn: 'player', lastAction: 'AI deck empty! AI skipped.' };
            }
            const newDeck = [...prev.deck];
            const drawnCard = newDeck.pop()!;
            return {
              ...prev,
              deck: newDeck,
              aiHand: [...prev.aiHand, drawnCard],
              currentTurn: 'player',
              lastAction: 'AI drew a card.',
            };
          }
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurn, gameState.status]);

  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];

  if (gameState.status === 'menu') {
    return (
      <div className="min-h-screen felt-bg flex flex-col items-center justify-center p-4 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          <div className="mb-12 relative">
            <motion.div 
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-12 -left-12 w-32 h-48 bg-white rounded-xl card-shadow rotate-[-15deg] flex items-center justify-center"
            >
              <span className="text-4xl font-bold">🍔</span>
              <Heart className="absolute top-2 left-2 w-6 h-6 text-red-500 fill-red-500" />
            </motion.div>
            <motion.div 
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -top-8 -right-12 w-32 h-48 bg-white rounded-xl card-shadow rotate-[15deg] flex items-center justify-center"
            >
              <span className="text-4xl font-bold text-zinc-900">A</span>
              <Spade className="absolute top-2 left-2 w-6 h-6 text-zinc-900 fill-zinc-900" />
            </motion.div>
            
            <h1 className="text-6xl sm:text-8xl font-serif italic font-bold text-white tracking-tighter mb-4 drop-shadow-2xl">
              EAT
            </h1>
            <p className="text-white/60 font-mono uppercase tracking-[0.3em] text-sm">
              The Classic Card Game
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={initGame}
              className="w-full max-w-xs py-5 bg-white text-zinc-900 rounded-2xl font-bold text-xl hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center gap-3 mx-auto group"
            >
              Start Game
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                <p className="text-yellow-400 font-bold mb-1">Wild 8s</p>
                <p className="text-xs text-white/50">Play an 8 anytime to change the current suit.</p>
              </div>
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                <p className="text-blue-400 font-bold mb-1">Match Play</p>
                <p className="text-xs text-white/50">Match the rank or suit of the top discard card.</p>
              </div>
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                <p className="text-emerald-400 font-bold mb-1">Win Fast</p>
                <p className="text-xs text-white/50">Be the first to clear all 8 cards from your hand.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen felt-bg flex flex-col items-center justify-between p-4 sm:p-8 select-none">
      {/* Header Info */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-4">
        <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-white/60 font-mono uppercase tracking-wider">Opponent</p>
            <p className="font-bold">{gameState.aiHand.length} Cards</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h1 className="text-2xl sm:text-4xl font-serif italic font-bold text-white/90 tracking-tighter">EAT</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full animate-pulse ${gameState.currentTurn === 'player' ? 'bg-green-400' : 'bg-red-400'}`} />
            <p className="text-xs font-mono uppercase tracking-widest text-white/60">
              {gameState.currentTurn === 'player' ? "Your Turn" : "AI Thinking..."}
            </p>
          </div>
        </div>

        <button 
          onClick={initGame}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/10"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      {/* AI Hand */}
      <div className="relative w-full flex justify-center h-24 sm:h-32">
        <div className="flex -space-x-12 sm:-space-x-16">
          {gameState.aiHand.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <PlayingCard isFaceUp={false} className="scale-75 sm:scale-90" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Table Center */}
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-8 my-8">
        <div className="flex items-center gap-12 sm:gap-24">
          {/* Draw Pile */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-white/5 rounded-2xl blur-xl group-hover:bg-white/10 transition-all" />
            <div className="relative">
              <PlayingCard 
                isFaceUp={false} 
                onClick={handleDraw}
                className={gameState.currentTurn === 'player' ? 'hover:scale-105 active:scale-95' : 'opacity-80'}
              />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                <p className="text-[10px] font-mono uppercase tracking-widest whitespace-nowrap">Draw ({gameState.deck.length})</p>
              </div>
            </div>
          </div>

          {/* Discard Pile */}
          <div className="relative">
            <div className="absolute -inset-4 bg-yellow-400/5 rounded-2xl blur-xl" />
            <div className="relative">
              <AnimatePresence mode="popLayout">
                <PlayingCard 
                  key={topDiscard?.id}
                  card={topDiscard} 
                  className="z-10"
                />
              </AnimatePresence>
              
              {/* Suit Indicator for Wild Cards */}
              {gameState.currentSuit && (
                <motion.div 
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full p-2 shadow-2xl border-2 border-zinc-900 z-20"
                >
                  {SUIT_ICONS[gameState.currentSuit]}
                </motion.div>
              )}

              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                <p className="text-[10px] font-mono uppercase tracking-widest whitespace-nowrap">Discard</p>
              </div>
            </div>
          </div>
        </div>

        {/* Last Action Message */}
        <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 max-w-md text-center">
          <p className="text-sm sm:text-base font-medium text-white/90 italic">
            "{gameState.lastAction}"
          </p>
        </div>
      </div>

      {/* Player Hand */}
      <div className="w-full max-w-6xl flex flex-col items-center gap-6">
        <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 self-start">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-white/60 font-mono uppercase tracking-wider">You</p>
            <p className="font-bold">{gameState.playerHand.length} Cards</p>
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-8 flex justify-center no-scrollbar">
          <div className="flex -space-x-12 sm:-space-x-16 px-12">
            {gameState.playerHand.map((card, i) => {
              const playable = isPlayable(card, topDiscard, gameState.currentSuit) && gameState.currentTurn === 'player';
              return (
                <PlayingCard 
                  key={card.id} 
                  card={card} 
                  isPlayable={playable}
                  onClick={() => playable && handlePlayCard(card)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {gameState.status === 'suit_selection' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1a1c1e] p-8 rounded-3xl border border-white/10 max-w-sm w-full text-center"
            >
              <h2 className="text-2xl font-bold mb-2">Wild Hamburger!</h2>
              <p className="text-white/60 text-sm mb-8">Choose the next suit to play</p>
              
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(SUIT_ICONS).map(([suit, icon]) => (
                  <button
                    key={suit}
                    onClick={() => handleSuitSelect(suit as Suit)}
                    className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group"
                  >
                    <div className="w-12 h-12 group-hover:scale-110 transition-transform">
                      {icon}
                    </div>
                    <span className="text-xs font-mono uppercase tracking-widest">{suit}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {(gameState.status === 'player_won' || gameState.status === 'ai_won') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1a1c1e] p-12 rounded-[2.5rem] border border-white/10 max-w-md w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
              
              <div className="w-20 h-20 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-yellow-400" />
              </div>

              <h2 className="text-4xl font-serif italic font-bold mb-4">
                {gameState.status === 'player_won' ? "you eat hamburger" : "your hamburger has been eat"}
              </h2>
              
              <p className="text-white/60 mb-10 leading-relaxed">
                {gameState.status === 'player_won' 
                  ? "Incredible strategy! You've cleared your hand and won the game." 
                  : "The AI outplayed you this time. Don't give up!"}
              </p>

              <button
                onClick={initGame}
                className="w-full py-4 bg-white text-zinc-900 rounded-2xl font-bold hover:bg-white/90 transition-colors flex items-center justify-center gap-2 group"
              >
                Play Again
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules Info (Optional Overlay) */}
      <div className="fixed bottom-4 right-4 group">
        <div className="bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10 cursor-help">
          <Info className="w-5 h-5 text-white/60" />
        </div>
        <div className="absolute bottom-full right-0 mb-4 w-64 bg-black/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-xs leading-relaxed">
          <p className="font-bold mb-2 uppercase tracking-widest text-white/40">Quick Rules</p>
          <ul className="space-y-2 text-white/70">
            <li>• Match the <span className="text-white">Suit</span> or <span className="text-white">Rank</span> of the top card.</li>
            <li>• <span className="text-yellow-400">Hamburgers are Wild!</span> Play them anytime to change the suit.</li>
            <li>• Draw a card if you have no playable moves.</li>
            <li>• First to empty their hand wins.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
