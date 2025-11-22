import React, { useState, useEffect, useCallback } from 'react';
import { VocabItem, FlashcardSide } from '../types';
import { ArrowRight, ArrowLeft, RotateCw, Shuffle, Check, X, Send } from 'lucide-react';

interface FlashcardViewProps {
  items: VocabItem[];
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({ items }) => {
  const [shuffledItems, setShuffledItems] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [frontSide, setFrontSide] = useState<FlashcardSide>(FlashcardSide.ENGLISH);
  
  // Input challenge state
  const [userGuess, setUserGuess] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');

  const shuffle = useCallback(() => {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    setShuffledItems(array);
    setCurrentIndex(0);
    setIsFlipped(false);
    resetInput();
  }, [items]);

  const resetInput = () => {
    setUserGuess('');
    setFeedback('idle');
  };

  useEffect(() => {
    shuffle();
  }, [shuffle]);

  // Reset input when navigating or changing sides
  useEffect(() => {
    resetInput();
  }, [currentIndex, frontSide]);

  const handleNext = () => {
    if (currentIndex < shuffledItems.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userGuess.trim()) return;

    const currentItem = shuffledItems[currentIndex];
    
    // Simple normalization for comparison: lower case, trim, remove basic punctuation
    const normalize = (str: string) => str.toLowerCase().trim().replace(/[.,!?;:]/g, '');
    const guess = normalize(userGuess);
    const answer = normalize(currentItem.english);

    if (guess === answer) {
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }
  };

  if (shuffledItems.length === 0) return null;

  const currentItem = shuffledItems[currentIndex];
  
  const frontContent = frontSide === FlashcardSide.ENGLISH ? currentItem.english : currentItem.vietnamese;
  const backContent = frontSide === FlashcardSide.ENGLISH ? currentItem.vietnamese : currentItem.english;

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center space-y-6">
      {/* Controls */}
      <div className="w-full flex justify-between items-center px-4 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Front:</span>
            <select 
                value={frontSide}
                onChange={(e) => {
                    setFrontSide(e.target.value as FlashcardSide);
                    setIsFlipped(false);
                }}
                className="text-sm border-slate-200 rounded-md focus:ring-blue-500"
            >
                <option value={FlashcardSide.ENGLISH}>English</option>
                <option value={FlashcardSide.VIETNAMESE}>Vietnamese</option>
            </select>
        </div>
        <button onClick={shuffle} className="p-2 text-slate-500 hover:text-blue-600 transition-colors" title="Shuffle">
            <Shuffle className="w-5 h-5" />
        </button>
      </div>

      {/* Card */}
      <div className="group w-full aspect-[3/2] perspective-1000 cursor-pointer" onClick={handleFlip}>
        <div className={`relative w-full h-full transition-all duration-500 transform-style-3d shadow-xl rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center p-8 shadow-lg">
             <div className="text-center w-full">
                <span className="text-sm uppercase tracking-widest opacity-70 mb-2 block">{frontSide}</span>
                <p className="text-3xl md:text-4xl font-bold break-words">{frontContent}</p>
             </div>
             <div className="absolute bottom-4 right-4 opacity-50">
                <RotateCw className="w-5 h-5" />
             </div>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-white text-slate-800 rounded-2xl flex items-center justify-center p-8 shadow-lg border border-slate-200">
             <div className="text-center w-full">
                <span className="text-sm uppercase tracking-widest text-slate-400 mb-2 block">
                    {frontSide === FlashcardSide.ENGLISH ? FlashcardSide.VIETNAMESE : FlashcardSide.ENGLISH}
                </span>
                <p className="text-3xl md:text-4xl font-bold text-slate-800 break-words">{backContent}</p>
             </div>
          </div>

        </div>
      </div>

      {/* Input Challenge (Only visible when Front is Vietnamese) */}
      {frontSide === FlashcardSide.VIETNAMESE && (
        <div className="w-full animate-in fade-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleCheck} className="relative">
                <input
                    type="text"
                    value={userGuess}
                    onChange={(e) => {
                        setUserGuess(e.target.value);
                        if (feedback !== 'idle') setFeedback('idle');
                    }}
                    placeholder="Type the English phrase..."
                    className={`w-full p-4 pr-12 rounded-xl border-2 shadow-sm outline-none transition-all font-medium ${
                        feedback === 'correct' 
                            ? 'border-green-500 bg-green-50 text-green-900 placeholder-green-300'
                            : feedback === 'incorrect'
                            ? 'border-red-500 bg-red-50 text-red-900'
                            : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
                    }`}
                    autoCapitalize="off"
                    autoComplete="off"
                />
                <button
                    type="submit"
                    disabled={!userGuess.trim()}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                        feedback === 'correct' 
                            ? 'text-green-600'
                            : 'text-slate-400 hover:text-blue-600'
                    }`}
                >
                    {feedback === 'correct' ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                </button>
            </form>
            
            {/* Feedback message area - fixed height to prevent layout shift */}
            <div className="h-6 mt-2">
                {feedback === 'correct' && (
                    <p className="text-center text-green-600 font-semibold text-sm flex items-center justify-center gap-1 animate-in fade-in slide-in-from-bottom-1">
                        <Check className="w-4 h-4" /> Correct!
                    </p>
                )}
                {feedback === 'incorrect' && (
                    <p className="text-center text-red-500 font-semibold text-sm flex items-center justify-center gap-1 animate-in fade-in slide-in-from-bottom-1">
                        <X className="w-4 h-4" /> Incorrect. Try again!
                    </p>
                )}
            </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-8">
        <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-4 rounded-full bg-white shadow-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-700"
        >
            <ArrowLeft className="w-6 h-6" />
        </button>
        
        <span className="text-lg font-medium text-slate-500">
            {currentIndex + 1} / {shuffledItems.length}
        </span>

        <button 
            onClick={handleNext}
            disabled={currentIndex === shuffledItems.length - 1}
            className="p-4 rounded-full bg-white shadow-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-slate-700"
        >
            <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};