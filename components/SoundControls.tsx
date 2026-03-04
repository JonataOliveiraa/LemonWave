
import React from 'react';

interface SoundControlsProps {
  pitch: number;
  volume: number;
  onPitchChange: (val: number) => void;
  onVolumeChange: (val: number) => void;
}

export const SoundControls: React.FC<SoundControlsProps> = ({ 
  pitch, 
  volume, 
  onPitchChange, 
  onVolumeChange 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
      <div className="github-bg-tertiary p-5 rounded-md border border-[var(--border-default)]">
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-semibold text-[var(--fg-muted)] uppercase flex items-center gap-2">
            <i className="ri-pulse-line"></i>
            Pitch Variance
          </label>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onPitchChange(0)}
              className="text-[10px] github-bg-secondary hover:github-bg-tertiary px-2 py-0.5 rounded border border-[var(--border-default)] text-[var(--fg-muted)] transition-colors"
            >
              Reset
            </button>
            <input 
              type="number" 
              step="0.01" 
              min="-1" 
              max="1" 
              value={pitch} 
              onChange={(e) => onPitchChange(parseFloat(e.target.value) || 0)}
              className="text-sm font-mono font-bold text-[var(--fg-default)] bg-[var(--bg-canvas)] px-2 py-0.5 rounded border border-[var(--border-default)] w-20 outline-none focus:border-[var(--accent-fg)]"
            />
          </div>
        </div>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.001"
          value={pitch}
          onChange={(e) => onPitchChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] font-mono text-[var(--fg-muted)] mt-2">
          <span>MIN (-1.0)</span>
          <span>DEFAULT (0.0)</span>
          <span>MAX (1.0)</span>
        </div>
      </div>

      <div className="github-bg-tertiary p-5 rounded-md border border-[var(--border-default)]">
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-semibold text-[var(--fg-muted)] uppercase flex items-center gap-2">
            <i className="ri-volume-vibrate-line"></i>
            Volume Multiplier
          </label>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onVolumeChange(1)}
              className="text-[10px] github-bg-secondary hover:github-bg-tertiary px-2 py-0.5 rounded border border-[var(--border-default)] text-[var(--fg-muted)] transition-colors"
            >
              Reset
            </button>
            <input 
              type="number" 
              step="0.01" 
              min="0" 
              max="2" 
              value={volume} 
              onChange={(e) => onVolumeChange(parseFloat(e.target.value) || 0)}
              className="text-sm font-mono font-bold text-[var(--fg-default)] bg-[var(--bg-canvas)] px-2 py-0.5 rounded border border-[var(--border-default)] w-20 outline-none focus:border-[var(--accent-fg)]"
            />
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.001"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] font-mono text-[var(--fg-muted)] mt-2">
          <span>MUTE (0.0)</span>
          <span>DEFAULT (1.0)</span>
          <span>BOOST (2.0)</span>
        </div>
      </div>
    </div>
  );
};
