
import React, { useState } from 'react';
import { Game } from './components/Game';
import { GameState } from './types';
import { Gamepad2, Trophy, Flame, Users } from 'lucide-react';
import { generateCharacterTrashTalk } from './services/gemini';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [winner, setWinner] = useState<number | null>(null);
  const [trashTalk, setTrashTalk] = useState<string>("");

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setWinner(null);
    setTrashTalk("");
  };

  const handleGameOver = async (winnerId: number) => {
    setWinner(winnerId);
    setGameState(GameState.GAME_OVER);
    
    // Get AI Trash talk
    const wName = winnerId === 1 ? "Neon Blade" : "Iron Titan";
    const lName = winnerId === 1 ? "Iron Titan" : "Neon Blade";
    const talk = await generateCharacterTrashTalk(wName, lName);
    setTrashTalk(talk);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative p-4">
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
      <div className="scanline"></div>

      {gameState === GameState.MENU && (
        <div className="z-20 max-w-2xl w-full bg-slate-800/90 backdrop-blur border border-slate-600 rounded-xl p-8 shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"></div>
          
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-600 mb-4 font-display tracking-tighter drop-shadow-sm">
            GEMINI ARENA
          </h1>
          <p className="text-slate-400 text-lg mb-8 font-light">
            Real-time AI Commentary powered by Google Gemini
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors group">
               <div className="flex justify-center mb-4">
                 <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Gamepad2 size={32} className="text-white" />
                 </div>
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Local Multiplayer</h3>
               <p className="text-sm text-slate-400">1v1 on the same keyboard. Challenge a friend!</p>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 hover:border-purple-500 transition-colors group">
               <div className="flex justify-center mb-4">
                 <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Flame size={32} className="text-white" />
                 </div>
               </div>
               <h3 className="text-xl font-bold text-white mb-2">AI Shoutcaster</h3>
               <p className="text-sm text-slate-400">Gemini analyzes every hit and KO to provide live commentary.</p>
            </div>
          </div>

          <button 
            onClick={startGame}
            className="relative group px-12 py-4 bg-white text-black font-bold text-xl rounded-full hover:scale-105 transition-transform active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              ENTER THE ARENA <Users size={20} />
            </span>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 blur-lg transition-opacity -z-10"></div>
          </button>
        </div>
      )}

      {gameState === GameState.PLAYING && (
        <div className="z-20 flex flex-col items-center">
           <div className="mb-4 flex gap-8 text-slate-400 text-sm font-mono bg-black/40 px-6 py-2 rounded-full backdrop-blur">
              <span><strong className="text-blue-400">P1:</strong> WASD + F (Atk) + G (Spec)</span>
              <span className="w-px h-4 bg-slate-600"></span>
              <span><strong className="text-red-400">P2:</strong> Arrows + K (Atk) + L (Spec)</span>
           </div>
           <Game onGameOver={handleGameOver} />
        </div>
      )}

      {gameState === GameState.GAME_OVER && (
        <div className="z-20 text-center animate-in fade-in zoom-in duration-300">
           <Trophy size={80} className="text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
           <h2 className="text-5xl font-black text-white mb-2 font-display">GAME SET!</h2>
           <p className="text-3xl text-blue-400 mb-8 font-bold">PLAYER {winner} WINS</p>
           
           {trashTalk && (
             <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-600 max-w-md mx-auto mb-8 relative">
                <div className="absolute -top-3 -left-3 text-6xl opacity-20">"</div>
                <p className="text-xl italic text-slate-200 font-serif">
                   {trashTalk}
                </p>
                <div className="mt-2 text-sm text-right text-slate-400">- {winner === 1 ? 'Neon Blade' : 'Iron Titan'} (Gemini AI)</div>
             </div>
           )}

           <button 
            onClick={() => setGameState(GameState.MENU)}
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors border border-slate-500"
           >
             Back to Menu
           </button>
        </div>
      )}
    </div>
  );
};

export default App;
