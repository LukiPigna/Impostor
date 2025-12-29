import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Wand2, EyeOff, Crown, Minus, RotateCcw, Box, Cat, Users, Ghost, Fingerprint, Music, ArrowLeft, ShieldCheck, Languages, ChevronLeft, ChevronRight, Zap, Smartphone, Disc, User, Info, X } from 'lucide-react';
import { GameStage, GameMode, Player, SupportedLanguage, Category } from './types';
import { generateWord, generateDuel } from './services/geminiService';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Logo } from './components/Logo';
import { translations } from './utils/translations';

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;
const ROUND_TIME_SECONDS = 180;

const PLAYER_COLORS = [
  'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'text-red-400 bg-red-500/10 border-red-500/20',
  'text-pink-400 bg-pink-500/10 border-pink-500/20',
  'text-sky-400 bg-sky-500/10 border-sky-500/20',
  'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
];

const vibrate = (ms: number = 10) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms);
};

export default function App() {
  const [stage, setStage] = useState<GameStage>(GameStage.SETUP);
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
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
  const [secretWord, setSecretWord] = useState('');
  const [secretWordB, setSecretWordB] = useState(''); 
  const [impostorIds, setImpostorIds] = useState<string[]>([]);
  const [impostorCount, setImpostorCount] = useState(1);
  const [hasPeeked, setHasPeeked] = useState(false);
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [customInputIndex, setCustomInputIndex] = useState(0);
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_SECONDS);
  const [modeIdx, setModeIdx] = useState(0);

  const touchStartX = useRef<number | null>(null);

  const t = translations[language];

  useEffect(() => {
    const timer = setTimeout(() => setIsIntroActive(false), 2000);
    return () => clearTimeout(timer);
  }, []);

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

  const handleBack = () => {
    vibrate();
    if (stage === GameStage.MODE_SELECT) {
      setStage(GameStage.SETUP);
    } else if (stage === GameStage.CATEGORY_SELECT || stage === GameStage.CUSTOM_INPUT || stage === GameStage.DISTRIBUTE || stage === GameStage.LOADING_AI) {
      setStage(GameStage.MODE_SELECT);
    }
  };

  const prepareGameLogic = async (mode: GameMode, category?: Category) => {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const selectedIndices = [...Array(shuffled.length).keys()].sort(() => Math.random() - 0.5).slice(0, impostorCount);
    const newImpostorIds = selectedIndices.map(idx => shuffled[idx].id);
    
    setImpostorIds(newImpostorIds);
    setGameMode(mode);
    setPlayers(shuffled.map(p => ({ ...p, isImpostor: newImpostorIds.includes(p.id) })));
    setStartingPlayerIndex(Math.floor(Math.random() * shuffled.length));
    setCurrentPlayerIndex(0);
    setHasPeeked(false);
    setSecretWord('');
    setSecretWordB('');

    if (mode === GameMode.AI && category) {
      setStage(GameStage.LOADING_AI);
      const word = await generateWord(category, language, []);
      setSecretWord(word);
      setStage(GameStage.DISTRIBUTE);
    } else if (mode === GameMode.UNDERCOVER || mode === GameMode.SONGS) {
      setStage(GameStage.LOADING_AI);
      const { wordA, wordB } = await generateDuel(mode === GameMode.SONGS ? 'SONGS' : 'UNDERCOVER', language);
      setSecretWord(wordA);
      setSecretWordB(wordB);
      setStage(GameStage.DISTRIBUTE);
    } else if (mode === GameMode.AMONG_US) {
      setSecretWord(shuffled[Math.floor(Math.random() * shuffled.length)].name);
      setStage(GameStage.DISTRIBUTE);
    } else {
      setCustomWords([]);
      setCustomInputIndex(0);
      setStage(GameStage.CUSTOM_INPUT);
    }
  };

  const handleCustomWordSubmit = (word: string) => {
    vibrate();
    const newWords = [...customWords, word.trim()];
    setCustomWords(newWords);
    if (customInputIndex < players.length - 1) {
      setCustomInputIndex(prev => prev + 1);
    } else {
      setSecretWord(newWords[Math.floor(Math.random() * newWords.length)]);
      setStage(GameStage.DISTRIBUTE);
    }
  };

  const handleNextPlayer = () => {
    vibrate();
    if (currentPlayerIndex < players.length - 1) {
      const nextIdx = currentPlayerIndex + 1;
      setTransitionNextName(players[nextIdx].name);
      setTimeout(() => {
        setCurrentPlayerIndex(nextIdx);
        setHasPeeked(false);
        setTransitionNextName(null);
      }, 400);
    } else {
      setStage(GameStage.PLAYING);
      setTimeLeft(ROUND_TIME_SECONDS);
    }
  };

  const GenericNavbar = ({ title }: { title?: string }) => (
    <div className="w-full flex justify-between items-center py-2 px-2 shrink-0 h-14">
      <button onClick={handleBack} className="p-2 bg-white/5 rounded-full border border-white/5 text-gray-400 active:scale-90 transition-all">
        <ArrowLeft size={16} />
      </button>
      {title && <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 text-center flex-1 truncate px-2">{title}</span>}
      <button onClick={() => { vibrate(); setLanguage(l => l === 'en' ? 'es' : 'en'); }} className="p-2 bg-white/5 rounded-full border border-white/5 text-gray-400 active:scale-90 transition-all">
        <Languages size={16} />
      </button>
    </div>
  );

  const HelpModal = ({ mode }: { mode: GameMode }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-slide-up">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
      <div className="relative bg-[#161b2a] border border-white/10 w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
           <Info size={32} />
        </div>
        <div>
          <h2 className="text-xl font-black text-white mb-2 uppercase tracking-widest">{t.help.title}</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{t.help[mode]}</p>
        </div>
        <Button fullWidth onClick={() => setShowHelp(false)} className="!rounded-2xl py-4">{t.help.close}</Button>
      </div>
    </div>
  );

  const renderSetup = () => (
    <div className="max-w-md mx-auto w-full h-full flex flex-col animate-slide-up pb-4 px-4 overflow-hidden relative">
      <div className={`w-full flex justify-between items-center py-4 shrink-0 transition-all duration-1000 ease-in-out ${isIntroActive ? 'absolute inset-0 flex-col justify-center items-center z-50 bg-[#0d111a]' : 'relative'}`}>
        <div className={`transition-all duration-1000 ease-in-out w-full flex justify-center ${isIntroActive ? 'scale-150' : 'scale-100'}`}>
          <Logo className={`${isIntroActive ? 'w-48 h-48' : 'w-24 h-24'} transition-all duration-1000`} />
        </div>
        {!isIntroActive && (
          <button onClick={() => { vibrate(); setLanguage(l => l === 'en' ? 'es' : 'en'); }} className="absolute right-0 p-2.5 bg-white/5 rounded-full border border-white/10 text-gray-400 active:scale-90 transition-all backdrop-blur-md">
            <Languages size={18} />
          </button>
        )}
      </div>
      
      {!isIntroActive && (
        <div className="flex-1 flex flex-col min-h-0 animate-slide-up">
          <div className="flex justify-between items-end mb-4 px-1">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">{language === 'es' ? 'Tu Escuadrón' : 'Your Squad'}</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{players.length} / {MAX_PLAYERS} {language === 'es' ? 'Jugadores' : 'Players'}</p>
            </div>
            {players.length >= MIN_PLAYERS && (
              <div className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest animate-pulse">
                {language === 'es' ? 'Listos' : 'Ready'}
              </div>
            )}
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User size={16} className="text-gray-500" />
            </div>
            <input 
              type="text" 
              value={newPlayerName} 
              onChange={e => setNewPlayerName(e.target.value)} 
              onKeyDown={e => {
                if(e.key === 'Enter' && newPlayerName.trim() && players.length < MAX_PLAYERS) {
                  vibrate();
                  setPlayers([{id: crypto.randomUUID(), name: newPlayerName.trim(), isImpostor: false}, ...players]);
                  setNewPlayerName('');
                }
              }} 
              placeholder={t.enterName} 
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-14 py-4 focus:outline-none focus:border-indigo-500/50 text-white text-base font-medium transition-all placeholder:text-gray-600 shadow-inner" 
            />
            <button 
              onClick={() => {
                if(newPlayerName.trim() && players.length < MAX_PLAYERS) {
                  vibrate(); 
                  setPlayers([{id: crypto.randomUUID(), name: newPlayerName.trim(), isImpostor: false}, ...players]); 
                  setNewPlayerName('');
                }
              }} 
              disabled={!newPlayerName.trim() || players.length >= MAX_PLAYERS} 
              className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/5 disabled:text-gray-700 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 mb-4">
            {players.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-12">
                <div className="p-8 bg-white/5 rounded-full mb-4 border border-white/5">
                  <Users size={48} strokeWidth={1}/>
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-center">{t.noPlayers}</p>
              </div>
            ) : (
              players.map((p, idx) => (
                <div key={p.id} className="flex justify-between items-center bg-white/[0.03] backdrop-blur-sm p-3.5 rounded-2xl border border-white/5 animate-slide-up group" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border shadow-sm ${PLAYER_COLORS[idx % PLAYER_COLORS.length]}`}>
                      <User size={18} />
                    </div>
                    <span className="font-bold text-gray-200 text-sm tracking-tight">{p.name}</span>
                  </div>
                  <button 
                    onClick={() => { vibrate(); setPlayers(players.filter(x => x.id !== p.id)); }} 
                    className="text-gray-700 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {players.length >= MIN_PLAYERS && (
            <div className="bg-black/40 backdrop-blur-xl p-4 rounded-3xl border border-white/5 flex items-center justify-between mb-4 shadow-2xl">
              <div className="flex flex-col">
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">{t.numImpostors}</span>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                   <span className="text-white font-black text-lg leading-none">{impostorCount}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { vibrate(); setImpostorCount(Math.max(1, impostorCount - 1)); }} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-90"><Minus size={16} /></button>
                <button onClick={() => { vibrate(); setImpostorCount(Math.min(Math.floor(players.length/2), impostorCount + 1)); }} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all active:scale-90"><Plus size={16} /></button>
              </div>
            </div>
          )}

          <div className="shrink-0">
            <Button fullWidth onClick={() => { vibrate(); setStage(GameStage.MODE_SELECT); }} disabled={players.length < MIN_PLAYERS} className="py-4.5 !rounded-2xl text-base shadow-2xl shadow-indigo-500/20">
              {players.length < MIN_PLAYERS ? t.needMore : t.continue}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderModeSelect = () => {
    const modes = [
      { id: GameMode.AI, icon: <Wand2 size={48}/>, color: "text-amber-400", label: t.modeAi, desc: t.modeAiDesc },
      { id: GameMode.UNDERCOVER, icon: <ShieldCheck size={48}/>, color: "text-blue-400", label: t.modeUndercover, desc: t.modeUndercoverDesc },
      { id: GameMode.SONGS, icon: <Disc size={48}/>, color: "text-emerald-400", label: t.modeSongs, desc: t.modeSongsDesc },
      { id: GameMode.AMONG_US, icon: <Ghost size={48}/>, color: "text-red-400", label: t.modeAmongUs, desc: t.modeAmongUsDesc },
      { id: GameMode.CUSTOM, icon: <Users size={48}/>, color: "text-indigo-400", label: t.modeCustom, desc: t.modeCustomDesc },
    ];

    const next = () => { vibrate(5); setModeIdx((m) => (m + 1) % modes.length); };
    const prev = () => { vibrate(5); setModeIdx((m) => (m - 1 + modes.length) % modes.length); };

    const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const touchEndX = e.changedTouches[0].clientX;
      const delta = touchStartX.current - touchEndX;
      if (Math.abs(delta) > 50) delta > 0 ? next() : prev();
      touchStartX.current = null;
    };

    const handleSelectMode = (modeId: GameMode) => {
      vibrate();
      if (modeId === GameMode.AI) setStage(GameStage.CATEGORY_SELECT);
      else prepareGameLogic(modeId);
    };

    return (
      <div className="max-w-md mx-auto w-full h-full flex flex-col animate-slide-up pb-4 px-3 overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {showHelp && <HelpModal mode={modes[modeIdx].id} />}
        <GenericNavbar title={t.chooseMode} />
        <div className="flex-1 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="relative w-full h-[400px] flex items-center justify-center">
            {modes.map((mode, i) => {
              const dist = i - modeIdx;
              let normalizedDist = dist;
              if (dist > modes.length / 2) normalizedDist = dist - modes.length;
              if (dist < -modes.length / 2) normalizedDist = dist + modes.length;
              const active = normalizedDist === 0;
              return (
                <div 
                  key={mode.id} 
                  onClick={() => active && handleSelectMode(mode.id)}
                  className={`absolute inset-0 flex flex-col items-center justify-center text-center px-8 transition-all duration-500 ease-out transform cursor-pointer
                    ${active ? 'opacity-100 scale-100 z-20 pointer-events-auto' : 'opacity-0 scale-75 z-0 pointer-events-none'} 
                    ${normalizedDist === -1 ? '-translate-x-[65%] opacity-15 scale-90 z-10' : ''} 
                    ${normalizedDist === 1 ? 'translate-x-[65%] opacity-15 scale-90 z-10' : ''}`}
                >
                  <div className={`p-12 bg-slate-900/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/5 shadow-2xl mb-8 ${mode.color} active:scale-95 transition-transform`}>{mode.icon}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-3xl font-black text-white tracking-tight leading-tight">{mode.label}</h3>
                    <button onClick={(e) => { e.stopPropagation(); setShowHelp(true); vibrate(); }} className="text-gray-500 hover:text-indigo-400 p-1">
                      <Info size={20} />
                    </button>
                  </div>
                  <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-[240px]">{mode.desc}</p>
                </div>
              );
            })}
          </div>
          
          <div className="flex gap-2.5 mt-8">
            {modes.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === modeIdx ? 'w-8 bg-indigo-500' : 'w-2 bg-white/10'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCategorySelect = () => (
    <div className="max-w-md mx-auto w-full h-full flex flex-col animate-slide-up pb-4 px-3 overflow-hidden">
      <GenericNavbar title={t.categories.title} />
      <div className="flex-1 flex flex-col justify-center py-2">
        <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar pr-0.5">
          {[
            { id: 'INTERNET', icon: <Smartphone size={22} />, label: t.categories.INTERNET, color: "text-blue-400" },
            { id: 'VILLAINS', icon: <Ghost size={22} />, label: t.categories.VILLAINS, color: "text-red-400" },
            { id: 'NOSTALGIA', icon: <RotateCcw size={22} />, label: t.categories.NOSTALGIA, color: "text-amber-400" },
            { id: 'LEGENDS', icon: <Crown size={22} />, label: t.categories.LEGENDS, color: "text-emerald-400" },
            { id: 'ANIME', icon: <Cat size={22} />, label: t.categories.ANIME, color: "text-purple-400" },
            { id: 'GADGETS', icon: <Box size={22} />, label: t.categories.GADGETS, color: "text-sky-400" },
          ].map((cat) => (
            <button key={cat.id} onClick={() => { vibrate(); prepareGameLogic(GameMode.AI, cat.id as Category); }} className="bg-white/5 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all active:scale-95">
              <div className={cat.color}>{cat.icon}</div>
              <span className="font-black text-gray-500 text-[9px] uppercase tracking-widest text-center">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCustomInput = () => (
    <div className="max-w-md mx-auto w-full h-full flex flex-col animate-slide-up pb-4 px-3">
      <GenericNavbar />
      <div className="flex-1 flex flex-col justify-center items-center text-center px-4 space-y-8 min-h-0">
        <div className="space-y-4">
          <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">{language === 'es' ? 'TU TURNO' : 'YOUR TURN'}</p>
          <h2 className="text-6xl font-black text-white tracking-tighter transition-all animate-slide-up">{players[customInputIndex].name}</h2>
          <p className="text-sm text-gray-500 font-bold max-w-[200px] mx-auto">{t.hideInput}</p>
        </div>
        <form className="w-full space-y-8" onSubmit={e => { e.preventDefault(); const val = new FormData(e.currentTarget).get('word') as string; if(val) handleCustomWordSubmit(val); e.currentTarget.reset(); }}>
          <input name="word" autoFocus autoComplete="off" className="w-full bg-transparent border-b-2 border-white/10 focus:border-indigo-500 text-center text-2xl font-black text-white py-4 outline-none transition-all placeholder:text-gray-800" placeholder={language === 'es' ? 'Escribe aquí...' : 'Type here...'} />
          <Button fullWidth type="submit" className="!rounded-2xl py-4.5 text-base shadow-xl">{t.submitPass}</Button>
        </form>
      </div>
    </div>
  );

  const renderDistribute = () => {
    const player = players[currentPlayerIndex];
    const isImpostor = impostorIds.includes(player.id);
    const showSpecificWord = (gameMode === GameMode.SONGS || gameMode === GameMode.UNDERCOVER);
    const word = (isImpostor && showSpecificWord) ? secretWordB : secretWord;
    
    return (
      <div className="max-w-md mx-auto w-full h-full flex flex-col animate-slide-up pb-4 px-3 overflow-hidden">
        <div className="flex justify-between items-center h-12 px-2 shrink-0">
          <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest">{t.playerCount(currentPlayerIndex + 1, players.length)}</p>
          {!hasPeeked && <button onClick={handleBack} className="p-2 bg-white/5 rounded-full text-gray-400 active:scale-90"><ArrowLeft size={16}/></button>}
        </div>
        <div className="flex-1 flex flex-col justify-center items-center min-h-0 relative">
          <Card 
            hintText={t.slideReveal}
            onReveal={() => setHasPeeked(true)} 
            isResetting={!!transitionNextName} 
            frontContent={
              <div className="flex flex-col items-center gap-6">
                <div className="p-8 bg-white/5 rounded-full border border-white/5 shadow-inner"><Fingerprint size={70} className="text-white/10" strokeWidth={1}/></div>
                <h3 className="text-2xl font-black text-white leading-tight px-4 text-center">{transitionNextName ? t.passPhone(transitionNextName) : t.passPhone(player.name)}</h3>
              </div>
            } backContent={
              <div className="flex flex-col items-center justify-center h-full space-y-6">
                {(isImpostor && !showSpecificWord) ? (
                  <>
                    <div className="p-5 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500"><EyeOff size={40} /></div>
                    <h2 className="text-3xl font-black text-red-500 uppercase tracking-tighter">{t.impostorRole}</h2>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{t.impostorDesc}</p>
                  </>
                ) : (
                  <>
                    <div className="p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400"><ShieldCheck size={40} /></div>
                    <h3 className="text-gray-600 font-black uppercase text-[10px] tracking-widest">{t.secretWordIs}</h3>
                    <div className="text-2xl font-black text-white break-words leading-tight text-center px-4">{word}</div>
                  </>
                )}
              </div>
            } 
          />
          
          <div className="h-20 flex items-center justify-center w-full mt-4">
             {hasPeeked && (
               <Button fullWidth onClick={handleNextPlayer} className="!rounded-2xl py-4 text-base animate-slide-up shadow-2xl shadow-indigo-500/20">
                 {currentPlayerIndex < players.length - 1 ? t.nextPlayer : t.startGame}
               </Button>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] text-gray-100 flex flex-col overflow-hidden relative">
      <main className="flex-grow flex flex-col items-center z-10 h-full w-full">
        {stage === GameStage.SETUP && renderSetup()}
        {stage === GameStage.MODE_SELECT && renderModeSelect()}
        {stage === GameStage.CATEGORY_SELECT && renderCategorySelect()}
        {stage === GameStage.CUSTOM_INPUT && renderCustomInput()}
        {stage === GameStage.LOADING_AI && (
          <div className="text-center space-y-6 animate-pulse flex flex-col items-center justify-center h-full w-full">
            <Zap size={48} className="text-amber-400 animate-bounce" />
            <p className="font-black text-indigo-400 uppercase tracking-widest text-[9px]">{t.summoning}</p>
            <div className="mt-4"><button onClick={handleBack} className="p-3 bg-white/5 rounded-full text-gray-400"><ArrowLeft size={16}/></button></div>
          </div>
        )}
        {stage === GameStage.DISTRIBUTE && renderDistribute()}
        {stage === GameStage.PLAYING && (
          <div className="max-w-md mx-auto w-full h-full flex flex-col justify-center items-center px-6 space-y-8 animate-slide-up">
            <div className="text-5xl font-black text-white font-mono tracking-tighter">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
            <div className="w-full bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 text-center backdrop-blur-md relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20 animate-scan"></div>
              <h3 className="text-indigo-400 text-[10px] font-black uppercase mb-3 tracking-[0.25em]">{t.firstPlayer}</h3>
              <div className="text-3xl font-black text-white tracking-tight">{players[startingPlayerIndex]?.name}</div>
            </div>
            <Button variant="danger" fullWidth onClick={() => { vibrate(); setStage(GameStage.REVEAL); }} className="py-5 !rounded-2xl shadow-red-500/20 text-lg uppercase tracking-widest">{t.revealBtn(impostorCount)}</Button>
          </div>
        )}
        {stage === GameStage.REVEAL && (
          <div className="max-w-md mx-auto w-full h-full flex flex-col animate-slide-up pb-4 px-3 overflow-hidden">
             <div className="w-full flex justify-center items-center py-2 px-2 shrink-0 h-24">
               <Logo className="w-16 h-16" />
             </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-3">
              <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 text-center mb-4">
                <p className="text-gray-600 font-black uppercase text-[10px] mb-4 tracking-widest">{t.secretWas}</p>
                <div className="text-3xl font-black text-indigo-400 tracking-tight">{secretWord}</div>
                {secretWordB && <div className="text-red-400 mt-3 font-black text-xl">vs {secretWordB}</div>}
              </div>
              {players.map(p => (
                <div key={p.id} className={`flex justify-between items-center p-5 rounded-2xl border transition-all ${p.isImpostor ? 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-white/5 border-white/5 text-gray-200'}`}>
                  <span className="font-black text-2xl tracking-tight">{p.name}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${p.isImpostor ? 'bg-red-500/20' : 'bg-white/10 opacity-60'}`}>{p.isImpostor ? t.impostorRole : t.crewmate}</span>
                </div>
              ))}
            </div>
            <div className="pt-4"><Button fullWidth onClick={() => { setStage(GameStage.SETUP); vibrate(); }} className="py-5 !rounded-2xl shadow-xl text-lg"><RotateCcw size={20} className="inline mr-3"/> {t.playAgain}</Button></div>
          </div>
        )}
      </main>
      <footer className="shrink-0 p-4 text-center z-10 relative bg-black/50 border-t border-white/5 backdrop-blur-xl">
        <p className="text-[9px] font-black tracking-widest uppercase opacity-25">© {new Date().getFullYear()} Lucas Pignataro</p>
      </footer>
    </div>
  );
}