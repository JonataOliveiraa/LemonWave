import React, { useState, useMemo, useEffect, useRef } from 'react';
// Importação da lista estática de sons disponíveis
import { SOUND_LIST } from './constants';
// Importação das tipagens TypeScript para manter o código seguro e previsível
import { SoundDefinition, SoundConfig, SavedSound } from './types';
// Importação do serviço que lida com a Web Audio API
import { audioEngine } from './services/audioEngine';
// Importação dos componentes da interface
import { SoundControls } from './components/SoundControls';
import { CodeSnippet } from './components/CodeSnippet';
import { Library } from './components/Library';
import { Visualizer } from './components/Visualizer';
// Importação do logo
import LogoEmpty from './assets/logo_empty.png'

// Define a quantidade de sons carregados por vez no Infinite Scroll
const PAGE_SIZE = 50;

const App: React.FC = () => {
  // ==========================================
  // ESTADOS DA APLICAÇÃO (STATE MANAGEMENT)
  // ==========================================
  
  // Estado para armazenar o texto digitado na barra de busca
  const [searchTerm, setSearchTerm] = useState('');
  // Estado para armazenar qual som está atualmente selecionado no editor
  const [selectedSound, setSelectedSound] = useState<SoundDefinition>(SOUND_LIST[0]);
  // Estado para armazenar as configurações atuais de pitch e volume do som ativo
  const [config, setConfig] = useState<SoundConfig>({ pitch: 0, volume: 1 });
  // Estado para armazenar a biblioteca de presets salvos pelo usuário
  const [savedItems, setSavedItems] = useState<SavedSound[]>([]);
  // Estado para armazenar a lista de IDs dos sons favoritados
  const [favorites, setFavorites] = useState<string[]>([]);
  // Estado para controlar quantos sons estão visíveis na sidebar (Lazy Loading)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  // Estado para identificar qual som está sendo tocado no momento (útil para o botão de pause/play)
  const [playingId, setPlayingId] = useState<string | null>(null);
  // Estado para alternar entre mostrar todos os sons ou apenas os favoritos
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  // Estado para controlar a abertura/fechamento da sidebar no layout mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Estado para gerenciar o tema atual da interface (claro ou escuro)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Referência para o elemento "âncora" no fim da lista da sidebar para o Intersection Observer
  const observerTarget = useRef<HTMLDivElement>(null);

  // ==========================================
  // EFEITOS COLATERAIS (USEEFFECTS)
  // ==========================================

  // Efeito executado apenas na montagem (on mount) para carregar dados do LocalStorage
  useEffect(() => {
    // Busca a biblioteca salva no navegador
    const saved = localStorage.getItem('terraria-sounds-library');
    if (saved) setSavedItems(JSON.parse(saved));
    
    // Busca os favoritos salvos no navegador
    const favs = localStorage.getItem('terraria-sounds-favorites');
    if (favs) setFavorites(JSON.parse(favs));

    // Busca o tema preferido do usuário
    const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  // Efeito que sincroniza automaticamente a biblioteca (savedItems) com o LocalStorage
  useEffect(() => {
    localStorage.setItem('terraria-sounds-library', JSON.stringify(savedItems));
  }, [savedItems]);

  // Efeito que sincroniza automaticamente os favoritos com o LocalStorage
  useEffect(() => {
    localStorage.setItem('terraria-sounds-favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Efeito que aplica a classe CSS no elemento <body> de acordo com o tema e salva a preferência
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark' : '';
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // ==========================================
  // LÓGICA DE FILTRAGEM E PAGINAÇÃO (USEMEMO)
  // ==========================================

  // Filtra a lista completa de sons baseando-se no termo de busca e na aba de favoritos
  const filteredSounds = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    // Filtra por nome ou categoria do som
    let result = SOUND_LIST.filter(s => 
      s.name.toLowerCase().includes(lowerSearch) || 
      s.category.toLowerCase().includes(lowerSearch)
    );
    
    // Se o toggle de favoritos estiver ativo, filtra novamente mantendo apenas os favoritados
    if (showOnlyFavorites) {
      result = result.filter(s => favorites.includes(s.id));
    }
    
    return result;
  }, [searchTerm, showOnlyFavorites, favorites]);

  // Recorta a lista filtrada para exibir apenas a quantidade delimitada pelo visibleCount (Paginação)
  const visibleSounds = useMemo(() => {
    return filteredSounds.slice(0, visibleCount);
  }, [filteredSounds, visibleCount]);

  // Efeito para o Infinite Scroll usando Intersection Observer API
  useEffect(() => {
    // Cria o observador que detecta quando a âncora entra na tela
    const observer = new IntersectionObserver(
      entries => {
        // Se a âncora estiver visível e ainda houver sons a serem exibidos, aumenta o contador
        if (entries[0].isIntersecting && visibleCount < filteredSounds.length) {
          setVisibleCount(prev => prev + PAGE_SIZE);
        }
      },
      { threshold: 0.1 } // Dispara quando 10% da âncora for visível
    );

    // Conecta o observador à div alvo
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    // Limpeza do observador quando o componente desmontar
    return () => observer.disconnect();
  }, [visibleCount, filteredSounds.length]);

  // Efeito para resetar a paginação sempre que o usuário fizer uma nova busca ou mudar de aba
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, showOnlyFavorites]);

  // ==========================================
  // FUNÇÕES CONTROLADORAS (HANDLERS)
  // ==========================================

  // Função assíncrona responsável por disparar o áudio usando a Web Audio API
  const handlePlay = async (sound: SoundDefinition = selectedSound, overrideConfig?: SoundConfig, isQuickPreview = false) => {
    // Se for um preview rápido (clicado na sidebar), define este som como o "tocando agora"
    if (isQuickPreview) setPlayingId(sound.id);
    
    // Carrega o buffer do áudio via requisição ou cache
    const buffer = await audioEngine.loadSound(sound.url);
    if (buffer) {
      // Define o pitch e volume (usa os overrides se existirem, caso contrário usa o estado global)
      const p = overrideConfig ? overrideConfig.pitch : config.pitch;
      const v = overrideConfig ? overrideConfig.volume : config.volume;
      
      // Toca o som e guarda a referência da fonte gerada
      const source = audioEngine.play(buffer, p, v);
      
      // Evento disparado quando o áudio termina de tocar naturalmente
      source.onended = () => {
        if (isQuickPreview) setPlayingId(null);
      };
    } else {
      // Caso ocorra erro ao carregar, reseta o ID de reprodução
      setPlayingId(null);
    }
  };

  // Função para adicionar/remover um som dos favoritos
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que clicar na estrela selecione o som acidentalmente
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Função para salvar o som atualmente em edição na biblioteca pessoal do usuário
  const handleSave = () => {
    const newItem: SavedSound = {
      ...config, // Espalha as configs atuais de pitch/volume
      id: Date.now().toString(), // Gera um ID único baseado no timestamp
      soundName: selectedSound.name, // Guarda o nome de referência
      timestamp: Date.now() // Guarda o momento exato em que foi salvo
    };
    // Adiciona o novo item no início do array
    setSavedItems([newItem, ...savedItems]);
  };

  // Função que carrega um preset salvo na biblioteca de volta para a área de edição ativa
  const handleApplySaved = (item: SavedSound) => {
    const original = SOUND_LIST.find(s => s.name === item.soundName);
    if (original) {
      setSelectedSound(original);
      setConfig({ pitch: item.pitch, volume: item.volume });
      handlePlay(original, { pitch: item.pitch, volume: item.volume });
    }
  };

  // Função para atualizar os dados de um preset já salvo caso ele seja editado posteriormente
  const handleUpdateLibraryItem = (updated: SavedSound) => {
    setSavedItems(prev => prev.map(item => item.id === updated.id ? updated : item));
  };

  // Função que simplesmente inverte o tema atual
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // ==========================================
  // RENDERIZAÇÃO PARCIAL (SIDEBAR COMPONENT)
  // ==========================================
  
  // Elemento isolado contendo a sidebar para ser reutilizado no Desktop e Mobile
  const sidebarContent = (
    <div className="flex flex-col h-full github-bg-secondary">
      {/* Cabeçalho da Sidebar (Busca e Filtros) */}
      <div className="p-4 border-b border-[var(--border-default)]">
        <div className="flex items-center justify-between mb-4">
           <h2 className="text-sm font-semibold flex items-center gap-2 text-[var(--fg-default)]">
              <i className="ri-music-2-line"></i>
              Repository
           </h2>
           {/* Botão de alternância (toggle) para exibir apenas favoritos */}
           <button 
             onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
             className={`text-xs px-2 py-1 rounded border transition-colors ${showOnlyFavorites ? 'bg-[var(--fg-default)] text-[var(--bg-canvas)] border-transparent' : 'github-bg-tertiary border-[var(--border-default)] text-[var(--fg-muted)] hover:bg-[var(--border-default)]'}`}
           >
             <i className={showOnlyFavorites ? "ri-star-fill mr-1" : "ri-star-line mr-1"}></i>
             {favorites.length}
           </button>
        </div>
        
        {/* Input de Pesquisa de Áudios */}
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

      {/* Container com a Lista de Sons com scroll vertical */}
      <div className="flex-1 overflow-y-auto">
        {/* Mensagem de fallback caso não encontre nenhum som */}
        {visibleSounds.length === 0 ? (
          <div className="p-8 text-center text-[var(--fg-muted)] text-sm">
            <i className="ri-prohibited-line text-2xl mb-2 block"></i>
            Nothing found
          </div>
        ) : (
          /* Renderização dinâmica dos sons visíveis na paginação */
          visibleSounds.map((sound) => (
            <div
              key={sound.id}
              onClick={() => {
                // Ao clicar num item, seleciona ele e fecha a sidebar em telas pequenas
                setSelectedSound(sound);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              // Classes para estilo e identificação visual do item selecionado
              className={`flex items-center justify-between px-4 py-2 border-b border-[var(--border-default)] cursor-pointer group transition-all ${
                selectedSound.id === sound.id ? 'github-bg-tertiary border-l-2 border-l-[var(--fg-default)]' : 'hover:github-bg-tertiary/50'
              }`}
            >
              {/* O container flex-1 min-w-0 limita o espaço impedindo que quebre para fora */}
              <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                {/* Botão de Quick Play (Toca o som com pitch neutro) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlay(sound, { pitch: 0, volume: 1 }, true);
                  }}
                  // O shrink-0 protege o botão para não ser espremido pelo texto longo
                  className={`w-8 h-8 shrink-0 flex items-center justify-center rounded transition-colors ${playingId === sound.id ? 'bg-[var(--fg-default)] text-[var(--bg-canvas)]' : 'hover:github-bg-tertiary text-[var(--fg-muted)] border border-transparent hover:border-[var(--border-default)]'}`}
                >
                  <i className={playingId === sound.id ? "ri-pause-fill" : "ri-play-fill"}></i>
                </button>
                
                {/* Informações do Som (Nome e Categoria) */}
                <div className="flex flex-col flex-1 min-w-0">
                  {/* SOLUÇÃO SIDEBAR: Removido 'truncate', adicionado 'break-all'. Assim, o texto vai pular de linha em vez de estourar. */}
                  <span className={`text-sm font-medium break-all block w-full ${selectedSound.id === sound.id ? 'text-[var(--fg-default)]' : 'text-[var(--fg-muted)]'}`}>
                    {sound.name}
                  </span>
                  <span className="text-[10px] text-[var(--fg-muted)] uppercase font-bold mt-1">{sound.category}</span>
                </div>
              </div>
              
              {/* Botão de Favoritar (Estrela) */}
              <button
                onClick={(e) => toggleFavorite(sound.id, e)}
                // O shrink-0 protege a estrela também, garantindo que ela fique sempre do mesmo tamanho e visível
                className={`p-1.5 rounded transition-opacity shrink-0 ml-2 ${favorites.includes(sound.id) ? 'text-[#e3b341]' : 'text-[var(--fg-muted)] opacity-0 group-hover:opacity-100 hover:text-[#e3b341]'}`}
              >
                <i className={favorites.includes(sound.id) ? "ri-star-fill" : "ri-star-line"}></i>
              </button>
            </div>
          ))
        )}
        {/* Âncora invisível usada pelo Intersection Observer para carregar mais dados (Lazy Loading) */}
        <div ref={observerTarget} className="h-10 w-full flex items-center justify-center text-[var(--fg-muted)] text-xs">
          {visibleCount < filteredSounds.length ? 'Loading...' : ''}
        </div>
      </div>
    </div>
  );

  // ==========================================
  // RENDERIZAÇÃO PRINCIPAL (APP COMPONENT)
  // ==========================================
  return (
    <div className="min-h-screen flex flex-col lg:flex-row h-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--fg-default)]">
      
      {/* Header Mobile - Visível apenas em telas pequenas (lg:hidden) */}
      <div className="lg:hidden flex items-center justify-between p-4 github-bg-secondary border-b border-[var(--border-default)] sticky top-0 z-50">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-[var(--fg-default)]">
          <i className="ri-menu-2-line text-xl"></i>
        </button>
        <span className="font-bold text-sm">Sound Weaver</span>
        <button onClick={toggleTheme} className="w-10 h-10 rounded-full github-bg-tertiary flex items-center justify-center border border-[var(--border-default)]">
          <i className={theme === 'light' ? "ri-moon-line" : "ri-sun-line"}></i>
        </button>
      </div>

      {/* Overlay da Sidebar Mobile - Fundo escuro que ao ser clicado fecha a sidebar */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] bg-black/50" onClick={() => setIsSidebarOpen(false)}>
          {/* A barra lateral em si, com animação de deslizar da esquerda. (e.stopPropagation impede que clique dentro feche a barra) */}
          <div className="w-80 h-full shadow-2xl animate-slide-in-left" onClick={e => e.stopPropagation()}>
             {sidebarContent}
          </div>
        </div>
      )}

      {/* Sidebar Desktop - Fixa e escondida no mobile (hidden lg:flex) */}
      <aside className="hidden lg:flex w-[350px] flex-col github-bg-secondary border-r border-[var(--border-default)] h-full">
        {sidebarContent}
      </aside>

      {/* Workspace Principal - Onde a edição do som acontece */}
      <main className="flex-1 overflow-y-auto flex flex-col h-full bg-[var(--bg-canvas)]">
        
        {/* Header do Workspace (Apenas Desktop) */}
        <header className="px-8 py-6 github-bg-secondary border-b border-[var(--border-default)] hidden lg:flex items-center justify-between">
           <div className="flex items-center gap-4">
              {/* Logo e Titulo */}
              <div className="w-10 h-10 rounded-md bg-[var(--fg-default)] text-[var(--bg-canvas)] flex items-center justify-center">
                 <img src={LogoEmpty} alt="logo" className="h-7 w-7 image-pixelated [filter:var(--logo-filter)]"/>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[var(--fg-default)] border-[var(--border-default)] font-pixel tracking-wide">LemonWave</h1>
                <p className="text-xs text-[var(--fg-muted)]">Precision Modding Utility</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              {/* Botão para alternar tema (Claro/Escuro) */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-md github-bg-tertiary border border-[var(--border-default)] hover:border-[var(--fg-muted)] transition-all flex items-center gap-2 text-xs font-medium"
              >
                <i className={theme === 'light' ? "ri-moon-line" : "ri-sun-line"}></i>
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
              
              {/* Separador Visual e Contadores */}
              <div className="h-4 w-px bg-[var(--border-default)]"></div>
              <div className="flex items-center gap-6 text-xs font-mono text-[var(--fg-muted)]">
                 <span className="flex items-center gap-2" title="Total Sounds"><i className="ri-database-2-line"></i> {SOUND_LIST.length}</span>
                 <span className="flex items-center gap-2" title="Saved Presets"><i className="ri-bookmark-fill"></i> {savedItems.length}</span>
              </div>
           </div>
        </header>

        {/* Container Principal de Conteúdo */}
        <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
          
          {/* Painel do Visualizador (Osciloscópio Visual de Frequência) */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-[var(--fg-muted)] tracking-widest flex items-center gap-2">
              <i className="ri-broadcast-line text-xs"></i> Realtime Audio Signal
            </span>
            <Visualizer theme={theme} />
          </div>

          {/* Painel Ativo de Configuração de Som */}
          <section className="github-bg-secondary border border-[var(--border-default)] rounded-md p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
              
              {/* Container flex-1 e min-w-0 para respeitar limites horizontais sem empurrar botões */}
              <div className="flex items-center gap-5 w-full md:w-auto min-w-0 flex-1">
                {/* Ícone de Som com shrink-0 para não ser comprimido */}
                <div className="w-14 h-14 shrink-0 rounded-md github-bg-tertiary flex items-center justify-center text-2xl text-[var(--fg-default)] border border-[var(--border-default)]">
                  <i className="ri-volume-up-line"></i>
                </div>
                
                {/* Container de Texto. min-w-0 permite que os blocos internos envolvam suas strings longas sem quebrar para a direita. */}
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-bold text-[var(--fg-default)] flex items-center gap-2 w-full">
                    {/* SOLUÇÃO PAINEL: Usamos break-words/break-all para garantir que o título do áudio wrap pra linha de baixo. */}
                    <span className="break-all" title={selectedSound.name}>{selectedSound.name}</span>
                    {favorites.includes(selectedSound.id) && <i className="ri-star-fill shrink-0 text-[#e3b341] text-xs"></i>}
                  </h2>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] github-bg-tertiary text-[var(--fg-muted)] px-2 py-0.5 rounded border border-[var(--border-default)] uppercase font-bold tracking-tight">{selectedSound.category}</span>
                    <span className="text-[10px] bg-[var(--fg-default)] text-[var(--bg-canvas)] px-2 py-0.5 rounded border border-[var(--border-default)] uppercase font-bold tracking-tight">Active Editor</span>
                  </div>
                </div>
              </div>
              
              {/* Botões de Ação Principais (Tocar com efeitos e Salvar Preset). Com shrink-0 para manter layout estável */}
              <div className="flex gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
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

            {/* Controles deslizantes (Sliders) para Pitch e Volume */}
            <SoundControls
              pitch={config.pitch}
              volume={config.volume}
              onPitchChange={(p) => setConfig(prev => ({ ...prev, pitch: p }))}
              onVolumeChange={(v) => setConfig(prev => ({ ...prev, volume: v }))}
            />

            {/* Gerador de código em C# pronto para copiar e colar no TModLoader */}
            <CodeSnippet 
              name={selectedSound.name} 
              pitch={config.pitch} 
              volume={config.volume} 
            />
          </section>

          {/* Componente que exibe e gerencia os presets salvos (Biblioteca Pessoal) */}
          <Library 
            items={savedItems} 
            onSelect={handleApplySaved} 
            onRemove={(id) => setSavedItems(savedItems.filter(i => i.id !== id))}
            onUpdate={handleUpdateLibraryItem}
          />
        </div>
        
        {/* Rodapé Fixo da Aplicação com a assinatura do projeto */}
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