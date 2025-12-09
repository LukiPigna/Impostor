import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Wand2, EyeOff, Check, Crown, Minus, RotateCcw, Clapperboard, MapPin, Utensils, Box, Cat, Users, Ghost, Fingerprint } from 'lucide-react';
import { GameStage, GameMode, Player, SupportedLanguage, Category } from './types';
import { generateWord } from './services/geminiService';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Logo, downloadAppIcons } from './components/Logo';
import { translations } from './utils/translations';

const MIN_PLAYERS = 3;
const ROUND_TIME_SECONDS = 180; // 3 minutes

// --- HELPERS ---
const getSecureRandomInt = (max: number): number => {
  if (max <= 0) return 0;
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
};

function secureShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const vibrate = (ms: number = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(ms);
    }
};

// --- COMPONENTS ---

// Visual Circular Timer
const CircularTimer = ({ timeLeft, totalTime }: { timeLeft: number, totalTime: number }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const progress = timeLeft / totalTime;
    const dashoffset = circumference * (1 - progress);
    const isLowTime = timeLeft < 30;

    return (
        <div className="relative flex items-center justify-center w-24 h-24 mb-4">
            <svg className="transform -rotate-90 w-full h-full">
                {/* Background Circle */}
                <circle cx="50%" cy="50%" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="transparent" />
                {/* Progress Circle */}
                <circle 
                    cx="50%" cy="50%" r={radius} 
                    stroke={isLowTime ? "#ef4444" : "#6366f1"} 
                    strokeWidth="6" 
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                 <span className={`text-xl font-mono font-black ${isLowTime ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                     {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                 </span>
            </div>
        </div>
    );
};

export default function App() {
  const [stage, setStage] = useState<GameStage>(GameStage.SETUP);
  
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('impostor_players');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('impostor_language');
    return (saved === 'en' || saved === 'es') ? saved : 'es';
  });

  const [newPlayerName, setNewPlayerName] = useState('');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [transitionNextName, setTransitionNextName] = useState<string | null>(null);

  const [secretWord, setSecretWord] = useState<string>('');
  const [impostorIds, setImpostorIds] = useState<string[]>([]);
  
  // Anti-Repetition
  const [previousImpostorIds, setPreviousImpostorIds] = useState<string[]>([]);
  const [impostorStreak, setImpostorStreak] = useState<number>(0);
  // Session Memory for words to prevent repetition
  const [usedWords, setUsedWords] = useState<string[]>([]);

  const [impostorCount, setImpostorCount] = useState(1);
  const [hasPeeked, setHasPeeked] = useState(false);
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [customInputIndex, setCustomInputIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_SECONDS);

  const t = translations[language];

  useEffect(() => {
    localStorage.setItem('impostor_players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('impostor_language', language);
  }, [language]);

  useEffect(() => {
    let interval: number;
    if (stage === GameStage.PLAYING && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stage, timeLeft]);

  // --- ACTIONS ---

  const switchLanguage = (lang: SupportedLanguage) => {
    vibrate();
    setLanguage(lang);
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    vibrate();
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: newPlayerName.trim(),
      isImpostor: false,
    };
    // Add new player to the END of the list (FIFO) to preserve seating order
    setPlayers(prev => [...prev, newPlayer]);
    setNewPlayerName('');
  };

  const removePlayer = (id: string) => {
    vibrate();
    setPlayers(prev => {
        const newPlayers = prev.filter(p => p.id !== id);
        const maxImpostors = Math.max(1, Math.floor(newPlayers.length / 2));
        if (impostorCount > maxImpostors && newPlayers.length >= MIN_PLAYERS) {
             setImpostorCount(maxImpostors);
        } else if (newPlayers.length < MIN_PLAYERS) {
             setImpostorCount(1);
        }
        return newPlayers;
    });
  };

  const updateImpostorCount = (increment: number) => {
    vibrate();
    setImpostorCount(prev => {
        const max = Math.max(1, Math.floor(players.length / 2));
        const newValue = prev + increment;
        return Math.min(Math.max(1, newValue), max);
    });
  };

  const startGameSetup = () => {
    vibrate();
    if (players.length < MIN_PLAYERS) return;
    setStage(GameStage.MODE_SELECT);
  };

  const handleModeSelection = (mode: GameMode) => {
    vibrate();
    if (mode === GameMode.AI) {
      setStage(GameStage.CATEGORY_SELECT);
    } else if (mode === GameMode.AMONG_US) {
      prepareGameLogic(GameMode.AMONG_US);
    } else {
      prepareGameLogic(GameMode.CUSTOM);
    }
  };

  const prepareGameLogic = async (mode: GameMode, category?: Category) => {
    setIsLoading(true);
    
    // 1. Maintain Turn Order: Use the players array exactly as entered.
    // We clone it to avoid mutation issues, but we DO NOT SHUFFLE.
    // This respects the user's "seating order".
    const turnOrderPlayers: Player[] = [...players];

    // 2. Select Impostors randomly within the fixed order.
    // Create an array of indices [0, 1, 2, ... n]
    const indices = Array.from({ length: turnOrderPlayers.length }, (_, i) => i);
    // Shuffle only the indices to pick random positions for impostors
    const shuffledIndices = secureShuffle(indices);
    // Take the first N indices as candidates
    let selectedIndices = shuffledIndices.slice(0, impostorCount);

    // Anti-Repetition Logic for Impostor Role
    if (impostorCount === 1 && previousImpostorIds.length === 1) {
        const candidateId = turnOrderPlayers[selectedIndices[0]].id;
        const lastImpostorId = previousImpostorIds[0];

        if (candidateId === lastImpostorId) {
            let shouldSwap = false;
            // Force swap if streak >= 2, otherwise 60% chance
            if (impostorStreak >= 2) {
                shouldSwap = true;
            } else {
                const chance = getSecureRandomInt(100);
                if (chance < 60) shouldSwap = true;
            }

            if (shouldSwap && turnOrderPlayers.length > 1) {
                // Pick the next available random index that wasn't selected
                // shuffledIndices[1] is a different random index
                selectedIndices = [shuffledIndices[1]];
            }
        }
    }

    // Map selected indices back to Player IDs
    const newImpostorIds = selectedIndices.map(idx => turnOrderPlayers[idx].id);
    
    // Update streak logic
    const isSameAsLast = (impostorCount === 1 && 
                          previousImpostorIds.length === 1 && 
                          newImpostorIds[0] === previousImpostorIds[0]);
    
    setImpostorStreak(isSameAsLast ? prev => prev + 1 : 1);
    setPreviousImpostorIds(newImpostorIds);
    setImpostorIds(newImpostorIds);
    
    // Apply roles to the FIXED order array
    const updatedPlayers = turnOrderPlayers.map(p => ({
      ...p,
      isImpostor: newImpostorIds.includes(p.id)
    }));
    setPlayers(updatedPlayers);

    // Select who starts discussing (Randomly, but referencing the fixed list)
    const startIdx = getSecureRandomInt(updatedPlayers.length);
    setStartingPlayerIndex(startIdx);
    
    setCurrentPlayerIndex(0);
    setTransitionNextName(null);
    setTimeLeft(ROUND_TIME_SECONDS);

    if (mode === GameMode.AI && category) {
      setStage(GameStage.LOADING_AI);
      // Pass the usedWords history to the generator to avoid repetition
      const word = await generateWord(category, language, usedWords);
      setSecretWord(word);
      // Add the new word to history
      setUsedWords(prev => [...prev, word]);
      setStage(GameStage.DISTRIBUTE);
    } else if (mode === GameMode.AMONG_US) {
       // Secret word is a random player name
       const randomIdx = getSecureRandomInt(updatedPlayers.length);
       setSecretWord(updatedPlayers[randomIdx].name);
       setStage(GameStage.DISTRIBUTE);
    } else {
      setCustomWords([]);
      setCustomInputIndex(0);
      setStage(GameStage.CUSTOM_INPUT);
    }
    setIsLoading(false);
  };

  const handleCustomWordSubmit = (word: string) => {
    vibrate();
    if (!word.trim()) return;
    const newWords = [...customWords, word.trim()];
    setCustomWords(newWords);

    if (customInputIndex < players.length - 1) {
      setCustomInputIndex(prev => prev + 1);
    } else {
      const validWords = newWords.filter(w => w.length > 0);
      const pickedIndex = getSecureRandomInt(validWords.length);
      setSecretWord(validWords[pickedIndex]);
      setStage(GameStage.DISTRIBUTE);
    }
  };

  const handleNextPlayer = () => {
    vibrate();
    const nextIdx = currentPlayerIndex + 1;
    if (nextIdx < players.length) {
      setTransitionNextName(players[nextIdx].name);
    } else {
      setTransitionNextName(null);
    }

    setHasPeeked(false);
    
    setTimeout(() => {
      if (currentPlayerIndex < players.length - 1) {
        setCurrentPlayerIndex(prev => prev + 1);
        setTransitionNextName(null);
      } else {
        setStage(GameStage.PLAYING);
        setTransitionNextName(null);
      }
    }, 400); 
  };

  const resetGame = () => {
    vibrate();
    setStage(GameStage.SETUP);
    setPlayers(players.map(p => ({ ...p, isImpostor: false, word: undefined })));
    setSecretWord('');
    setImpostorIds([]);
    setCurrentPlayerIndex(0);
    setTransitionNextName(null);
    setHasPeeked(false);
    setStartingPlayerIndex(0);
    // We intentionally DO NOT clear setUsedWords here so history persists 
    // if they play another round immediately.
  };

  // --- RENDERERS ---

  const LanguageSwitcher = () => (
    <div className="flex bg-black/20 backdrop-blur-md rounded-lg p-1 border border-white/5">
      <button 
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1.5 rounded text-xs font-bold transition-all duration-200 ${language === 'en' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
      >
        EN
      </button>
      <button 
        onClick={() => switchLanguage('es')}
        className={`px-3 py-1.5 rounded text-xs font-bold transition-all duration-200 ${language === 'es' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
      >
        ES
      </button>
    </div>
  );

  const renderSetup = () => {
    const maxImpostors = Math.max(1, Math.floor(players.length / 2));
    
    return (
      <div className="max-w-md mx-auto w-full space-y-6 animate-slide-up relative min-h-full flex flex-col justify-center pb-4">
        <div className="absolute top-0 right-0 z-20">
           <LanguageSwitcher />
        </div>
        
        <div className="text-center pt-2 flex flex-col items-center justify-center shrink-0">
          <Logo className="w-44 h-auto drop-shadow-[0_0_25px_rgba(99,102,241,0.5)] mx-auto mb-2" />
          <p className="text-gray-400 text-sm font-medium tracking-wide">{t.setupSubtitle}</p>
        </div>

        <div className="space-y-4 bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
              placeholder={t.enterName}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-gray-500 transition-all"
            />
            <Button onClick={addPlayer} disabled={!newPlayerName.trim()} className="aspect-square !px-0 flex items-center justify-center w-[50px]">
              <Plus size={24} />
            </Button>
          </div>
          
          {/* Order instruction hint */}
          <div className="text-center">
             <p className="text-[10px] text-indigo-300/80 font-bold uppercase tracking-wider">{t.addInOrder}</p>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar min-h-[120px]">
            {players.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500/50">
                  <Users size={32} className="mb-2 opacity-50"/>
                  <p className="text-sm italic">{t.noPlayers}</p>
              </div>
            )}
            {players.map((player, idx) => (
              <div 
                key={player.id} 
                className="flex justify-between items-center bg-white/5 p-3.5 rounded-xl border border-white/5 animate-slide-up hover:bg-white/10 transition-colors group"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] flex items-center justify-center font-bold border border-indigo-500/30">
                        {idx + 1}
                    </span>
                    <span className="font-semibold text-gray-200">{player.name}</span>
                </div>
                <button 
                  onClick={() => removePlayer(player.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-white/5"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {players.length >= MIN_PLAYERS && (
             <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5 mt-4 animate-slide-up delay-200">
                <div className="flex flex-col">
                    <span className="text-white font-bold text-sm">{t.numImpostors}</span>
                    <span className="text-indigo-300 text-xs font-medium">{t.recommended}: {Math.ceil(players.length / 5)}</span>
                </div>
                <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1.5 border border-white/5">
                   <button 
                     onClick={() => updateImpostorCount(-1)}
                     disabled={impostorCount <= 1}
                     className="p-2 hover:bg-white/10 rounded-lg text-indigo-400 disabled:text-gray-700 disabled:cursor-not-allowed transition-colors"
                   >
                     <Minus size={16} />
                   </button>
                   <span className="font-black text-lg w-6 text-center text-white">{impostorCount}</span>
                   <button 
                      onClick={() => updateImpostorCount(1)}
                      disabled={impostorCount >= maxImpostors}
                      className="p-2 hover:bg-white/10 rounded-lg text-indigo-400 disabled:text-gray-700 disabled:cursor-not-allowed transition-colors"
                   >
                     <Plus size={16} />
                   </button>
                </div>
             </div>
          )}
        </div>

        <div className="space-y-3 shrink-0 animate-slide-up delay-300">
          <Button 
            fullWidth 
            onClick={startGameSetup} 
            disabled={players.length < MIN_PLAYERS}
            className="text-lg shadow-xl shadow-indigo-900/20"
          >
            {players.length < MIN_PLAYERS ? t.needMore : t.continue}
          </Button>
          <p className="text-center text-xs text-gray-500 font-medium">
            {t.minPlayers}
          </p>
        </div>
      </div>
    );
  };

  const renderModeSelect = () => (
    <div className="max-w-md mx-auto w-full space-y-5 text-center animate-slide-up pt-6">
       <div className="flex justify-between items-center px-2 mb-4">
         <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{t.chooseMode}</h2>
         <LanguageSwitcher />
       </div>
       
       {[
         { mode: GameMode.AI, icon: <Wand2 size={24} />, color: "text-violet-400", bg: "from-violet-500/10 to-purple-900/10", border: "hover:border-violet-500/50", label: t.modeAi, desc: t.modeAiDesc },
         { mode: GameMode.AMONG_US, icon: <Ghost size={24} />, color: "text-red-400", bg: "from-red-500/10 to-orange-900/10", border: "hover:border-red-500/50", label: t.modeAmongUs, desc: t.modeAmongUsDesc },
         { mode: GameMode.CUSTOM, icon: <Users size={24} />, color: "text-indigo-400", bg: "from-indigo-500/10 to-blue-900/10", border: "hover:border-indigo-500/50", label: t.modeCustom, desc: t.modeCustomDesc },
       ].map((item, idx) => (
         <button 
          key={item.label}
          onClick={() => handleModeSelection(item.mode)}
          disabled={isLoading}
          className={`w-full bg-gradient-to-br ${item.bg} backdrop-blur-md p-6 rounded-3xl border border-white/10 ${item.border} transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group text-left relative overflow-hidden animate-slide-up shadow-lg`}
          style={{ animationDelay: `${(idx + 1) * 100}ms` }}
         >
           <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity rotate-12 ${item.color}`}>
             {React.cloneElement(item.icon as React.ReactElement<any>, { size: 80 })}
           </div>
           <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
              <span className={`p-2 rounded-xl bg-white/5 ${item.color}`}>{item.icon}</span>
              {item.label}
           </h3>
           <p className="text-gray-400 text-sm leading-relaxed pr-12 font-medium opacity-80">
             {item.desc}
           </p>
         </button>
       ))}

       <div className="pt-4 animate-slide-up delay-300">
          <Button variant="ghost" onClick={() => setStage(GameStage.SETUP)}>{t.back}</Button>
       </div>
    </div>
  );

  const renderCategorySelect = () => {
    const categories: {id: Category, icon: React.ReactNode, label: string, color: string}[] = [
      { id: 'FAMOUS', icon: <Crown size={28} />, label: t.categories.FAMOUS, color: "text-amber-400" },
      { id: 'ANIMALS', icon: <Cat size={28} />, label: t.categories.ANIMALS, color: "text-emerald-400" },
      { id: 'MOVIES', icon: <Clapperboard size={28} />, label: t.categories.MOVIES, color: "text-red-400" },
      { id: 'PLACES', icon: <MapPin size={28} />, label: t.categories.PLACES, color: "text-sky-400" },
      { id: 'FOOD', icon: <Utensils size={28} />, label: t.categories.FOOD, color: "text-orange-400" },
      { id: 'OBJECTS', icon: <Box size={28} />, label: t.categories.OBJECTS, color: "text-purple-400" },
    ];

    return (
      <div className="max-w-md mx-auto w-full space-y-6 animate-slide-up pt-6">
        <h2 className="text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">{t.categories.title}</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat, idx) => (
            <button
              key={cat.id}
              onClick={() => { vibrate(); prepareGameLogic(GameMode.AI, cat.id); }}
              className="bg-white/5 backdrop-blur-md hover:bg-white/10 border border-white/10 hover:border-indigo-500/50 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:scale-[1.03] active:scale-95 animate-slide-up shadow-lg"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className={`${cat.color} drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>{cat.icon}</div>
              <span className="font-bold text-gray-200 text-sm tracking-wide">{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="pt-8 animate-slide-up delay-300">
          <Button variant="ghost" fullWidth onClick={() => setStage(GameStage.MODE_SELECT)}>{t.back}</Button>
        </div>
      </div>
    );
  };

  const renderCustomInput = () => {
    const currentPlayer = players[customInputIndex];
    return (
      <div className="max-w-md mx-auto w-full space-y-8 animate-slide-up pt-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-indigo-400">{t.passPhone(currentPlayer.name)}</h2>
          <p className="text-gray-400 font-medium">{t.hideInput}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
          <label className="block text-xs uppercase font-bold text-gray-500 tracking-wider mb-3">{t.writeName}</label>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const val = formData.get('word') as string;
              if (val) {
                handleCustomWordSubmit(val);
                e.currentTarget.reset();
              }
            }}
          >
            <input 
              name="word"
              autoFocus
              autoComplete="off"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-5 text-center text-2xl font-bold text-white mb-8 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-gray-700"
              placeholder="..."
            />
            <Button fullWidth type="submit" className="text-lg shadow-lg shadow-indigo-500/20">{t.submitPass}</Button>
          </form>
        </div>
        <div className="text-center text-xs text-gray-500 font-mono">
          {t.playerCount(customInputIndex + 1, players.length)}
        </div>
      </div>
    );
  };

  const renderDistribute = () => {
    const player = players[currentPlayerIndex];
    const isCurrentUserImpostor = impostorIds.includes(player.id);
    const displayNextName = transitionNextName;

    const cardBackContent = (
      <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in select-none w-full">
        {isCurrentUserImpostor ? (
          <>
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <EyeOff size={48} />
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-red-500 uppercase tracking-[0.2em]">{t.impostorRole}</h2>
                <div className="h-0.5 w-16 bg-red-500/50 mx-auto"></div>
            </div>
            <p className="text-gray-300 font-medium">{t.impostorDesc}</p>
            <div className="px-6 py-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 text-sm font-bold animate-pulse">
              {t.blendIn}
            </div>
          </>
        ) : (
          <>
             <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <Check size={48} />
            </div>
            <h3 className="text-gray-400 font-bold uppercase text-xs tracking-[0.3em]">{t.secretWordIs}</h3>
            <div className="bg-white/5 w-full py-6 rounded-xl border border-white/5 backdrop-blur-sm">
                <h2 className="text-3xl font-black text-white break-words w-full px-4 leading-tight">{secretWord}</h2>
            </div>
            <div className="px-6 py-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 text-sm font-bold">
              {t.findImpostor}
            </div>
          </>
        )}
      </div>
    );

    const cardFrontContent = (
      <div className="flex flex-col items-center justify-center space-y-8 w-full">
        <div className="relative">
             <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full"></div>
             <Fingerprint size={140} className="text-white/90 relative z-10" strokeWidth={1} />
        </div>
        <div className="text-center space-y-2">
            <h3 className="text-3xl font-black text-white drop-shadow-xl px-4 leading-tight">
                {transitionNextName ? t.passPhone(transitionNextName) : (player ? t.passPhone(player.name) : t.allReady)}
            </h3>
            {/* Note: Instructions are now passed via hintText prop to Card */}
        </div>
      </div>
    );

    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="w-full text-center mb-8">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">
            {t.playerCount(currentPlayerIndex + 1, players.length)}
          </p>
        </div>
        
        <div className="mb-10 w-full flex justify-center">
            <Card 
                onReveal={() => setHasPeeked(true)}
                isResetting={!!transitionNextName} 
                frontContent={cardFrontContent}
                backContent={cardBackContent}
                hintText={t.tapToReveal}
            />
        </div>

        <div className="h-16 w-full max-w-xs flex items-center justify-center transition-opacity duration-300">
            {hasPeeked ? (
                 <Button 
                    fullWidth 
                    onClick={handleNextPlayer}
                    className="animate-slide-up text-lg py-4 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                 >
                    {currentPlayerIndex < players.length - 1 ? t.nextPlayer : t.startGame}
                 </Button>
            ) : (
                <p className="text-gray-500 text-sm font-medium animate-pulse flex items-center gap-2">
                     {!transitionNextName && player ? (
                        <>
                         <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                         {t.waitingFor(player.name)}
                        </>
                     ) : ""}
                </p>
            )}
        </div>
      </div>
    );
  };

  const renderPlaying = () => {
    const startingPlayer = players[startingPlayerIndex];
    
    return (
      <div className="max-w-md mx-auto w-full text-center space-y-8 animate-slide-up pt-6">
          <CircularTimer timeLeft={timeLeft} totalTime={ROUND_TIME_SECONDS} />

          <div className="space-y-4">
              <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 drop-shadow-sm">{t.discuss}</h2>
              <p className="text-lg text-indigo-200 font-medium">{t.discussDesc(impostorCount)}</p>
          </div>

          {/* Spotlight Effect for First Player */}
          <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
              <div className="relative bg-black/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10 flex flex-col items-center gap-3">
                  <div className="px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                     <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                       <Crown size={12} /> {t.firstPlayer}
                     </p>
                  </div>
                  <div className="text-3xl font-black text-white tracking-wide">
                      {startingPlayer?.name}
                  </div>
                  <p className="text-gray-400 text-sm">{t.startsRound}</p>
              </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/5 text-left space-y-4 animate-slide-up delay-200">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2 border-b border-white/5 pb-2">{t.alivePlayers}</h3>
              <div className="flex flex-wrap gap-2">
                  {players.map(p => (
                      <span key={p.id} className="bg-white/5 px-4 py-2 rounded-lg text-gray-200 text-sm font-semibold border border-white/5">
                          {p.name}
                      </span>
                  ))}
              </div>
          </div>

          <Button variant="danger" fullWidth onClick={() => setStage(GameStage.REVEAL)} className="py-4 text-lg animate-slide-up delay-300 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              {t.revealBtn(impostorCount)}
          </Button>
      </div>
    );
  };

  const renderReveal = () => (
    <div className="max-w-md mx-auto w-full text-center space-y-8 animate-slide-up pt-10">
        <div className="space-y-4">
            <h2 className="text-4xl font-black text-white tracking-tight">{t.gameOver}</h2>
            
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4">{t.secretWas}</p>
                <div className="text-4xl font-black text-indigo-400 break-words drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                    {secretWord}
                </div>
            </div>
        </div>

        <div className="space-y-3">
            {players.map((p, idx) => (
                <div 
                    key={p.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border backdrop-blur-sm animate-slide-up transition-all ${
                        p.isImpostor 
                        ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                        : 'bg-white/5 border-white/5'
                    }`}
                    style={{ animationDelay: `${idx * 150}ms` }}
                >
                    <span className={`font-bold text-lg ${p.isImpostor ? 'text-white' : 'text-gray-300'}`}>
                        {p.name}
                    </span>
                    {p.isImpostor ? (
                        <div className="px-3 py-1 bg-red-500/20 rounded-lg border border-red-500/30">
                            <span className="text-red-400 font-black uppercase tracking-wider text-[10px] flex items-center gap-1">
                                <EyeOff size={12} /> {t.impostorRole}
                            </span>
                        </div>
                    ) : (
                        <span className="text-emerald-400/50 font-bold text-sm flex items-center gap-2">
                            {t.crewmate}
                        </span>
                    )}
                </div>
            ))}
        </div>

        <Button fullWidth onClick={resetGame} className="py-4 gap-3 flex items-center justify-center animate-slide-up delay-300 text-lg">
            <RotateCcw size={22} /> {t.playAgain}
        </Button>
    </div>
  );

  return (
    <div className="h-[100dvh] text-gray-100 flex flex-col overflow-hidden relative">
      <main className="flex-grow overflow-y-auto p-5 flex flex-col items-center custom-scrollbar z-10">
        <div className="w-full max-w-md my-auto">
            {stage === GameStage.SETUP && renderSetup()}
            {stage === GameStage.MODE_SELECT && renderModeSelect()}
            {stage === GameStage.CATEGORY_SELECT && renderCategorySelect()}
            {stage === GameStage.CUSTOM_INPUT && renderCustomInput()}
            {stage === GameStage.LOADING_AI && (
                <div className="text-center space-y-6 animate-pulse flex flex-col items-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-30 animate-pulse"></div>
                        <Wand2 size={64} className="text-indigo-400 relative z-10 animate-bounce-slow" />
                    </div>
                    <p className="text-xl font-bold text-indigo-300 tracking-widest uppercase text-sm">{t.summoning}</p>
                </div>
            )}
            {stage === GameStage.DISTRIBUTE && renderDistribute()}
            {stage === GameStage.PLAYING && renderPlaying()}
            {stage === GameStage.REVEAL && renderReveal()}
        </div>
      </main>

      <footer className="flex-shrink-0 w-full p-4 text-center z-10 relative bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-[10px] text-gray-500 cursor-default font-medium tracking-wide uppercase opacity-60">
            © {new Date().getFullYear()} Created by <span className="font-bold text-gray-400">Lucas Pignataro</span>
          </p>
      </footer>
    </div>
  );
}