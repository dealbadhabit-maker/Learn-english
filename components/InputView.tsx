import React, { useState } from 'react';
import { VocabItem } from '../types';
import { parseVocabularyInput, prefetchAllPronunciations } from '../services/geminiService';
import { Loader2, Sparkles } from 'lucide-react';

interface InputViewProps {
  onSave: (items: VocabItem[]) => void;
}

export const InputView: React.FC<InputViewProps> = ({ onSave }) => {
  const [rawInput, setRawInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!rawInput.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const items = await parseVocabularyInput(rawInput);
      
      // Start prefetching audio in the background immediately
      prefetchAllPronunciations(items);
      
      onSave(items);
    } catch (err: any) {
      setError(err.message || "Failed to process input. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Create Your Vocabulary List</h2>
        <p className="text-slate-600">
          Enter 10-20 English phrases below. You can add Vietnamese meanings separated by a dash, 
          or just type the English and let AI translate it for you.
        </p>
      </div>

      <div className="relative">
        <textarea
          className="w-full h-64 p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
          placeholder={`Example:\nHello - Xin chào\nGood morning\nSee you later\n...`}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
        />
        
        {error && (
          <div className="mt-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleProcess}
            disabled={isLoading || !rawInput.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Flashcards
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};