 import React, { useState, useEffect } from "react";
import {
  Search,
  Volume2,
  History,
  Trash2,
  BookOpen,
  Sparkles,
  ArrowRight,
  Globe,
} from "lucide-react";

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState(null);
  const [hindiMeaning, setHindiMeaning] = useState("");
  const [generatedSentence, setGeneratedSentence] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem("recent_words");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Backend URL
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // Save recent searches
  useEffect(() => {
    localStorage.setItem(
      "recent_words",
      JSON.stringify(recentSearches)
    );
  }, [recentSearches]);

  // ==========================================
  // SEARCH WORD
  // ==========================================

  const handleSearch = async (wordToSearch) => {
    const query = (wordToSearch || searchTerm).trim();

    if (!query) {
      setError("Please enter an English word.");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);
    setHindiMeaning("");
    setGeneratedSentence("");

    try {
      const url = `${API_BASE_URL}/api/dictionary/${encodeURIComponent(
        query
      )}`;

      const res = await fetch(url);

      let result;

      try {
        result = await res.json();
      } catch {
        throw new Error(
          "Server ne valid response nahi diya."
        );
      }

      if (!res.ok || !result.success) {
        throw new Error(
          result.message || "Word nahi mila."
        );
      }

      const wordData = result.data;

      if (!wordData) {
        throw new Error(
          "Dictionary data nahi mila."
        );
      }

      setData(wordData);

      setHindiMeaning(result.hindiMeaning || "");

      // ==========================================
      // SAVE TO RECENT SEARCHES
      // ==========================================

      setRecentSearches((prev) => {
        const filtered = prev.filter(
          (item) =>
            item.toLowerCase() !== query.toLowerCase()
        );

        return [query, ...filtered].slice(0, 10);
      });

      // ==========================================
      // FIND EXAMPLE SENTENCE
      // ==========================================

      let sentence = "";

      for (const meaning of wordData.meanings || []) {
        for (const definition of meaning.definitions || []) {
          if (definition.example) {
            sentence = definition.example;
            break;
          }
        }

        if (sentence) {
          break;
        }
      }

      setGeneratedSentence(
        sentence ||
          `The word "${wordData.word}" is commonly used in English.`
      );
    } catch (err) {
      console.error("Search Error:", err);

      if (err instanceof TypeError) {
        setError(
          "Backend server se connection nahi ho pa raha. Please check karein ki Express server localhost:5000 par running hai."
        );
      } else {
        setError(
          err.message || "Server error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PLAY AUDIO
  // ==========================================

  const playAudio = () => {
    if (!data) return;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const phonetics = data.phonetics || [];

    const audioObj = phonetics.find(
      (p) =>
        p.audio &&
        p.audio.trim() !== ""
    );

    if (audioObj && audioObj.audio) {
      const audio = new Audio(
        audioObj.audio
      );

      audio.preload = "auto";

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          speakNative(data.word);
        });
      }
    } else {
      speakNative(data.word);
    }
  };

  // ==========================================
  // NATIVE SPEECH
  // ==========================================

  const speakNative = (text) => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    const voices =
      window.speechSynthesis.getVoices();

    const usVoice = voices.find(
      (voice) =>
        voice.lang.includes("en-US") ||
        voice.lang.includes("en")
    );

    if (usVoice) {
      utterance.voice = usVoice;
    }

    window.speechSynthesis.speak(
      utterance
    );
  };

  // ==========================================
  // CLEAR HISTORY
  // ==========================================

  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem("recent_words");
  };

  // ==========================================
  // RETURN
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white">

      {/* HEADER */}

      <header className="sticky top-0 z-10 backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">

          <div className="flex items-center gap-3">

            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>

            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              LexiQuest

              <span className="text-xs font-normal text-indigo-400 border border-indigo-800 bg-indigo-950/40 px-2 py-0.5 rounded-full">
                Hindi + Eng
              </span>
            </h1>

          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* SEARCH BAR */}

        <div className="relative">

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >

            <div className="relative flex-1">

              <input
                type="text"
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                placeholder="Search any English word..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />

              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />

            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-2xl shadow-md transition disabled:opacity-50"
            >
              {loading
                ? "Searching..."
                : "Search"}
            </button>

          </form>

        </div>

        {/* RECENT SEARCHES */}

        {recentSearches.length > 0 && (
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-800/60 shadow-sm">

            <div className="flex justify-between items-center mb-3">

              <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">

                <History className="w-4 h-4" />

                <span>
                  Recent Searches
                </span>

              </div>

              <button
                type="button"
                onClick={clearHistory}
                className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />

                Clear All
              </button>

            </div>

            <div className="flex flex-wrap gap-2">

              {recentSearches.map(
                (word, idx) => (
                  <button
                    type="button"
                    key={`${word}-${idx}`}
                    onClick={() => {
                      setSearchTerm(word);
                      handleSearch(word);
                    }}
                    className="px-3 py-1.5 text-sm rounded-xl bg-slate-700/80 text-slate-200 hover:bg-indigo-950/50 hover:text-indigo-300 transition"
                  >
                    {word}
                  </button>
                )
              )}

            </div>

          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900 text-rose-400 text-center font-medium">
            {error}
          </div>
        )}

        {/* DICTIONARY RESULTS */}

        {data && (
          <div className="space-y-6">

            {/* MAIN WORD CARD */}

            <div className="p-6 rounded-3xl bg-slate-800 border border-slate-700 shadow-sm flex justify-between items-start">

              <div>

                <h2 className="text-4xl font-extrabold capitalize text-indigo-400">
                  {data.word}
                </h2>

                {data.phonetic && (
                  <p className="text-sm font-mono text-slate-400 mt-1">
                    {data.phonetic}
                  </p>
                )}

                {hindiMeaning && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-900 text-amber-300 text-sm font-semibold">

                    <Globe className="w-4 h-4 text-amber-400" />

                    <span>
                      Hindi: {hindiMeaning}
                    </span>

                  </div>
                )}

              </div>

              <button
                type="button"
                onClick={playAudio}
                aria-label="Play pronunciation"
                className="p-4 rounded-2xl bg-indigo-950/60 text-indigo-400 hover:bg-indigo-600 hover:text-white transition"
              >
                <Volume2 className="w-6 h-6" />
              </button>

            </div>

            {/* SENTENCE EXAMPLE CARD */}

            {generatedSentence && (
              <div className="p-6 rounded-3xl bg-indigo-950/30 border border-indigo-900/50">

                <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">

                  <Sparkles className="w-5 h-5" />

                  <span>
                    Sentence Example
                  </span>

                </div>

                <p className="italic text-slate-300 text-lg">
                  "{generatedSentence}"
                </p>

              </div>
            )}

            {/* MEANINGS & DEFINITIONS */}

            <div className="space-y-6">

              {(data.meanings || []).map(
                (meaning, index) => (

                  <div
                    key={index}
                    className="p-6 rounded-3xl bg-slate-800 border border-slate-700 shadow-sm space-y-4"
                  >

                    <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-700 text-indigo-400">
                      {meaning.partOfSpeech}
                    </span>

                    <div className="space-y-3">

                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Definitions
                      </h3>

                      <ul className="space-y-3">

                        {(meaning.definitions || [])
                          .slice(0, 3)
                          .map(
                            (
                              def,
                              defIdx
                            ) => (

                              <li
                                key={defIdx}
                                className="flex gap-3 text-slate-200"
                              >

                                <ArrowRight className="w-4 h-4 text-indigo-500 mt-1 flex-shrink-0" />

                                <div>

                                  <p>
                                    {def.definition}
                                  </p>

                                  {def.example && (
                                    <p className="text-sm text-slate-400 mt-1 italic">
                                      Example: "
                                      {def.example}"
                                    </p>
                                  )}

                                </div>

                              </li>

                            )
                          )}

                      </ul>

                    </div>

                    {/* SYNONYMS */}

                    {meaning.synonyms?.length > 0 && (
                      <div>

                        <span className="text-xs font-semibold text-slate-400 uppercase block mb-2">
                          Synonyms
                        </span>

                        <div className="flex flex-wrap gap-2">

                          {meaning.synonyms
                            .slice(0, 6)
                            .map(
                              (
                                syn,
                                synIdx
                              ) => (

                                <button
                                  type="button"
                                  key={synIdx}
                                  onClick={() => {
                                    setSearchTerm(
                                      syn
                                    );
                                    handleSearch(
                                      syn
                                    );
                                  }}
                                  className="px-2.5 py-1 text-xs rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-900 cursor-pointer hover:bg-emerald-900/60 transition"
                                >
                                  {syn}
                                </button>

                              )
                            )}

                        </div>

                      </div>
                    )}

                    {/* ANTONYMS */}

                    {meaning.antonyms?.length > 0 && (
                      <div>

                        <span className="text-xs font-semibold text-slate-400 uppercase block mb-2">
                          Antonyms
                        </span>

                        <div className="flex flex-wrap gap-2">

                          {meaning.antonyms
                            .slice(0, 6)
                            .map(
                              (
                                ant,
                                antIdx
                              ) => (

                                <button
                                  type="button"
                                  key={antIdx}
                                  onClick={() => {
                                    setSearchTerm(
                                      ant
                                    );
                                    handleSearch(
                                      ant
                                    );
                                  }}
                                  className="px-2.5 py-1 text-xs rounded-lg bg-rose-950/40 text-rose-400 border border-rose-900 cursor-pointer hover:bg-rose-900/60 transition"
                                >
                                  {ant}
                                </button>

                              )
                            )}

                        </div>

                      </div>
                    )}

                  </div>
                )
              )}

            </div>

          </div>
        )}

      </main>
    </div>
  );
}