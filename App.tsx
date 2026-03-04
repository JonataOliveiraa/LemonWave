
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SOUND_LIST } from './constants';
import { SoundDefinition, SoundConfig, SavedSound } from './types';
import { audioEngine } from './services/audioEngine';
import { SoundControls } from './components/SoundControls';
import { CodeSnippet } from './components/CodeSnippet';
import { Library } from './components/Library';
import { Visualizer } from './components/Visualizer';
import LogoEmpty from './public/logo_empty.png'
const PAGE_SIZE = 50;

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSound, setSelectedSound] = useState<SoundDefinition>(SOUND_LIST[0]);
  const [config, setConfig] = useState<SoundConfig>({ pitch: 0, volume: 1 });
  const [savedItems, setSavedItems] = useState<SavedSound[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const observerTarget = useRef<HTMLDivElement>(null);

  // Load state from local storage
  useEffect(() => {
    const saved = localStorage.getItem('terraria-sounds-library');
    if (saved) setSavedItems(JSON.parse(saved));
    
    const favs = localStorage.getItem('terraria-sounds-favorites');
    if (favs) setFavorites(JSON.parse(favs));

    const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('terraria-sounds-library', JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    localStorage.setItem('terraria-sounds-favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark' : '';
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const filteredSounds = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    let result = SOUND_LIST.filter(s => 
      s.name.toLowerCase().includes(lowerSearch) || 
      s.category.toLowerCase().includes(lowerSearch)
    );
    
    if (showOnlyFavorites) {
      result = result.filter(s => favorites.includes(s.id));
    }
    
    return result;
  }, [searchTerm, showOnlyFavorites, favorites]);

  const visibleSounds = useMemo(() => {
    return filteredSounds.slice(0, visibleCount);
  }, [filteredSounds, visibleCount]);

  // Lazy loading observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && visibleCount < filteredSounds.length) {
          setVisibleCount(prev => prev + PAGE_SIZE);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, filteredSounds.length]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, showOnlyFavorites]);

  const handlePlay = async (sound: SoundDefinition = selectedSound, overrideConfig?: SoundConfig, isQuickPreview = false) => {
    if (isQuickPreview) setPlayingId(sound.id);
    
    const buffer = await audioEngine.loadSound(sound.url);
    if (buffer) {
      const p = overrideConfig ? overrideConfig.pitch : config.pitch;
      const v = overrideConfig ? overrideConfig.volume : config.volume;
      const source = audioEngine.play(buffer, p, v);
      
      source.onended = () => {
        if (isQuickPreview) setPlayingId(null);
      };
    } else {
      setPlayingId(null);
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    const newItem: SavedSound = {
      ...config,
      id: Date.now().toString(),
      soundName: selectedSound.name,
      timestamp: Date.now()
    };
    setSavedItems([newItem, ...savedItems]);
  };

  const handleApplySaved = (item: SavedSound) => {
    const original = SOUND_LIST.find(s => s.name === item.soundName);
    if (original) {
      setSelectedSound(original);
      setConfig({ pitch: item.pitch, volume: item.volume });
      handlePlay(original, { pitch: item.pitch, volume: item.volume });
    }
  };

  const handleUpdateLibraryItem = (updated: SavedSound) => {
    setSavedItems(prev => prev.map(item => item.id === updated.id ? updated : item));
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full github-bg-secondary">
      <div className="p-4 border-b border-[var(--border-default)]">
        <div className="flex items-center justify-between mb-4">
           <h2 className="text-sm font-semibold flex items-center gap-2 text-[var(--fg-default)]">
              <i className="ri-music-2-line"></i>
              Repository
           </h2>
           <button 
             onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
             className={`text-xs px-2 py-1 rounded border transition-colors ${showOnlyFavorites ? 'bg-[var(--fg-default)] text-[var(--bg-canvas)] border-transparent' : 'github-bg-tertiary border-[var(--border-default)] text-[var(--fg-muted)] hover:bg-[var(--border-default)]'}`}
           >
             <i className={showOnlyFavorites ? "ri-star-fill mr-1" : "ri-star-line mr-1"}></i>
             {favorites.length}
           </button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search sounds..."
            className="w-full bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded-md py-1.5 px-9 text-sm focus:border-[var(--accent-fg)] outline-none text-[var(--fg-default)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="ri-search-line absolute left-3 top-2 text-[var(--fg-muted)]"></i>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {visibleSounds.length === 0 ? (
          <div className="p-8 text-center text-[var(--fg-muted)] text-sm">
            <i className="ri-prohibited-line text-2xl mb-2 block"></i>
            Nothing found
          </div>
        ) : (
          visibleSounds.map((sound) => (
            <div
              key={sound.id}
              onClick={() => {
                setSelectedSound(sound);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`flex items-center justify-between px-4 py-2 border-b border-[var(--border-default)] cursor-pointer group transition-all ${
                selectedSound.id === sound.id ? 'github-bg-tertiary border-l-2 border-l-[var(--fg-default)]' : 'hover:github-bg-tertiary/50'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlay(sound, { pitch: 0, volume: 1 }, true);
                  }}
                  className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${playingId === sound.id ? 'bg-[var(--fg-default)] text-[var(--bg-canvas)]' : 'hover:github-bg-tertiary text-[var(--fg-muted)] border border-transparent hover:border-[var(--border-default)]'}`}
                >
                  <i className={playingId === sound.id ? "ri-pause-fill" : "ri-play-fill"}></i>
                </button>
                <div className="flex flex-col truncate">
                  <span className={`text-sm font-medium truncate ${selectedSound.id === sound.id ? 'text-[var(--fg-default)]' : 'text-[var(--fg-muted)]'}`}>
                    {sound.name}
                  </span>
                  <span className="text-[10px] text-[var(--fg-muted)] uppercase font-bold">{sound.category}</span>
                </div>
              </div>
              
              <button
                onClick={(e) => toggleFavorite(sound.id, e)}
                className={`p-1.5 rounded transition-opacity ${favorites.includes(sound.id) ? 'text-[#e3b341]' : 'text-[var(--fg-muted)] opacity-0 group-hover:opacity-100 hover:text-[#e3b341]'}`}
              >
                <i className={favorites.includes(sound.id) ? "ri-star-fill" : "ri-star-line"}></i>
              </button>
            </div>
          ))
        )}
        <div ref={observerTarget} className="h-10 w-full flex items-center justify-center text-[var(--fg-muted)] text-xs">
          {visibleCount < filteredSounds.length ? 'Loading...' : ''}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row h-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--fg-default)]">
      
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 github-bg-secondary border-b border-[var(--border-default)] sticky top-0 z-50">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-[var(--fg-default)]">
          <i className="ri-menu-2-line text-xl"></i>
        </button>
        <span className="font-bold text-sm">Sound Weaver</span>
        <button onClick={toggleTheme} className="w-10 h-10 rounded-full github-bg-tertiary flex items-center justify-center border border-[var(--border-default)]">
          <i className={theme === 'light' ? "ri-moon-line" : "ri-sun-line"}></i>
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-black/50" onClick={() => setIsSidebarOpen(false)}>
          <div className="w-80 h-full shadow-2xl animate-slide-in-left" onClick={e => e.stopPropagation()}>
             {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[350px] flex-col github-bg-secondary border-r border-[var(--border-default)] h-full">
        {sidebarContent}
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto flex flex-col h-full bg-[var(--bg-canvas)]">
        {/* Workspace Header */}
        <header className="px-8 py-6 github-bg-secondary border-b border-[var(--border-default)] hidden lg:flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-[var(--fg-default)] text-[var(--bg-canvas)] flex items-center justify-center">
                 <img src={LogoEmpty} alt="logo" className="h-7 w-7 image-pixelated [filter:var(--logo-filter)]"/>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[var(--fg-default)] border-[var(--border-default)] font-pixel tracking-wide">LemonWave</h1>
                <p className="text-xs text-[var(--fg-muted)]">Precision Modding Utility</p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-md github-bg-tertiary border border-[var(--border-default)] hover:border-[var(--fg-muted)] transition-all flex items-center gap-2 text-xs font-medium"
              >
                <i className={theme === 'light' ? "ri-moon-line" : "ri-sun-line"}></i>
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
              <div className="h-4 w-px bg-[var(--border-default)]"></div>
              <div className="flex items-center gap-6 text-xs font-mono text-[var(--fg-muted)]">
                 <span className="flex items-center gap-2"><i className="ri-database-2-line"></i> {SOUND_LIST.length}</span>
                 <span className="flex items-center gap-2"><i className="ri-bookmark-fill"></i> {savedItems.length}</span>
              </div>
           </div>
        </header>

        <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
          
          {/* Visualizer Panel */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-[var(--fg-muted)] tracking-widest flex items-center gap-2">
              <i className="ri-broadcast-line text-xs"></i> Realtime Audio Signal
            </span>
            <Visualizer theme={theme} />
          </div>

          {/* Active Sound Panel */}
          <section className="github-bg-secondary border border-[var(--border-default)] rounded-md p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-md github-bg-tertiary flex items-center justify-center text-2xl text-[var(--fg-default)] border border-[var(--border-default)]">
                  <i className="ri-volume-up-line"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--fg-default)] flex items-center gap-2">
                    {selectedSound.name}
                    {favorites.includes(selectedSound.id) && <i className="ri-star-fill text-[#e3b341] text-xs"></i>}
                  </h2>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] github-bg-tertiary text-[var(--fg-muted)] px-2 py-0.5 rounded border border-[var(--border-default)] uppercase font-bold tracking-tight">{selectedSound.category}</span>
                    <span className="text-[10px] bg-[var(--fg-default)] text-[var(--bg-canvas)] px-2 py-0.5 rounded border border-[var(--border-default)] uppercase font-bold tracking-tight">Active Editor</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => handlePlay()}
                  className="flex-1 md:flex-none bg-[var(--fg-default)] hover:opacity-90 text-[var(--bg-canvas)] px-6 py-2.5 rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                >
                  <i className="ri-play-circle-line text-lg"></i>
                  Play Test
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 md:flex-none github-bg-tertiary hover:github-bg-secondary text-[var(--fg-default)] border border-[var(--border-default)] px-6 py-2.5 rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                >
                  <i className="ri-save-3-line"></i>
                  Save Preset
                </button>
              </div>
            </div>

            <SoundControls
              pitch={config.pitch}
              volume={config.volume}
              onPitchChange={(p) => setConfig(prev => ({ ...prev, pitch: p }))}
              onVolumeChange={(v) => setConfig(prev => ({ ...prev, volume: v }))}
            />

            <CodeSnippet 
              name={selectedSound.name} 
              pitch={config.pitch} 
              volume={config.volume} 
            />
          </section>

          {/* Library Section */}
          <Library 
            items={savedItems} 
            onSelect={handleApplySaved} 
            onRemove={(id) => setSavedItems(savedItems.filter(i => i.id !== id))}
            onUpdate={handleUpdateLibraryItem}
          />
        </div>
        
        <footer className="mt-auto py-10 border-t border-[var(--border-default)] text-center github-bg-secondary">
           <p className="text-[var(--fg-muted)] text-[10px] font-mono uppercase tracking-[0.2em] flex items-center justify-center gap-3">
             <i className="ri-github-line text-base"></i> 
             SoundID Configuration Suite V2.0
           </p>
        </footer>
      </main>
    </div>
  );
};

export default App;
