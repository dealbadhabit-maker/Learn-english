import React, { useState, useEffect } from 'react';
import { VocabItem } from '../types';
import { playPronunciation, prefetchPronunciation } from '../services/geminiService';
import { Volume2, Loader2, PlayCircle } from 'lucide-react';

interface PronunciationViewProps {
  items: VocabItem[];
}

export const PronunciationView: React.FC<PronunciationViewProps> = ({ items }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  // Prefetch audio for items in background when component mounts or items change
  useEffect(() => {
    let mounted = true;
    const prefetch = async () => {
      for (const item of items) {
        if (!mounted) break;
        // Prefetch one by one to avoid overwhelming the network
        await prefetchPronunciation(item.english);
        // Small delay to yield to main thread if needed
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    };
    prefetch();
    
    return () => { mounted = false; };
  }, [items]);

  const handlePlay = async (item: VocabItem) => {
    if (playingId) return; // Prevent multiple clicks
    
    setPlayingId(item.id);
    setErrorId(null);
    
    try {
      await playPronunciation(item.english);
    } catch (error) {
      console.error("Playback failed", error);
      setErrorId(item.id);
    } finally {
      setPlayingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800">Pronunciation Practice</h2>
            <p className="text-slate-600 mt-1">Click on any phrase to hear the AI native pronunciation.</p>
        </div>
        
        <div className="divide-y divide-slate-100">
            {items.map((item) => (
                <div 
                    key={item.id}
                    onClick={() => handlePlay(item)}
                    className={`group p-4 flex items-center justify-between cursor-pointer transition-colors ${playingId === item.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                    <div className="flex-1">
                        <p className="text-lg font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                            {item.english}
                        </p>
                        <p className="text-slate-500 text-sm mt-0.5">
                            {item.vietnamese}
                        </p>
                    </div>
                    
                    <div className="flex items-center px-4">
                        {playingId === item.id ? (
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        ) : errorId === item.id ? (
                            <span className="text-xs text-red-500 font-medium">Error</span>
                        ) : (
                            <div className="p-2 rounded-full bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                                <Volume2 className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {items.length === 0 && (
            <div className="p-12 text-center text-slate-400">
                No vocabulary loaded. Go to the Input tab to add words.
            </div>
        )}
    </div>
  );
};