import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { SavedSound } from '../types';

interface LibraryProps {
  items: SavedSound[];
  onSelect: (item: SavedSound) => void;
  onRemove: (id: string) => void;
  onUpdate: (item: SavedSound) => void;
}

const PAGE_SIZE = 30;

export const Library: React.FC<LibraryProps> = ({ items, onSelect, onRemove, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // 1. Filtra os itens baseado na pesquisa
  const filteredItems = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return items.filter(item => 
      (item.customName || item.soundName).toLowerCase().includes(s)
    );
  }, [items, searchTerm]);

  // 2. Pega apenas a quantidade que deve estar visível no momento
  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  // 3. Reseta a paginação sempre que o usuário pesquisar algo
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm]);

  // =========================================================================
  // SOLUÇÃO: CALLBACK REF PARA LAZY LOADING (Sem loop infinito!)
  // =========================================================================
  const observer = useRef<IntersectionObserver | null>(null);
  
  const loadingRef = useCallback((node: HTMLDivElement | null) => {
    // Se já existe um observador rodando, desconecta ele
    if (observer.current) observer.current.disconnect();

    // Cria o observador
    observer.current = new IntersectionObserver(entries => {
      // Se a div entrou na tela, incrementa a contagem de visíveis
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + PAGE_SIZE);
      }
    }, { 
      // Margem para carregar os próximos itens 100px antes do usuário chegar ao final (suaviza o scroll)
      rootMargin: '100px' 
    });

    // Se o elemento DOM existir, começa a observar
    if (node) observer.current.observe(node);
  }, []); // Sem dependências! Essa função não fica se recriando.

  // =========================================================================

  const copyScript = (item: SavedSound) => {
    const code = `Terraria.ID.SoundID.${item.soundName}.WithPitchVariance(${item.pitch.toFixed(2)}).WithVolume(${item.volume.toFixed(2)});`;
    navigator.clipboard.writeText(code);
    alert('Snippet copied to clipboard!');
  };

  const startEditing = (item: SavedSound) => {
    setEditingId(item.id);
    setTempName(item.customName || item.soundName);
  };

  const saveName = (item: SavedSound) => {
    onUpdate({ ...item, customName: tempName });
    setEditingId(null);
  };

  return (
    <div className="mt-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-2 border-b border-[var(--border-default)] gap-4">
          <h3 className="text-base font-semibold text-[var(--fg-default)] flex items-center gap-2">
            <i className="ri-archive-line text-[#e3b341]"></i>
            Preset Library
          </h3>
          <div className="relative flex-1 max-w-xs">
            <input 
              type="text" 
              placeholder="Search library..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded-md py-1 px-8 text-xs focus:border-[var(--accent-fg)] outline-none text-[var(--fg-default)]"
            />
            <i className="ri-search-line absolute left-2.5 top-1.5 text-[var(--fg-muted)] text-xs"></i>
          </div>
      </div>
      
      {filteredItems.length === 0 ? (
        <div className="py-12 border border-dashed border-[var(--border-default)] rounded-lg text-center github-bg-secondary/50">
          <i className="ri-inbox-line text-3xl text-[var(--border-default)] mb-2 block"></i>
          <p className="text-[var(--fg-muted)] text-sm">No saved presets matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Agora iteramos sobre os visibleItems controlados de forma segura */}
          {visibleItems.map((item) => (
            <div 
              key={item.id}
              className="github-bg-secondary border border-[var(--border-default)] rounded-md p-4 flex flex-col gap-3 hover:border-[var(--fg-muted)] transition-all group relative shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col w-full pr-6 min-w-0">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-1 w-full">
                        <input 
                          autoFocus
                          className="bg-[var(--bg-canvas)] border border-[var(--accent-fg)] rounded px-1 py-0.5 text-sm w-full outline-none text-[var(--fg-default)]"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveName(item)}
                        />
                        <button onClick={() => saveName(item)} className="text-green-500 shrink-0"><i className="ri-check-line"></i></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-sm text-[var(--fg-default)] truncate" title={item.customName || item.soundName}>
                          {item.customName || item.soundName}
                        </span>
                        <button onClick={() => startEditing(item)} className="opacity-0 group-hover:opacity-100 text-[var(--fg-muted)] hover:text-[var(--fg-default)] text-xs shrink-0">
                          <i className="ri-pencil-line"></i>
                        </button>
                      </div>
                    )}
                    <span className="text-[10px] text-[var(--fg-muted)] font-mono mt-0.5 truncate" title={item.soundName}>ID: {item.soundName}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                  className="absolute top-4 right-4 text-[var(--fg-muted)] hover:text-red-500 transition-colors"
                >
                  <i className="ri-delete-bin-line"></i>
                </button>
              </div>
              <div className="flex gap-2 text-[10px] font-mono">
                <span className="bg-[var(--bg-canvas)] border border-[var(--border-default)] px-2 py-0.5 rounded text-[var(--fg-default)]">P: {item.pitch.toFixed(2)}f</span>
                <span className="bg-[var(--bg-canvas)] border border-[var(--border-default)] px-2 py-0.5 rounded text-[var(--fg-default)]">V: {item.volume.toFixed(2)}f</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => onSelect(item)}
                  className="py-1.5 text-[10px] font-semibold github-bg-tertiary hover:github-bg-secondary text-[var(--fg-default)] border border-[var(--border-default)] rounded transition-colors flex items-center justify-center gap-1"
                >
                  <i className="ri-edit-line"></i>
                  Editor
                </button>
                <button
                  onClick={() => copyScript(item)}
                  className="py-1.5 text-[10px] font-semibold github-bg-tertiary hover:github-bg-secondary text-[var(--fg-default)] border border-[var(--border-default)] rounded transition-colors flex items-center justify-center gap-1"
                >
                  <i className="ri-code-line"></i>
                  Script
                </button>
              </div>
            </div>
          ))}
          
          {/* Se ainda houver itens para carregar, exibe essa div e anexa o loadingRef a ela */}
          {visibleCount < filteredItems.length && (
            <div ref={loadingRef} className="col-span-full h-10 w-full flex items-center justify-center text-[var(--fg-muted)] text-xs font-mono">
              <i className="ri-loader-4-line animate-spin mr-2"></i>
              Carregando mais presets...
            </div>
          )}
        </div>
      )}
    </div>
  );
};