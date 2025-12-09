import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Wand2, EyeOff, Check, Crown, Minus, RotateCcw, Clapperboard, MapPin, Utensils, Box, Cat, Users, Timer, Ghost, Fingerprint } from 'lucide-react';
import { GameStage, GameMode, Player, SupportedLanguage, Category } from './types';
import { generateWord } from './services/geminiService';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Logo, downloadAppIcons } from './components/Logo';
import { translations } from './utils/translations';

const MIN_PLAYERS = 3;
const ROUND_TIME_SECONDS = 180; // 3 minutes

// --- CRYPTO RANDOM HELPERS ---
const getSecureRandomInt = (max: number): number => {
  if (max <= 0) return 0;
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
};

// True Fisher-Yates Shuffle using Crypto Randomness
function secureShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
// -----------------------------

export default function App() {
  // State initialization with Lazy Initializers for LocalStorage
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
  // State to hold the name of the NEXT player instantly during card transition
  const [transitionNextName, setTransitionNextName] = useState<string | null>(null);

  const [secretWord, setSecretWord] = useState<string>('');
  const [impostorIds, setImpostorIds] = useState<string[]>([]);
  
  // Anti-Repetition State
  const [previousImpostorIds, setPreviousImpostorIds] = useState<string[]>([]);
  const [impostorStreak, setImpostorStreak] = useState<number>(0);

  const [impostorCount, setImpostorCount] = useState(1);
  const [hasPeeked, setHasPeeked] = useState(false); // Replaces isCardFlipped
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [customInputIndex, setCustomInputIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_SECONDS);

  const t = translations[language];

  // --- Effects ---

  // Persist Players
  useEffect(() => {
    localStorage.setItem('impostor_players', JSON.stringify(players));
  }, [players]);

  // Persist Language
  useEffect(() => {
    localStorage.setItem('impostor_language', language);
  }, [language]);

  // Timer Logic
  useEffect(() => {
    let interval: number;
    if (stage === GameStage.PLAYING && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stage, timeLeft]);

  // --- Actions ---

  const switchLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: newPlayerName.trim(),
      isImpostor: false,
    };
    // NEW LOGIC: Add new player to the BEGINNING of the array (LIFO)
    setPlayers(prev => [newPlayer, ...prev]);
    setNewPlayerName('');
  };

  const removePlayer = (id: string) => {
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
    setImpostorCount(prev => {
        const max = Math.max(1, Math.floor(players.length / 2));
        const newValue = prev + increment;
        return Math.min(Math.max(1, newValue), max);
    });
  };

  const startGameSetup = () => {
    if (players.length < MIN_PLAYERS) return;
    setStage(GameStage.MODE_SELECT);
  };

  const handleModeSelection = (mode: GameMode) => {
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
    
    // 1. STRATEGIC SHUFFLE: Shuffle the PLAYERS array itself first.
    // This ensures the phone passing order is completely random every game.
    const shuffledGamePlayers: Player[] = secureShuffle(players);
    
    // 2. Select Candidates for Impostor from the shuffled list
    let selectedCandidates: Player[] = shuffledGamePlayers.slice(0, impostorCount);

    // 3. Anti-Repetition Logic (Improved)
    // Only applies if single impostor (90% of games)
    if (impostorCount === 1 && previousImpostorIds.length === 1) {
        const candidate = selectedCandidates[0];
        const lastImpostorId = previousImpostorIds[0];

        if (candidate && candidate.id === lastImpostorId) {
            let shouldSwap = false;

            if (impostorStreak >= 2) {
                // STRICT RULE: If streak is 2 (this would be the 3rd time), FORCE SWAP.
                shouldSwap = true;
                console.log("Anti-Streak: Force Swap triggered (3rd time prevented)");
            } else {
                // SOFT RULE: If streak is 1 (this would be the 2nd time), 60% chance to swap.
                const chance = getSecureRandomInt(100);
                if (chance < 60) { // 60% chance to swap
                     shouldSwap = true;
                     console.log("Anti-Streak: Soft Swap triggered");
                }
            }

            // Perform the swap if needed
            if (shouldSwap && shuffledGamePlayers.length > 1) {
                // Pick the next person in the shuffled list
                selectedCandidates = [shuffledGamePlayers[1]];
            }
        }
    }

    const newImpostorIds = selectedCandidates.map(p => p.id);
    
    // Update Streak State
    const isSameAsLast = (impostorCount === 1 && 
                          previousImpostorIds.length === 1 && 
                          newImpostorIds[0] === previousImpostorIds[0]);
    
    if (isSameAsLast) {
        setImpostorStreak(prev => prev + 1);
    } else {
        setImpostorStreak(1);
    }
    setPreviousImpostorIds(newImpostorIds);
    setImpostorIds(newImpostorIds);
    
    // 4. Assign Roles & Update Main Player State
    // We update the main state with the SHUFFLED list so the UI reflects the new passing order.
    const updatedPlayers = shuffledGamePlayers.map(p => ({
      ...p,
      isImpostor: newImpostorIds.includes(p.id)
    }));
    setPlayers(updatedPlayers);

    // 5. Select starting player for DISCUSSION (Crypto Random)
    // This is independent of the passing order, adding another layer of strategy.
    const startIdx = getSecureRandomInt(updatedPlayers.length);
    setStartingPlayerIndex(startIdx);
    
    setCurrentPlayerIndex(0);
    setTransitionNextName(null);
    setTimeLeft(ROUND_TIME_SECONDS);

    if (mode === GameMode.AI && category) {
      setStage(GameStage.LOADING_AI);
      const word = await generateWord(category, language);
      setSecretWord(word);
      setStage(GameStage.DISTRIBUTE);
    } else if (mode === GameMode.AMONG_US) {
       // Pick a random player as the secret (Secure Random)
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
    if (!word.trim()) return;
    const newWords = [...customWords, word.trim()];
    setCustomWords(newWords);

    if (customInputIndex < players.length - 1) {
      setCustomInputIndex(prev => prev + 1);
    } else {
      // Securely pick one word
      const validWords = newWords.filter(w => w.length > 0);
      const pickedIndex = getSecureRandomInt(validWords.length);
      setSecretWord(validWords[pickedIndex]);
      setStage(GameStage.DISTRIBUTE);
    }
  };

  const handleNextPlayer = () => {
    const nextIdx = currentPlayerIndex + 1;
    if (nextIdx < players.length) {
      setTransitionNextName(players[nextIdx].name);
    } else {
      setTransitionNextName(null);
    }

    setHasPeeked(false);
    
    // Smooth transition: Wait for UI update before index swap
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
    setStage(GameStage.SETUP);
    setPlayers(players.map(p => ({ ...p, isImpostor: false, word: undefined })));
    setSecretWord('');
    setImpostorIds([]);
    setCurrentPlayerIndex(0);
    setTransitionNextName(null);
    setHasPeeked(false);
    setStartingPlayerIndex(0);
    // Note: previousImpostorIds & streak persist
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Render Components ---

  const LanguageSwitcher = () => (
    <div className="flex bg-game-card rounded-lg p-1 border border-white/5 shadow-lg">
      <button 
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1.5 rounded text-xs font-bold transition-all duration-200 ${language === 'en' ? 'bg-game-primary text-game-dark shadow-sm' : 'text-gray-400 hover:text-white'}`}
      >
        EN
      </button>
      <button 
        onClick={() => switchLanguage('es')}
        className={`px-3 py-1.5 rounded text-xs font-bold transition-all duration-200 ${language === 'es' ? 'bg-game-primary text-game-dark shadow-sm' : 'text-gray-400 hover:text-white'}`}
      >
        ES
      </button>
    </div>
  );

  const renderSetup = () => {
    const maxImpostors = Math.max(1, Math.floor(players.length / 2));
    
    return (
      <div className="max-w-md mx-auto w-full space-y-4 animate-slide-up relative min-h-full flex flex-col justify-center pb-4">
        <div className="absolute top-0 right-0 z-10">
           <LanguageSwitcher />
        </div>
        
        {/* Logo centered */}
        <div className="text-center pt-2 flex justify-center shrink-0">
          <Logo className="w-44 h-auto drop-shadow-2xl mx-auto" />
        </div>
        <p className="text-gray-400 text-center -mt-2 text-sm shrink-0">{t.setupSubtitle}</p>

        <div className="space-y-4 bg-game-card p-5 rounded-2xl border border-white/5 shadow-xl shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
              placeholder={t.enterName}
              className="flex-1 bg-game-dark border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-game-primary text-white placeholder-gray-600 transition-colors"
            />
            <Button onClick={addPlayer} disabled={!newPlayerName.trim()} className="px-4">
              <Plus size={24} />
            </Button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar min-h-[100px]">
            {players.length === 0 && (
              <p className="text-center text-gray-600 py-8 italic text-sm">{t.noPlayers}</p>
            )}
            {players.map((player, idx) => (
              <div 
                key={player.id} 
                className="flex justify-between items-center bg-game-dark/50 p-3 rounded-lg border border-white/5 animate-slide-up hover:bg-game-dark/80 transition-colors"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <span className="font-medium text-gray-200">{player.name}</span>
                <button 
                  onClick={() => removePlayer(player.id)}
                  className="text-gray-500 hover:text-game-danger transition-colors p-1 rounded-md hover:bg-white/5"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Impostor Count */}
          {players.length >= MIN_PLAYERS && (
             <div className="flex items-center justify-between bg-game-dark/30 p-3 rounded-xl border border-white/5 mt-2 animate-slide-up delay-200">
                <div className="flex flex-col">
                    <span className="text-gray-200 font-bold text-sm">{t.numImpostors}</span>
                    <span className="text-gray-500 text-xs">{t.recommended}: {Math.ceil(players.length / 5)}</span>
                </div>
                <div className="flex items-center gap-4 bg-game-dark rounded-lg p-1 border border-white/5">
                   <button 
                     onClick={() => updateImpostorCount(-1)}
                     disabled={impostorCount <= 1}
                     className="p-1.5 hover:bg-white/10 rounded-md text-game-primary disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                   >
                     <Minus size={16} />
                   </button>
                   <span className="font-bold text-lg w-4 text-center text-white">{impostorCount}</span>
                   <button 
                      onClick={() => updateImpostorCount(1)}
                      disabled={impostorCount >= maxImpostors}
                      className="p-1.5 hover:bg-white/10 rounded-md text-game-primary disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
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
            className="text-lg py-4"
          >
            {players.length < MIN_PLAYERS ? t.needMore : t.continue}
          </Button>
          <p className="text-center text-xs text-gray-500">
            {t.minPlayers}
          </p>
        </div>
      </div>
    );
  };

  const renderModeSelect = () => (
    <div className="max-w-md mx-auto w-full space-y-4 text-center animate-slide-up pt-6">
       <div className="flex justify-between items-center px-2 mb-2">
         <h2 className="text-3xl font-black text-white">{t.chooseMode}</h2>
         <LanguageSwitcher />
       </div>
       
       {/* AI Mode */}
       <button 
        onClick={() => handleModeSelection(GameMode.AI)}
        disabled={isLoading}
        className="w-full bg-gradient-to-br from-purple-900/50 to-indigo-900/50 p-5 rounded-2xl border border-white/10 hover:border-game-accent hover:bg-white/5 transition-all hover:scale-[1.02] group text-left relative overflow-hidden animate-slide-up delay-100"
       >
         <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity rotate-12">
           <Wand2 size={70} />
         </div>
         <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <Wand2 size={20} className="text-game-accent"/>
            {t.modeAi}
         </h3>
         <p className="text-gray-400 text-xs leading-relaxed pr-12">
           {t.modeAiDesc}
         </p>
       </button>

       {/* Among Us Mode */}
       <button 
        onClick={() => handleModeSelection(GameMode.AMONG_US)}
        disabled={isLoading}
        className="w-full bg-gradient-to-br from-red-900/40 to-orange-900/40 p-5 rounded-2xl border border-white/10 hover:border-game-danger hover:bg-white/5 transition-all hover:scale-[1.02] group text-left relative overflow-hidden animate-slide-up delay-200"
       >
         <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity rotate-12">
           <Ghost size={70} />
         </div>
         <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <Ghost size={20} className="text-game-danger"/>
            {t.modeAmongUs}
         </h3>
         <p className="text-gray-400 text-xs leading-relaxed pr-12">
           {t.modeAmongUsDesc}
         </p>
       </button>

       {/* Custom Mode */}
       <button 
        onClick={() => handleModeSelection(GameMode.CUSTOM)}
        disabled={isLoading}
        className="w-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-5 rounded-2xl border border-white/10 hover:border-game-primary hover:bg-white/5 transition-all hover:scale-[1.02] group text-left relative overflow-hidden animate-slide-up delay-300"
       >
         <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity rotate-12">
           <Users size={70} />
         </div>
         <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <Users size={20} className="text-game-primary"/>
            {t.modeCustom}
         </h3>
         <p className="text-gray-400 text-xs leading-relaxed pr-12">
           {t.modeCustomDesc}
         </p>
       </button>

       <div className="pt-2 animate-slide-up delay-300">
          <Button variant="ghost" onClick={() => setStage(GameStage.SETUP)}>{t.back}</Button>
       </div>
    </div>
  );

  const renderCategorySelect = () => {
    const categories: {id: Category, icon: React.ReactNode, label: string}[] = [
      { id: 'FAMOUS', icon: <Crown size={24} />, label: t.categories.FAMOUS },
      { id: 'ANIMALS', icon: <Cat size={24} />, label: t.categories.ANIMALS },
      { id: 'MOVIES', icon: <Clapperboard size={24} />, label: t.categories.MOVIES },
      { id: 'PLACES', icon: <MapPin size={24} />, label: t.categories.PLACES },
      { id: 'FOOD', icon: <Utensils size={24} />, label: t.categories.FOOD },
      { id: 'OBJECTS', icon: <Box size={24} />, label: t.categories.OBJECTS },
    ];

    return (
      <div className="max-w-md mx-auto w-full space-y-6 animate-slide-up pt-6">
        <h2 className="text-3xl font-black text-white text-center">{t.categories.title}</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat, idx) => (
            <button
              key={cat.id}
              onClick={() => prepareGameLogic(GameMode.AI, cat.id)}
              className="bg-game-card hover:bg-game-primary/20 border border-white/5 hover:border-game-primary p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 animate-slide-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="text-game-primary">{cat.icon}</div>
              <span className="font-bold text-gray-200">{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="pt-4 animate-slide-up delay-300">
          <Button variant="ghost" fullWidth onClick={() => setStage(GameStage.MODE_SELECT)}>{t.back}</Button>
        </div>
      </div>
    );
  };

  const renderCustomInput = () => {
    const currentPlayer = players[customInputIndex];
    return (
      <div className="max-w-md mx-auto w-full space-y-6 animate-slide-up pt-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-game-primary">{t.passPhone(currentPlayer.name)}</h2>
          <p className="text-gray-400 text-sm">{t.hideInput}</p>
        </div>

        <div className="bg-game-card p-8 rounded-2xl border border-white/10 shadow-2xl">
          <label className="block text-sm text-gray-400 mb-2">{t.writeName}</label>
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
              className="w-full bg-game-dark border border-gray-600 rounded-xl px-4 py-4 text-center text-xl font-bold text-white mb-6 focus:border-game-primary focus:outline-none"
              placeholder="..."
            />
            <Button fullWidth type="submit">{t.submitPass}</Button>
          </form>
        </div>
        <div className="text-center text-xs text-gray-500">
          {t.playerCount(customInputIndex + 1, players.length)}
        </div>
      </div>
    );
  };

  const renderDistribute = () => {
    const player = players[currentPlayerIndex];
    const isCurrentUserImpostor = impostorIds.includes(player.id);
    
    // Check if we are in transition state to show next player name or current
    const displayNextName = transitionNextName;
    const isLastPlayer = currentPlayerIndex >= players.length - 1;

    // Content for the card back (Revealed/Secret Layer)
    const cardBackContent = (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in select-none">
        {isCurrentUserImpostor ? (
          <>
            <div className="w-20 h-20 bg-game-danger/20 rounded-full flex items-center justify-center text-game-danger mb-2">
              <EyeOff size={40} />
            </div>
            <h2 className="text-2xl font-black text-game-danger uppercase tracking-widest">{t.impostorRole}</h2>
            <p className="text-gray-600 text-sm">{t.impostorDesc}</p>
            <div className="px-4 py-2 bg-game-danger/10 rounded-lg text-game-danger text-sm font-bold mt-2">
              {t.blendIn}
            </div>
          </>
        ) : (
          <>
             <div className="w-20 h-20 bg-game-success/20 rounded-full flex items-center justify-center text-game-success mb-2">
              <Check size={40} />
            </div>
            <h3 className="text-gray-500 font-bold uppercase text-xs tracking-widest">{t.secretWordIs}</h3>
            <h2 className="text-3xl font-black text-game-dark mt-2 break-words w-full px-2 leading-tight">{secretWord}</h2>
            <div className="px-4 py-2 bg-game-success/10 rounded-lg text-game-success text-sm font-bold mt-2">
              {t.findImpostor}
            </div>
          </>
        )}
      </div>
    );

    // Content for the card front (Cover Layer)
    const cardFrontContent = (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative animate-pulse opacity-20">
             <Fingerprint size={120} className="text-white" />
        </div>
        <div className="text-center">
            {/* Logic: If we are transitioning, show next name. If not, show current name */}
            <h3 className="text-3xl font-black text-white mb-2 drop-shadow-md">
                {transitionNextName ? t.passPhone(transitionNextName) : (player ? t.passPhone(player.name) : t.allReady)}
            </h3>
            <p className="text-white/70 text-sm uppercase tracking-wider font-bold">{t.tapToReveal}</p>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="w-full text-center mb-6">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
            {t.playerCount(currentPlayerIndex + 1, players.length)}
          </p>
        </div>
        
        <div className="mb-8">
            <Card 
                onReveal={() => setHasPeeked(true)}
                isResetting={!!transitionNextName} // Reset position when moving to next player
                frontContent={cardFrontContent}
                backContent={cardBackContent}
            />
        </div>

        <div className="h-16 w-full max-w-xs flex items-center justify-center transition-opacity duration-300">
            {hasPeeked ? (
                 <Button 
                    fullWidth 
                    onClick={handleNextPlayer}
                    className="animate-slide-up shadow-xl bg-game-primary text-game-dark hover:bg-blue-400 border-none font-black tracking-wide"
                 >
                    {currentPlayerIndex < players.length - 1 ? t.nextPlayer : t.startGame}
                 </Button>
            ) : (
                <p className="text-gray-600 text-sm italic animate-pulse">
                    {/* Show generic waiting text if standard, or nothing if transitioning */}
                     {!transitionNextName && player ? t.waitingFor(player.name) : ""}
                </p>
            )}
        </div>
      </div>
    );
  };

  const renderPlaying = () => {
    const startingPlayer = players[startingPlayerIndex];
    
    return (
      <div className="max-w-md mx-auto w-full text-center space-y-6 animate-slide-up pt-6">
          {/* Timer */}
          <div className="flex justify-center mb-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${timeLeft < 30 ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-game-card border-white/10 text-game-primary'}`}>
              <Timer size={18} className={timeLeft < 30 ? 'animate-pulse' : ''} />
              <span className="font-mono font-bold text-xl">{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="space-y-4">
              <h2 className="text-4xl font-black text-white">{t.discuss}</h2>
              <p className="text-xl text-gray-300">{t.discussDesc(impostorCount)}</p>
          </div>

          <div className="bg-gradient-to-r from-game-primary/20 to-purple-500/20 p-1 rounded-2xl animate-slide-up delay-100">
              <div className="bg-game-dark/90 p-6 rounded-xl border border-game-primary/30 flex flex-col items-center gap-2">
                  <p className="text-game-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Crown size={14} /> {t.firstPlayer}
                  </p>
                  <div className="text-3xl font-black text-white">
                      {startingPlayer?.name}
                  </div>
                  <p className="text-gray-400 text-sm">{t.startsRound}</p>
              </div>
          </div>

          <div className="bg-game-card p-6 rounded-2xl border border-white/5 text-left space-y-3 animate-slide-up delay-200">
              <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">{t.alivePlayers}</h3>
              <div className="flex flex-wrap gap-2">
                  {players.map(p => (
                      <span key={p.id} className="bg-game-dark px-3 py-1.5 rounded-lg text-gray-300 text-sm border border-white/5">
                          {p.name}
                      </span>
                  ))}
              </div>
          </div>

          <Button variant="danger" fullWidth onClick={() => setStage(GameStage.REVEAL)} className="py-4 text-lg animate-slide-up delay-300">
              {t.revealBtn(impostorCount)}
          </Button>
      </div>
    );
  };

  const renderReveal = () => (
    <div className="max-w-md mx-auto w-full text-center space-y-8 animate-slide-up pt-10">
        <div className="space-y-2">
            <h2 className="text-3xl font-black text-white">{t.gameOver}</h2>
            <p className="text-gray-400">{t.secretWas}</p>
            <div className="text-3xl font-bold text-game-primary bg-game-primary/10 py-3 rounded-xl border border-game-primary/20">
                {secretWord}
            </div>
        </div>

        <div className="space-y-3">
            {players.map((p, idx) => (
                <div 
                    key={p.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border animate-slide-up ${
                        p.isImpostor 
                        ? 'bg-game-danger/10 border-game-danger/50' 
                        : 'bg-game-card border-white/5'
                    }`}
                    style={{ animationDelay: `${idx * 100}ms` }}
                >
                    <span className={`font-bold text-lg ${p.isImpostor ? 'text-white' : 'text-gray-300'}`}>
                        {p.name}
                    </span>
                    {p.isImpostor ? (
                        <span className="text-game-danger font-black uppercase tracking-wider text-sm flex items-center gap-2">
                            <EyeOff size={16} /> {t.impostorRole}
                        </span>
                    ) : (
                        <span className="text-game-success font-bold text-sm flex items-center gap-2 opacity-50">
                            {t.crewmate}
                        </span>
                    )}
                </div>
            ))}
        </div>

        <Button fullWidth onClick={resetGame} className="py-4 gap-2 flex items-center justify-center animate-slide-up delay-300">
            <RotateCcw size={20} /> {t.playAgain}
        </Button>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-game-dark text-game-text flex flex-col overflow-hidden">
      <main className="flex-grow overflow-y-auto p-4 flex flex-col items-center custom-scrollbar">
        {/* Wrapper to ensure content centers vertically when short but scrolls when long */}
        <div className="w-full max-w-md my-auto">
            {stage === GameStage.SETUP && renderSetup()}
            {stage === GameStage.MODE_SELECT && renderModeSelect()}
            {stage === GameStage.CATEGORY_SELECT && renderCategorySelect()}
            {stage === GameStage.CUSTOM_INPUT && renderCustomInput()}
            {stage === GameStage.LOADING_AI && (
                <div className="text-center space-y-4 animate-pulse">
                    <div className="w-16 h-16 border-4 border-game-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xl font-bold text-game-primary">{t.summoning}</p>
                </div>
            )}
            {stage === GameStage.DISTRIBUTE && renderDistribute()}
            {stage === GameStage.PLAYING && renderPlaying()}
            {stage === GameStage.REVEAL && renderReveal()}
        </div>
      </main>

      <footer className="flex-shrink-0 w-full p-4 text-center bg-game-dark z-10 relative">
          <p className="text-xs text-white/20 cursor-default">
            © {new Date().getFullYear()} Created by <span className="font-bold">Lucas Pignataro</span>
          </p>
          <div className="absolute bottom-1 right-2 opacity-0 hover:opacity-100 transition-opacity">
               <button onClick={downloadAppIcons} className="text-[10px] text-gray-700 hover:text-gray-500">Descargar Iconos</button>
          </div>
      </footer>
    </div>
  );
}