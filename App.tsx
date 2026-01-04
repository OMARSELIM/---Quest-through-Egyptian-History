
import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, HelpCircle, History, Sparkles, RefreshCcw, Scroll, Award, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Era, Riddle, GameState } from './types';
import { generateRiddle, checkAnswerWithAI } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    currentRiddle: null,
    loading: false,
    feedback: 'neutral',
    attempts: 0,
    showHint: false,
    history: []
  });

  const [selectedEra, setSelectedEra] = useState<Era | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFunFact, setShowFunFact] = useState(false);

  const fetchNewRiddle = useCallback(async (era: Era) => {
    setGameState(prev => ({ ...prev, loading: true, feedback: 'neutral', attempts: 0, showHint: false }));
    setShowFunFact(false);
    setSelectedOption(null);
    try {
      const riddle = await generateRiddle(era);
      setGameState(prev => ({ ...prev, currentRiddle: riddle, loading: false }));
    } catch (err) {
      console.error(err);
      setGameState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const handleStartGame = (era: Era) => {
    setSelectedEra(era);
    fetchNewRiddle(era);
  };

  const handleOptionClick = async (option: string) => {
    if (!gameState.currentRiddle || gameState.feedback === 'correct' || gameState.loading) return;

    setSelectedOption(option);
    setGameState(prev => ({ ...prev, loading: true }));
    
    const isCorrect = await checkAnswerWithAI(option, gameState.currentRiddle.answer, gameState.currentRiddle.question);
    
    if (isCorrect) {
      setGameState(prev => ({
        ...prev,
        score: prev.score + Math.max(2, 10 - (prev.attempts * 3)),
        feedback: 'correct',
        loading: false,
        history: [{ question: prev.currentRiddle!.question, correct: true }, ...prev.history]
      }));
      setShowFunFact(true);
    } else {
      setGameState(prev => ({
        ...prev,
        feedback: 'incorrect',
        attempts: prev.attempts + 1,
        loading: false,
        showHint: prev.attempts >= 0 // Show hint after first wrong try
      }));
      setTimeout(() => {
        setGameState(prev => ({ ...prev, feedback: 'neutral' }));
        setSelectedOption(null);
      }, 1500);
    }
  };

  const resetGame = () => {
    setSelectedEra(null);
    setGameState({
      score: 0,
      currentRiddle: null,
      loading: false,
      feedback: 'neutral',
      attempts: 0,
      showHint: false,
      history: []
    });
  };

  if (!selectedEra) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f8f1e5]">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="relative inline-block">
             <Scroll className="w-20 h-20 text-[#8b4513] mx-auto opacity-20 absolute -top-10 -left-10 transform -rotate-12" />
             <h1 className="text-5xl md:text-6xl font-bold historical-font text-[#2c1810] relative z-10">
               ألغاز تاريخ مصر
             </h1>
             <div className="h-1 w-32 bg-[#c19a6b] mx-auto mt-4 rounded-full"></div>
          </div>
          
          <p className="text-xl text-[#5d4037] leading-relaxed max-w-lg mx-auto">
            اختر عصراً تاريخياً واختبر معلوماتك من خلال الألغاز المشوقة.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(Era).map((era) => (
              <button
                key={era}
                onClick={() => handleStartGame(era)}
                className="group p-6 bg-white border-2 border-[#d7ccc8] rounded-2xl shadow-sm hover:shadow-md hover:border-[#c19a6b] transition-all text-right flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold historical-font text-[#2c1810]">{era}</span>
                  <Sparkles className="w-5 h-5 text-[#c19a6b] group-hover:scale-125 transition-transform" />
                </div>
                <span className="text-sm text-[#8d6e63]">استكشف أسرار {era}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f1e5] p-4 md:p-8">
      <header className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4 mb-8">
        <button 
          onClick={resetGame}
          className="flex items-center gap-2 text-[#5d4037] hover:text-[#2c1810] transition-colors font-bold"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>الرئيسية</span>
        </button>

        <div className="flex items-center gap-6">
          <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-[#d7ccc8] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="font-bold text-[#2c1810] tracking-wider">{gameState.score} نقطة</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto space-y-6">
        <div className={`bg-white rounded-3xl shadow-xl p-6 md:p-10 border-4 transition-all duration-300 relative overflow-hidden ${
          gameState.feedback === 'correct' ? 'border-green-500 bg-green-50/30' : 
          gameState.feedback === 'incorrect' ? 'border-red-500 animate-shake' : 'border-transparent'
        }`}>
          {gameState.loading && !gameState.currentRiddle ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#c19a6b] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[#8d6e63] font-medium animate-pulse">يتم تحضير اللغز التالي...</p>
            </div>
          ) : gameState.currentRiddle ? (
            <div className="space-y-8">
              <div className="space-y-4">
                <span className="inline-block px-4 py-1 bg-[#fdf6e3] text-[#8b4513] rounded-full text-xs font-black uppercase tracking-widest border border-[#c19a6b]/30">
                  {gameState.currentRiddle.era}
                </span>
                <h2 className="text-2xl md:text-3xl leading-snug text-[#2c1810] historical-font font-bold">
                  {gameState.currentRiddle.question}
                </h2>
              </div>

              {gameState.showHint && gameState.feedback !== 'correct' && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3 animate-fadeIn">
                  <HelpCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-amber-800 mb-1 text-sm">تلميح لمساعدتك:</p>
                    <p className="text-amber-900 leading-relaxed">{gameState.currentRiddle.hints[Math.min(gameState.attempts - 1, 2)]}</p>
                  </div>
                </div>
              )}

              {gameState.feedback !== 'correct' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gameState.currentRiddle.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick(option)}
                      disabled={gameState.loading}
                      className={`p-5 rounded-2xl border-2 transition-all text-right font-bold text-lg flex items-center justify-between group
                        ${selectedOption === option && gameState.feedback === 'incorrect' 
                          ? 'bg-red-50 border-red-500 text-red-700' 
                          : 'bg-[#fdf6e3] border-[#d7ccc8] text-[#2c1810] hover:border-[#c19a6b] hover:bg-white'}
                        ${gameState.loading && selectedOption !== option ? 'opacity-50' : 'opacity-100'}
                      `}
                    >
                      <span>{option}</span>
                      {selectedOption === option && gameState.loading ? (
                        <div className="w-5 h-5 border-2 border-[#c19a6b] border-t-transparent rounded-full animate-spin"></div>
                      ) : selectedOption === option && gameState.feedback === 'incorrect' ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-[#c19a6b] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-6 animate-fadeIn">
                   <div className="bg-green-100 p-8 rounded-2xl border-2 border-green-500 text-center space-y-4">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                      </div>
                      <h3 className="text-3xl font-bold text-green-800 historical-font">أحسنت! إجابة دقيقة</h3>
                      <p className="text-green-700 text-xl font-bold">{gameState.currentRiddle.answer}</p>
                   </div>
                   
                   {showFunFact && (
                     <div className="bg-white p-6 rounded-2xl border-2 border-[#d7ccc8] shadow-inner relative">
                        <div className="absolute -top-3 right-6 px-3 py-1 bg-[#c19a6b] text-white text-xs font-black rounded-md uppercase tracking-tighter">معلومة تاريخية</div>
                        <p className="text-[#5d4037] leading-relaxed italic text-lg">
                          "{gameState.currentRiddle.funFact}"
                        </p>
                     </div>
                   )}

                   <button
                    onClick={() => fetchNewRiddle(selectedEra)}
                    className="w-full p-5 bg-[#2c1810] text-white rounded-2xl font-bold text-xl hover:bg-[#5d4037] transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
                   >
                     <RefreshCcw className="w-6 h-6" />
                     <span>اللغز التالي</span>
                   </button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="bg-[#2c1810] p-6 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center gap-4">
              <Award className="w-10 h-10 text-yellow-500" />
              <div className="text-right">
                 <p className="text-xs opacity-60 uppercase font-black tracking-widest">لقبك الحالي</p>
                 <p className="text-2xl font-bold historical-font">
                   {gameState.score >= 100 ? "خبير في تاريخ مصر" : 
                    gameState.score >= 50 ? "باحث تاريخي" : "مؤرخ مبتدئ"}
                 </p>
              </div>
           </div>
           <div className="h-px w-full md:w-px md:h-12 bg-white/20"></div>
           <div className="flex items-center gap-3">
              <History className="w-5 h-5 opacity-60" />
              <span className="text-sm font-medium">تم حل {gameState.history.length} ألغاز بنجاح</span>
           </div>
        </div>
      </main>

      <footer className="max-w-4xl mx-auto mt-12 text-center text-[#8d6e63] text-sm font-medium opacity-60">
        <p>مصمم لمحبي التاريخ المصري - جميع الحقوق محفوظة {new Date().getFullYear()}</p>
      </footer>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;