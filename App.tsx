import React, { useState } from 'react';
import { Plus, Trash2, Wand2, Smartphone, EyeOff, Check, Crown, Minus, ArrowRight, RotateCcw, Languages } from 'lucide-react';
import { GameStage, GameMode, Player, SupportedLanguage } from './types';
import { generateFamousPerson } from './services/geminiService';
import { Button } from './components/Button';
import { Card } from './components/Card';
import { translations } from './utils/translations';

const MIN_PLAYERS = 3;

export default function App() {
  const [stage, setStage] = useState<GameStage>(GameStage.SETUP);
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [secretWord, setSecretWord] = useState<string>('');
  const [impostorIds, setImpostorIds] = useState<string[]>([]);
  const [impostorCount, setImpostorCount] = useState(1);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [customInputIndex, setCustomInputIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);
  const [language, setLanguage] = useState<SupportedLanguage>('es'); // Default to Spanish as requested

  const t = translations[language];

  // --- Actions ---

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: newPlayerName.trim(),
      isImpostor: false,
    };
    setPlayers(prev => [...prev, newPlayer]);
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

  const selectMode = async (mode: GameMode) => {
    setIsLoading(true);
    // Select N unique impostors
    const shuffledIds = [...players].map(p => p.id).sort(() => 0.5 - Math.random());
    const selectedImpostorIds = shuffledIds.slice(0, impostorCount);
    
    setImpostorIds(selectedImpostorIds);
    
    // Select starting player randomly
    const startIdx = Math.floor(Math.random() * players.length);
    setStartingPlayerIndex(startIdx);
    
    // Update players with basic roles
    const updatedPlayers = players.map(p => ({
      ...p,
      isImpostor: selectedImpostorIds.includes(p.id)
    }));
    setPlayers(updatedPlayers);
    setCurrentPlayerIndex(0);

    if (mode === GameMode.FAMOUS) {
      setStage(GameStage.LOADING_AI);
      const word = await generateFamousPerson(language);
      setSecretWord(word);
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
      // All words submitted, pick one
      const pickedWord = newWords[Math.floor(Math.random() * newWords.length)];
      setSecretWord(pickedWord);
      setStage(GameStage.DISTRIBUTE);
    }
  };

  const handleNextPlayer = () => {
    setIsCardFlipped(false);
    setTimeout(() => {
      if (currentPlayerIndex < players.length - 1) {
        setCurrentPlayerIndex(prev => prev + 1);
      } else {
        setStage(GameStage.PLAYING);
      }
    }, 600);
  };

  const resetGame = () => {
    setStage(GameStage.SETUP);
    setPlayers(players.map(p => ({ ...p, isImpostor: false, word: undefined })));
    setSecretWord('');
    setImpostorIds([]);
    setCurrentPlayerIndex(0);
    setIsCardFlipped(false);
    setImpostorCount(1);
    setStartingPlayerIndex(0);
  };

  // --- Renders ---

  const renderSetup = () => {
    const maxImpostors = Math.max(1, Math.floor(players.length / 2));
    
    return (
      <div className="max-w-md mx-auto w-full space-y-8 animate-fade-in">
        <div className="text-center space-y-2 relative">
          <div className="absolute top-0 right-0">
             <div className="flex bg-game-card rounded-lg p-1 border border-white/5">
                <button 
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${language === 'en' ? 'bg-game-primary text-game-dark' : 'text-gray-400 hover:text-white'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLanguage('es')}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${language === 'es' ? 'bg-game-primary text-game-dark' : 'text-gray-400 hover:text-white'}`}
                >
                  ES
                </button>
             </div>
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-game-primary to-game-accent tracking-tighter drop-shadow-sm">
            {t.appTitle}
          </h1>
          <p className="text-gray-400">{t.setupSubtitle}</p>
        </div>

        <div className="space-y-4 bg-game-card p-6 rounded-2xl border border-white/5 shadow-xl">
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

          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {players.length === 0 && (
              <p className="text-center text-gray-600 py-4 italic">{t.noPlayers}</p>
            )}
            {players.map(player => (
              <div key={player.id} className="flex justify-between items-center bg-game-dark/50 p-3 rounded-lg border border-white/5 animate-fade-in hover:bg-game-dark/80 transition-colors">
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

          {/* Impostor Count Selection */}
          {players.length >= MIN_PLAYERS && (
             <div className="flex items-center justify-between bg-game-dark/30 p-4 rounded-xl border border-white/5 mt-4">
                <div className="flex flex-col">
                    <span className="text-gray-200 font-bold text-sm">{t.numImpostors}</span>
                    <span className="text-gray-500 text-xs">{t.recommended}: {Math.ceil(players.length / 5)}</span>
                </div>
                <div className="flex items-center gap-4 bg-game-dark rounded-lg p-1.5 border border-white/5">
                   <button 
                     onClick={() => updateImpostorCount(-1)}
                     disabled={impostorCount <= 1}
                     className="p-1.5 hover:bg-white/10 rounded-md text-game-primary disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                   >
                     <Minus size={18} />
                   </button>
                   <span className="font-bold text-lg w-4 text-center text-white">{impostorCount}</span>
                   <button 
                      onClick={() => updateImpostorCount(1)}
                      disabled={impostorCount >= maxImpostors}
                      className="p-1.5 hover:bg-white/10 rounded-md text-game-primary disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                   >
                     <Plus size={18} />
                   </button>
                </div>
             </div>
          )}
        </div>

        <div className="space-y-3">
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
    <div className="max-w-md mx-auto w-full space-y-6 text-center animate-fade-in">
       <h2 className="text-3xl font-black text-white mb-8">{t.chooseMode}</h2>
       
       <button 
        onClick={() => selectMode(GameMode.FAMOUS)}
        disabled={isLoading}
        className="w-full bg-gradient-to-br from-purple-900/50 to-indigo-900/50 p-6 rounded-2xl border border-white/10 hover:border-game-accent hover:bg-white/5 transition-all hover:scale-[1.02] group text-left relative overflow-hidden"
       >
         <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity rotate-12">
           <Crown size={80} />
         </div>
         <h3 className="text-xl font-bold text-white mb-1">{t.modeFamous}</h3>
         <p className="text-gray-400 text-sm leading-relaxed pr-12">
           {t.modeFamousDesc(impostorCount)}
         </p>
       </button>

       <button 
        onClick={() => selectMode(GameMode.CUSTOM)}
        disabled={isLoading}
        className="w-full bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 rounded-2xl border border-white/10 hover:border-game-primary hover:bg-white/5 transition-all hover:scale-[1.02] group text-left relative overflow-hidden"
       >
         <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity rotate-12">
           <Wand2 size={80} />
         </div>
         <h3 className="text-xl font-bold text-white mb-1">{t.modeCustom}</h3>
         <p className="text-gray-400 text-sm leading-relaxed pr-12">
           {t.modeCustomDesc}
         </p>
       </button>

       <div className="pt-4">
          <Button variant="ghost" onClick={() => setStage(GameStage.SETUP)}>{t.back}</Button>
       </div>
    </div>
  );

  const renderCustomInput = () => {
    const currentPlayer = players[customInputIndex];
    return (
      <div className="max-w-md mx-auto w-full space-y-6 animate-fade-in">
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
              placeholder="e.g. Batman"
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
    
    // Content for the card back (Revealed state)
    const cardBackContent = (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-fade-in">
        {isCurrentUserImpostor ? (
          <>
            <div className="w-20 h-20 bg-game-danger/20 rounded-full flex items-center justify-center text-game-danger mb-2 animate-bounce">
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
            <h2 className="text-3xl font-black text-game-dark mt-2 break-words w-full px-2">{secretWord}</h2>
            <div className="px-4 py-2 bg-game-success/10 rounded-lg text-game-success text-sm font-bold mt-2">
              {t.findImpostor}
            </div>
          </>
        )}
      </div>
    );

    // Content for the card front (Hidden state)
    const cardFrontContent = (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
             <Smartphone size={80} className="text-white opacity-80" />
             <div className="absolute -bottom-2 -right-2 bg-white text-game-primary rounded-full p-1 shadow-lg animate-pulse">
                <ArrowRight size={20} />
             </div>
        </div>
        <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-1">{t.passPhone(player.name)}</h3>
            <p className="text-white/60 text-sm">{t.tapToReveal}</p>
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
                isFlipped={isCardFlipped} 
                onFlip={() => !isCardFlipped && setIsCardFlipped(true)}
                frontContent={cardFrontContent}
                backContent={cardBackContent}
                locked={isCardFlipped}
            />
        </div>

        <div className="h-16 w-full max-w-xs flex items-center justify-center transition-opacity duration-300">
            {isCardFlipped ? (
                 <Button 
                    fullWidth 
                    onClick={handleNextPlayer}
                    className="animate-fade-in shadow-xl"
                 >
                    {currentPlayerIndex < players.length - 1 ? t.nextPlayer : t.startGame}
                 </Button>
            ) : (
                <p className="text-gray-600 text-sm italic animate-pulse">{t.waitingFor(player.name)}</p>
            )}
        </div>
      </div>
    );
  };

  const renderPlaying = () => {
    const startingPlayer = players[startingPlayerIndex];
    
    return (
      <div className="max-w-md mx-auto w-full text-center space-y-8 animate-fade-in">
          <div className="space-y-4">
              <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-game-primary to-game-accent rounded-full flex items-center justify-center shadow-2xl shadow-game-primary/30">
                  <span className="text-4xl">🤔</span>
              </div>
              <h2 className="text-4xl font-black text-white">{t.discuss}</h2>
              <p className="text-xl text-gray-300">{t.discussDesc(impostorCount)}</p>
          </div>

          <div className="bg-gradient-to-r from-game-primary/20 to-purple-500/20 p-1 rounded-2xl">
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

          <div className="bg-game-card p-6 rounded-2xl border border-white/5 text-left space-y-3">
              <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">{t.alivePlayers}</h3>
              <div className="flex flex-wrap gap-2">
                  {players.map(p => (
                      <span key={p.id} className="bg-game-dark px-3 py-1.5 rounded-lg text-gray-300 text-sm border border-white/5">
                          {p.name}
                      </span>
                  ))}
              </div>
          </div>

          <Button variant="danger" fullWidth onClick={() => setStage(GameStage.REVEAL)} className="py-4 text-lg">
              {t.revealBtn(impostorCount)}
          </Button>
      </div>
    );
  };

  const renderReveal = () => (
    <div className="max-w-md mx-auto w-full text-center space-y-8 animate-fade-in">
        <div className="space-y-2">
            <h2 className="text-3xl font-black text-white">{t.gameOver}</h2>
            <p className="text-gray-400">{t.secretWas}</p>
            <div className="text-3xl font-bold text-game-primary bg-game-primary/10 py-3 rounded-xl border border-game-primary/20">
                {secretWord}
            </div>
        </div>

        <div className="space-y-3">
            {players.map(p => (
                <div 
                    key={p.id} 
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                        p.isImpostor 
                        ? 'bg-game-danger/10 border-game-danger/50' 
                        : 'bg-game-card border-white/5'
                    }`}
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

        <Button fullWidth onClick={resetGame} className="py-4 gap-2 flex items-center justify-center">
            <RotateCcw size={20} /> {t.playAgain}
        </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-game-dark text-game-text p-6 flex items-center justify-center">
      {stage === GameStage.SETUP && renderSetup()}
      {stage === GameStage.MODE_SELECT && renderModeSelect()}
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
  );
}
