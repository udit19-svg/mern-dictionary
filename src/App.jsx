 import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Volume2, 
  Moon, 
  Sun, 
  History, 
  Trash2, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  Globe 
} from 'lucide-react';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState(null);
  const [hindiMeaning, setHindiMeaning] = useState('');
  const [generatedSentence, setGeneratedSentence] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem('recent_words');
    return saved ? JSON.parse(saved) : [];
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('recent_words', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const handleSearch = async (wordToSearch) => {
    const query = wordToSearch || searchTerm;
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setData(null);
    setHindiMeaning('');
    setGeneratedSentence('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/dictionary/${encodeURIComponent(query)}`);
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Word nahi mila');
      }

      const wordData = result.data;
      setData(wordData);
      setHindiMeaning(result.hindiMeaning);

      setRecentSearches(prev => {
        const filtered = prev.filter(item => item.toLowerCase() !== query.toLowerCase());
        return [query, ...filtered].slice(0, 10);
      });

      let sentence = "";
      for (const m of wordData.meanings) {
        for (const d of m.definitions) {
          if (d.example) {
            sentence = d.example;
            break;
          }
        }
        if (sentence) break;
      }
      setGeneratedSentence(sentence || `The word "${wordData.word}" is commonly used in English.`);

    } catch (err) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = () => {
    if (!data) return;

    // 1. Clear any stuck audio queue immediately
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const phonetics = data.phonetics || [];
    const audioObj = phonetics.find(p => p.audio && p.audio.trim() !== '');

    if (audioObj && audioObj.audio) {
      // Direct stream play without blocking
      const audio = new Audio(audioObj.audio);
      audio.preload = 'auto'; // Instant caching
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If network audio fails or takes time, fallback to native speech instantly
          speakNative(data.word);
        });
      }
    } else {
      speakNative(data.word);
    }
  };

  // Helper function for instant Native Speech synthesis
  const speakNative = (text) => {
    if (!('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95; // Speech speed optimize
    utterance.pitch = 1;

    // Load available voices instantly
    const voices = window.speechSynthesis.getVoices();
    const usVoice = voices.find(v => v.lang.includes('en-US') || v.lang.includes('en'));
    if (usVoice) {
      utterance.voice = usVoice;
    }

    window.speechSynthesis.speak(utterance);
  };
  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* HEADER */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              LexiQuest 
              <span className="text-xs font-normal text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                Hindi + Eng
              </span>
            </h1>
          </div>
          
          <button 
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Toggle Theme"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* SEARCH BAR */}
        <div className="relative">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2">
            <div className="relative flex-1">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search any English word..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-2xl shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* RECENT SEARCHES */}
        {recentSearches.length > 0 && (
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-sm transition">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                <History className="w-4 h-4" />
                <span>Recent Searches</span>
              </div>
              <button 
                onClick={() => { setRecentSearches([]); localStorage.removeItem('recent_words'); }} 
                className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((word, idx) => (
                <button 
                  key={idx} 
                  onClick={() => { setSearchTerm(word); handleSearch(word); }} 
                  className="px-3 py-1.5 text-sm rounded-xl bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300 transition"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-center font-medium">
            {error}
          </div>
        )}

        {/* DICTIONARY RESULTS */}
        {data && (
          <div className="space-y-6">
            
            {/* MAIN WORD CARD */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-start transition">
              <div>
                <h2 className="text-4xl font-extrabold capitalize text-indigo-600 dark:text-indigo-400">{data.word}</h2>
                {data.phonetic && <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-1">{data.phonetic}</p>}
                
                {hindiMeaning && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-sm font-semibold">
                    <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Hindi: {hindiMeaning}</span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={playAudio} 
                aria-label="Play pronunciation"
                className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>

            {/* SENTENCE EXAMPLE CARD */}
            {generatedSentence && (
              <div className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 transition">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Sentence Example</span>
                </div>
                <p className="italic text-slate-700 dark:text-slate-300 text-lg">"{generatedSentence}"</p>
              </div>
            )}

            {/* MEANINGS & DEFINITIONS */}
            <div className="space-y-6">
              {data.meanings.map((meaning, index) => (
                <div key={index} className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 transition">
                  <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400">
                    {meaning.partOfSpeech}
                  </span>
                  
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Definitions</h3>
                    <ul className="space-y-3">
                      {meaning.definitions.slice(0, 3).map((def, defIdx) => (
                        <li key={defIdx} className="flex gap-3 text-slate-800 dark:text-slate-200">
                          <ArrowRight className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />
                          <div>
                            <p>{def.definition}</p>
                            {def.example && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">Example: "{def.example}"</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* SYNONYMS */}
                  {meaning.synonyms?.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase block mb-2">Synonyms</span>
                      <div className="flex flex-wrap gap-2">
                        {meaning.synonyms.slice(0, 6).map((syn, synIdx) => (
                          <span 
                            key={synIdx} 
                            onClick={() => { setSearchTerm(syn); handleSearch(syn); }} 
                            className="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
                          >
                            {syn}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ANTONYMS */}
                  {meaning.antonyms?.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase block mb-2">Antonyms</span>
                      <div className="flex flex-wrap gap-2">
                        {meaning.antonyms.slice(0, 6).map((ant, antIdx) => (
                          <span 
                            key={antIdx} 
                            onClick={() => { setSearchTerm(ant); handleSearch(ant); }} 
                            className="px-2.5 py-1 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/60 transition"
                          >
                            {ant}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}