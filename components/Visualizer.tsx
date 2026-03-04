
import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface VisualizerProps {
  theme: 'light' | 'dark';
}

export const Visualizer: React.FC<VisualizerProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = audioEngine.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationId: number;

    const renderFrame = () => {
      animationId = requestAnimationFrame(renderFrame);
      audioEngine.analyser.getByteFrequencyData(dataArray);

      // Match background color with CSS variables
      ctx.fillStyle = theme === 'dark' ? '#0d1117' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        // GitHub-esque gray gradients
        if (theme === 'dark') {
          ctx.fillStyle = `rgb(${dataArray[i] + 50}, ${dataArray[i] + 50}, ${dataArray[i] + 50})`;
        } else {
          // Darker bars for light theme
          ctx.fillStyle = `rgb(${200 - dataArray[i]/2}, ${200 - dataArray[i]/2}, ${200 - dataArray[i]/2})`;
        }
        
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    renderFrame();
    return () => cancelAnimationFrame(animationId);
  }, [theme]);

  return (
    <div className="github-border rounded-md overflow-hidden bg-[var(--bg-canvas)] h-24 w-full">
      <canvas ref={canvasRef} width={600} height={96} className="w-full h-full" />
    </div>
  );
};
