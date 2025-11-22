import React, { useState } from 'react';
import { VocabItem, AppView } from './types';
import { InputView } from './components/InputView';
import { FlashcardView } from './components/FlashcardView';
import { PronunciationView } from './components/PronunciationView';
import { BookOpen, Layers, Mic } from 'lucide-react';

const App: React.FC = () => {
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [currentView, setCurrentView] = useState<AppView>(AppView.INPUT);

  const handleSaveVocab = (items: VocabItem[]) => {
    setVocabList(items);
    setCurrentView(AppView.FLASHCARDS);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.INPUT:
        return <InputView onSave={handleSaveVocab} />;
      case AppView.FLASHCARDS:
        return vocabList.length > 0 ? (
          <FlashcardView items={vocabList} />
        ) : (
          <div className="text-center p-10 text-slate-500">
            Please add vocabulary first.
          </div>
        );
      case AppView.PRONUNCIATION:
        return vocabList.length > 0 ? (
          <PronunciationView items={vocabList} />
        ) : (
           <div className="text-center p-10 text-slate-500">
            Please add vocabulary first.
          </div>
        );
      default:
        return <InputView onSave={handleSaveVocab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
                <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                    <BookOpen className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">LinguaFlash</h1>
            </div>
            
            {/* Nav */}
            <nav className="flex space-x-1">
                <button 
                    onClick={() => setCurrentView(AppView.INPUT)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === AppView.INPUT ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Input
                </button>
                <button 
                    onClick={() => setCurrentView(AppView.FLASHCARDS)}
                    disabled={vocabList.length === 0}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === AppView.FLASHCARDS ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700 disabled:opacity-40'}`}
                >
                    Flashcards
                </button>
                <button 
                    onClick={() => setCurrentView(AppView.PRONUNCIATION)}
                    disabled={vocabList.length === 0}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === AppView.PRONUNCIATION ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700 disabled:opacity-40'}`}
                >
                    Pronunciation
                </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>

      {/* Footer status */}
      <footer className="bg-white border-t border-slate-200 py-4">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-slate-400">
            {vocabList.length > 0 
                ? `Loaded ${vocabList.length} words. Powered by Gemini AI.` 
                : 'Ready to learn? Start by adding vocabulary.'}
        </div>
      </footer>
    </div>
  );
};

export default App;
