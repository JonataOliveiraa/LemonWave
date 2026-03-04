
import React, { useState } from 'react';

interface CodeSnippetProps {
  name: string;
  pitch: number;
  volume: number;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({ name, pitch, volume }) => {
  const [copied, setCopied] = useState(false);

  // Format with standard C# float suffix
  const formattedPitch = pitch.toFixed(2);
  const formattedVolume = volume.toFixed(2);
  const code = `Terraria.ID.SoundID.${name}.WithPitchVariance(${formattedPitch}).WithVolume(${formattedVolume});`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 bg-[var(--bg-canvas)] border border-[var(--border-default)] rounded-md overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2 github-bg-secondary border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
            <i class="ri-javascript-fill"></i>
            <span className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wider">TL Pro Snippet</span>
        </div>
        <button
          onClick={copyToClipboard}
          className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-all ${
            copied 
            ? 'bg-[#238636] text-white border-transparent' 
            : 'github-bg-tertiary hover:github-bg-secondary text-[var(--fg-default)] border border-[var(--border-default)]'
          }`}
        >
          <i className={copied ? "ri-check-line" : "ri-clipboard-line"}></i>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto bg-[var(--code-bg)]">
        <code className="code-font text-sm text-[var(--fg-default)] whitespace-nowrap block">
          <span><span className="text-red-500">Terraria</span>.<span className="text-green-500">ID</span>.SoundID</span>.{name}
          <span className="text-[var(--accent-fg)]">.WithPitchVariance</span>({formattedPitch})
          <span className="text-[var(--accent-fg)]">.WithVolume</span>({formattedVolume});
        </code>
      </div>
    </div>
  );
};
