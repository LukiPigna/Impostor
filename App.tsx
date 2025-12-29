import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Wand2, EyeOff, Check, Crown, Minus, RotateCcw, Clapperboard, MapPin, Utensils, Box, Cat, Users, Ghost, Fingerprint, Music, ArrowLeft, ShieldCheck } from 'lucide-react';
import { GameStage, GameMode, Player, SupportedLanguage, Category } from './types';
import { generateWord, generateDuelWords } from './services/geminiService';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Logo } from './components/Logo';
import { translations } from './utils/translations';

const MIN_PLAYERS = 3;
const ROUND_TIME_SECONDS = 180;

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

const CircularTimer = ({ timeLeft, totalTime }: { timeLeft: number, totalTime: number }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const progress = timeLeft / totalTime;
    const dashoffset = circumference * (1 - progress);
    const isLowTime = timeLeft < 30;

    return (
        <div className="relative flex items-center justify-center w-24 h-24 mb-4">
            <svg className="transform -rotate-90 w-full h-full">
                <circle cx="50%" cy="50%" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="transparent" />
                <circle 
                    cx="50%" cy="50%" r={radius} 
                    stroke={isLowTime ? "#ef4444" : "#6366f1"} 
                    strokeWidth="4" 
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

  const [gameMode, setGameMode] = useState<GameMode>(GameMode.AI);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [transitionNextName, setTransitionNextName] = useState<string | null>(null);

  const [secretWord, setSecretWord] = useState<string>('');
  const [secretWordB, setSecretWordB] = useState<string>(''); 
  const [impostorIds, setImpostorIds] = useState<string[]>([]);
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
    localStorage.setItem('impostor_language', language);
  }, [players, language]);

  useEffect(() => {
    let interval: number;
    if (stage === GameStage.PLAYING && timeLeft > 0) {
      interval = window.setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [stage, timeLeft]);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    vibrate();
    const newPlayer: Player = { id: crypto.randomUUID(), name: newPlayerName.trim(), isImpostor: false };
    setPlayers(prev => [newPlayer, ...prev]);
    setNewPlayerName('');
  };

  const removePlayer = (id: string) => {
    vibrate();
    setPlayers(prev => {
        const newPlayers = prev.filter(p => p.id !== id);
        const maxImpostors = Math.max(1, Math.floor(newPlayers.length / 2));
        if (impostorCount > maxImpostors && newPlayers.length >= MIN_PLAYERS) setImpostorCount(maxImpostors);
        else if (newPlayers.length < MIN_PLAYERS) setImpostorCount(1);
        return newPlayers;
    });
  };

  const updateImpostorCount = (increment: number) => {
    vibrate();
    setImpostorCount(prev => {
        const max = Math.max(1, Math.floor(players.length / 2));
        return Math.min(Math.max(1, prev + increment), max);
    });
  };

  const handleModeSelection = (mode: GameMode) => {
    vibrate();
    setGameMode(mode);
    if (mode === GameMode.AI) setStage(GameStage.CATEGORY_SELECT);
    else if (mode === GameMode.AMONG_US) prepareGameLogic(GameMode.AMONG_US);
    else if (mode === GameMode.SONGS) prepareGameLogic(GameMode.SONGS);
    else prepareGameLogic(GameMode.CUSTOM);
  };

  const prepareGameLogic = async (mode: GameMode, category?: Category) => {
    setIsLoading(true);
    const shuffledPlayers: Player[] = secureShuffle(players);
    const indices = Array.from({ length: shuffledPlayers.length }, (_, i) => i);
    const selectedIndices = secureShuffle(indices).slice(0, impostorCount);

    const newImpostorIds = selectedIndices.map(idx => shuffledPlayers[idx].id);
    setImpostorIds(newImpostorIds);
    setPlayers(shuffledPlayers.map(p => ({ ...p, isImpostor: newImpostorIds.includes(p.id) })));
    setStartingPlayerIndex(getSecureRandomInt(shuffledPlayers.length));
    setCurrentPlayerIndex(0);
    setTransitionNextName(null);
    setTimeLeft(ROUND_TIME_SECONDS);

    if (mode === GameMode.AI && category) {
      setStage(GameStage.LOADING_AI);
      const word = await generateWord(category, language, usedWords);
      setSecretWord(word);
      setUsedWords(prev => [...prev, word]);
      setStage(GameStage.DISTRIBUTE);
    } else if (mode === GameMode.SONGS) {
      setStage(GameStage.LOADING_AI);
      const { wordA, wordB } = await generateDuelWords(language, usedWords);
      setSecretWord(wordA);
      setSecretWordB(wordB);
      setUsedWords(prev => [...prev, wordA, wordB]);
      setStage(GameStage.DISTRIBUTE);
    } else if (mode === GameMode.AMONG_US) {
       setSecretWord(shuffledPlayers[getSecureRandomInt(shuffledPlayers.length)].name);
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
    const newWords = [...customWords, word.trim()];
    setCustomWords(newWords);
    if (customInputIndex < players.length - 1) setCustomInputIndex(prev => prev + 1);
    else {
      setSecretWord(newWords[getSecureRandomInt(newWords.length)]);
      setStage(GameStage.DISTRIBUTE);
    }
  };

  const handleNextPlayer = () => {
    vibrate();
    const nextIdx = currentPlayerIndex + 1;
    if (nextIdx < players.length) setTransitionNextName(players[nextIdx].name);
    else setTransitionNextName(null);
    setHasPeeked(false);
    setTimeout(() => {
      if (currentPlayerIndex < players.length - 1) {
        setCurrentPlayerIndex(prev => prev + 1);
        setTransitionNextName(null);
      } else setStage(GameStage.PLAYING);
    }, 400); 
  };

  const resetToSetup = () => {
    vibrate();
    setStage(GameStage.SETUP);
    setSecretWord('');
    setSecretWordB('');
    setImpostorIds([]);
    setCurrentPlayerIndex(0);
    setHasPeeked(false);
  };

  const ElegantBackButton = () => (
    <button 
        onClick={resetToSetup} 
        className="flex items-center justify-center w-10 h-10 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-gray-400 hover:text-white hover:bg-white/15 transition-all active:scale-90"
        aria-label={t.back}
    >
        <ArrowLeft size={18} />
    </button>
  );

  const renderSetup = () => (
      <div className="max-w-md mx-auto w-full space-y-6 animate-slide-up relative min-h-[100dvh] flex flex-col justify-center pb-12">
        <div className="absolute top-4 right-0 z-20">
          <div className="flex bg-black/40 backdrop-blur-md rounded-xl p-1 border border-white/5">
            {['en', 'es'].map(l => (
              <button key={l} onClick={() => { vibrate(); setLanguage(l as SupportedLanguage); }} className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${language === l ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
        
        <div className="text-center pt-8 flex flex-col items-center shrink-0">
          <Logo className="w-40 h-auto drop-shadow-[0_0_30px_rgba(99,102,241,0.3)] mx-auto mb-4" />
          <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 mb-2">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{t.setupSubtitle}</p>
          </div>
        </div>

        <div className="space-y-6 bg-slate-900/50 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          
          <div className="flex gap-3">
            <input type="text" value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPlayer()} placeholder={t.enterName} className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500/50 transition-colors text-white placeholder-gray-600 font-medium" />
            <Button onClick={addPlayer} disabled={!newPlayerName.trim()} className="w-[58px] aspect-square flex items-center justify-center p-0 !rounded-2xl shadow-indigo-500/20"><Plus size={24} /></Button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar min-h-[140px]">
            {players.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 opacity-20">
                    <Users size={32} strokeWidth={1.5}/>
                    <p className="text-xs font-bold mt-2 uppercase tracking-widest">{t.noPlayers}</p>
                </div>
            )}
            {players.map((p, idx) => (
              <div key={p.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 animate-slide-up group transition-colors hover:bg-white/10" style={{ animationDelay: `${idx * 40}ms` }}>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-indigo-500/60 w-4">{players.length - idx}</span>
                    <span className="font-bold text-gray-200">{p.name}</span>
                </div>
                <button onClick={() => removePlayer(p.id)} className="text-gray-600 hover:text-red-400 p-2 transition-colors"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>

          {players.length >= MIN_PLAYERS && (
             <div className="bg-black/40 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-white font-black text-xs uppercase tracking-widest">{t.numImpostors}</span>
                    <span className="text-indigo-400/60 text-[10px] font-bold">{t.recommended}: {Math.ceil(players.length / 5)}</span>
                </div>
                <div className="flex items-center gap-4 bg-white/5 rounded-xl p-1.5 border border-white/5">
                   <button onClick={() => updateImpostorCount(-1)} disabled={impostorCount <= 1} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-indigo-400 disabled:opacity-20 transition-all"><Minus size={16} /></button>
                   <span className="font-black text-lg w-4 text-center text-white">{impostorCount}</span>
                   <button onClick={() => updateImpostorCount(1)} disabled={impostorCount >= Math.floor(players.length / 2)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-indigo-400 disabled:opacity-20 transition-all"><Plus size={16} /></button>
                </div>
             </div>
          )}
        </div>
        
        <div className="space-y-4">
            <Button fullWidth onClick={() => { vibrate(); setStage(GameStage.MODE_SELECT); }} disabled={players.length < MIN_PLAYERS} className="py-5 text-lg !rounded-2xl shadow-xl">{players.length < MIN_PLAYERS ? t.needMore : t.continue}</Button>
            <p className="text-center text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">{t.minPlayers}</p>
        </div>
      </div>
  );

  const renderModeSelect = () => (
    <div className="max-w-md mx-auto w-full space-y-6 animate-slide-up pt-8 pb-12 min-h-[100dvh] flex flex-col justify-center">
       <div className="flex justify-between items-center mb-6 px-4">
         <div className="space-y-1">
            <h2 className="text-3xl font-black text-white tracking-tight">{t.chooseMode}</h2>
            <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
         </div>
         <ElegantBackButton />
       </div>
       <div className="grid gap-4">
       {[
         { mode: GameMode.AI, icon: <Wand2 />, color: "text-violet-400", label: t.modeAi, desc: t.modeAiDesc },
         { mode: GameMode.SONGS, icon: <Music />, color: "text-emerald-400", label: t.modeSongs, desc: t.modeSongsDesc },
         { mode: GameMode.AMONG_US, icon: <Ghost />, color: "text-red-400", label: t.modeAmongUs, desc: t.modeAmongUsDesc },
         { mode: GameMode.CUSTOM, icon: <Users />, color: "text-indigo-400", label: t.modeCustom, desc: t.modeCustomDesc },
       ].map((item, idx) => (
         <button key={item.mode} onClick={() => handleModeSelection(item.mode)} className="w-full bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 text-left transition-all active:scale-[0.97] shadow-lg group relative overflow-hidden animate-slide-up" style={{ animationDelay: `${idx * 80}ms` }}>
           <div className={`absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12 ${item.color}`}>
             {React.cloneElement(item.icon as React.ReactElement<any>, { size: 120, strokeWidth: 1 })}
           </div>
           <div className="relative z-10">
                <div className={`${item.color} mb-3 flex items-center gap-2`}>
                    <div className="p-2 bg-white/5 rounded-xl border border-white/5">{item.icon}</div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Game Mode</span>
                </div>
                <h3 className="text-xl font-black text-white mb-2">{item.label}</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-medium line-clamp-2">{item.desc}</p>
           </div>
         </button>
       ))}
       </div>
    </div>
  );

  const renderCategorySelect = () => (
      <div className="max-w-md mx-auto w-full space-y-8 animate-slide-up pt-8 min-h-[100dvh] flex flex-col justify-center">
        <div className="flex justify-between items-center px-4">
            <div className="space-y-1">
                <h2 className="text-3xl font-black text-white tracking-tight">{t.categories.title}</h2>
                <div className="h-1 w-12 bg-violet-500 rounded-full"></div>
            </div>
            <ElegantBackButton />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'FAMOUS', icon: <Crown size={28} />, label: t.categories.FAMOUS, color: "text-amber-400" },
            { id: 'ANIMALS', icon: <Cat size={28} />, label: t.categories.ANIMALS, color: "text-emerald-400" },
            { id: 'MOVIES', icon: <Clapperboard size={28} />, label: t.categories.MOVIES, color: "text-red-400" },
            { id: 'PLACES', icon: <MapPin size={28} />, label: t.categories.PLACES, color: "text-sky-400" },
            { id: 'FOOD', icon: <Utensils size={28} />, label: t.categories.FOOD, color: "text-orange-400" },
            { id: 'OBJECTS', icon: <Box size={28} />, label: t.categories.OBJECTS, color: "text-purple-400" },
          ].map((cat, idx) => (
            <button key={cat.id} onClick={() => { vibrate(); prepareGameLogic(GameMode.AI, cat.id as Category); }} className="bg-white/5 backdrop-blur-xl border border-white/5 p-8 rounded-[2rem] flex flex-col items-center justify-center gap-5 transition-all active:scale-95 shadow-xl animate-slide-up hover:bg-white/10" style={{ animationDelay: `${idx * 40}ms` }}>
              <div className={`${cat.color} drop-shadow-[0_0_15px_currentColor]`}>{cat.icon}</div>
              <span className="font-black text-gray-300 text-[10px] uppercase tracking-[0.2em]">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
  );

  const renderCustomInput = () => (
      <div className="max-w-md mx-auto w-full space-y-10 animate-slide-up pt-12 min-h-[100dvh] flex flex-col justify-center">
        <div className="flex justify-between items-center px-4">
            <h2 className="text-3xl font-black text-indigo-400 leading-tight pr-4">{t.passPhone(players[customInputIndex].name)}</h2>
            <ElegantBackButton />
        </div>
        <div className="bg-slate-900/50 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl space-y-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-2"><Users size={24}/></div>
            <p className="text-gray-400 text-sm font-bold text-center tracking-wide">{t.hideInput}</p>
          </div>
          <form onSubmit={e => { e.preventDefault(); const val = new FormData(e.currentTarget).get('word') as string; if(val) handleCustomWordSubmit(val); e.currentTarget.reset(); }}>
            <input name="word" autoFocus autoComplete="off" className="w-full bg-black/40 border-b-2 border-white/10 focus:border-indigo-500 text-center text-3xl font-black text-white py-6 transition-all outline-none" placeholder="..." />
            <Button fullWidth type="submit" className="text-lg py-5 mt-10 !rounded-2xl shadow-indigo-500/20">{t.submitPass}</Button>
          </form>
        </div>
      </div>
  );

  const renderDistribute = () => {
    const player = players[currentPlayerIndex];
    const isImpostor = impostorIds.includes(player.id);
    const isSongsMode = gameMode === GameMode.SONGS;
    
    const showImpostorIdentity = isImpostor && !isSongsMode;
    const wordToDisplay = (isImpostor && isSongsMode) ? secretWordB : secretWord;

    const cardBackContent = (
      <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in w-full">
        {showImpostorIdentity ? (
          <>
            <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 border border-red-500/20 shadow-xl"><EyeOff size={48} strokeWidth={1.5} /></div>
            <div className="space-y-2">
                <h2 className="text-4xl font-black text-red-500 uppercase tracking-[0.2em]">{t.impostorRole}</h2>
                <p className="text-gray-400 text-sm font-bold opacity-60 uppercase tracking-widest">{t.impostorDesc}</p>
            </div>
            <div className="px-6 py-2.5 bg-red-500/10 rounded-full border border-red-500/20 text-red-400 text-[10px] font-black tracking-widest animate-pulse">{t.blendIn}</div>
          </>
        ) : (
          <>
            <div className="w-24 h-24 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-xl"><ShieldCheck size={48} strokeWidth={1.5} /></div>
            <div className="space-y-1">
                <h3 className="text-gray-500 font-black uppercase text-[10px] tracking-[0.3em]">{t.secretWordIs}</h3>
                <div className="h-0.5 w-8 bg-indigo-500/50 mx-auto rounded-full"></div>
            </div>
            <div className="w-full py-4"><h2 className="text-3xl font-black text-white break-words leading-tight">{wordToDisplay}</h2></div>
            <div className="px-6 py-2.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-widest">{t.findImpostor}</div>
          </>
        )}
      </div>
    );

    const cardFrontContent = (
        <div className="flex flex-col items-center gap-8">
            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 shadow-inner">
                <Fingerprint size={100} className="text-white/40" strokeWidth={1}/>
            </div>
            <div className="text-center space-y-2">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] opacity-80">Security Protocol</p>
                <h3 className="text-3xl font-black text-white leading-tight px-4">{transitionNextName ? t.passPhone(transitionNextName) : t.passPhone(player.name)}</h3>
            </div>
        </div>
    );

    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full pt-10 pb-16">
        <div className="w-full flex justify-between items-center mb-8 max-w-[320px] px-2">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{t.playerCount(currentPlayerIndex + 1, players.length)}</p>
            </div>
            {!hasPeeked && <ElegantBackButton />}
        </div>
        
        <div className="mb-12 w-full flex justify-center scale-100 sm:scale-110">
            <Card onReveal={() => setHasPeeked(true)} isResetting={!!transitionNextName} frontContent={cardFrontContent} backContent={cardBackContent} hintText={t.tapToReveal} />
        </div>

        <div className="h-20 w-full max-w-xs flex items-center justify-center px-4">
            {hasPeeked && (
                <Button fullWidth onClick={handleNextPlayer} className="animate-slide-up !rounded-2xl py-5 shadow-2xl shadow-indigo-500/20 border-white/10 text-lg">
                    {currentPlayerIndex < players.length - 1 ? t.nextPlayer : t.startGame}
                </Button>
            )}
        </div>
      </div>
    );
  };

  const renderPlaying = () => (
      <div className="max-w-md mx-auto w-full text-center space-y-12 animate-slide-up min-h-[100dvh] flex flex-col justify-center items-center pb-20">
          <CircularTimer timeLeft={timeLeft} totalTime={ROUND_TIME_SECONDS} />
          
          <div className="space-y-3">
              <h2 className="text-5xl font-black text-white tracking-tight">{t.discuss}</h2>
              <div className="h-1.5 w-16 bg-gradient-to-r from-indigo-500 to-violet-600 mx-auto rounded-full"></div>
          </div>

          <div className="w-full max-w-xs relative group">
            <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <div className="relative bg-slate-900/60 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center gap-4 shadow-2xl">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-amber-400 shadow-inner">
                    <Crown size={24} fill="currentColor"/>
                </div>
                <div className="space-y-1">
                    <h3 className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">{t.firstPlayer}</h3>
                    <div className="text-3xl font-black text-white">{players[startingPlayerIndex]?.name}</div>
                </div>
            </div>
          </div>

          <Button variant="danger" fullWidth onClick={() => setStage(GameStage.REVEAL)} className="py-6 text-xl !rounded-[2rem] shadow-2xl shadow-red-500/20 max-w-xs">{t.revealBtn(impostorCount)}</Button>
      </div>
  );

  const renderReveal = () => (
    <div className="max-w-md mx-auto w-full text-center space-y-10 animate-slide-up pt-12 pb-20 min-h-[100dvh] flex flex-col justify-center">
        <div className="space-y-4">
            <h2 className="text-4xl font-black text-white">{t.gameOver}</h2>
            <div className="bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
                <p className="text-gray-500 font-black uppercase text-[10px] tracking-[0.4em] mb-6">{t.secretWas}</p>
                <div className="text-3xl font-black text-indigo-400 mb-2">{secretWord}</div>
                {gameMode === GameMode.SONGS && (
                    <>
                        <div className="text-gray-700 font-black text-sm my-3 uppercase tracking-widest">VS</div>
                        <div className="text-3xl font-black text-red-400">{secretWordB}</div>
                    </>
                )}
            </div>
        </div>
        
        <div className="space-y-3 px-2">
            {players.map((p, idx) => (
                <div key={p.id} className={`flex items-center justify-between p-5 rounded-[1.5rem] border backdrop-blur-md animate-slide-up transition-all ${p.isImpostor ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/5'}`} style={{ animationDelay: `${idx * 100}ms` }}>
                    <span className={`font-bold text-lg ${p.isImpostor ? 'text-red-400' : 'text-gray-300'}`}>{p.name}</span>
                    {p.isImpostor ? (
                        <div className="px-3 py-1 bg-red-500/20 rounded-lg border border-red-500/20">
                            <span className="text-red-400 font-black uppercase tracking-widest text-[8px] flex items-center gap-1"><EyeOff size={10} /> {t.impostorRole}</span>
                        </div>
                    ) : (
                        <span className="text-emerald-500/30 font-black text-[8px] uppercase tracking-widest">{t.crewmate}</span>
                    )}
                </div>
            ))}
        </div>
        
        <div className="px-4">
            <Button fullWidth onClick={resetToSetup} className="py-5 flex items-center justify-center gap-3 !rounded-2xl text-lg shadow-xl"><RotateCcw size={22} /> {t.playAgain}</Button>
        </div>
    </div>
  );

  return (
    <div className="h-[100dvh] text-gray-100 flex flex-col overflow-hidden relative">
      <main className="flex-grow overflow-y-auto p-6 flex flex-col items-center custom-scrollbar z-10">
        <div className="w-full max-w-md my-auto">
            {stage === GameStage.SETUP && renderSetup()}
            {stage === GameStage.MODE_SELECT && renderModeSelect()}
            {stage === GameStage.CATEGORY_SELECT && renderCategorySelect()}
            {stage === GameStage.CUSTOM_INPUT && renderCustomInput()}
            {stage === GameStage.LOADING_AI && (
                <div className="text-center space-y-10 animate-pulse flex flex-col items-center justify-center h-[100dvh]">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse"></div>
                        <Wand2 size={80} className="text-indigo-400 animate-bounce relative z-10" strokeWidth={1}/>
                    </div>
                    <div className="space-y-4">
                        <p className="font-black text-indigo-300 uppercase tracking-[0.4em] text-xs">{t.summoning}</p>
                        <div className="w-12 h-1 bg-white/10 mx-auto rounded-full overflow-hidden">
                            <div className="w-full h-full bg-indigo-500 animate-[loading_1.5s_infinite]"></div>
                        </div>
                    </div>
                    <ElegantBackButton />
                </div>
            )}
            {stage === GameStage.DISTRIBUTE && renderDistribute()}
            {stage === GameStage.PLAYING && renderPlaying()}
            {stage === GameStage.REVEAL && renderReveal()}
        </div>
      </main>
      <footer className="shrink-0 p-6 text-center z-10 relative pointer-events-none">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-20">© {new Date().getFullYear()} Lucas Pignataro</p>
      </footer>
    </div>
  );
}