
import React, { useState, useEffect, useRef } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Limiar para ativar o refresh (pixels)
  const THRESHOLD = 70;
  // Fator de resistência (para parecer elástico)
  const DAMPING = 0.4;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Só ativa se estivermos no topo da página
    if (window.scrollY === 0 && !isRefreshing) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const y = e.touches[0].clientY;
    const diff = y - startY;

    // Se estiver a puxar para baixo e no topo
    if (diff > 0 && window.scrollY === 0 && !isRefreshing) {
      // Impede o comportamento nativo se estivermos a puxar ativamente
      // (Nota: em alguns browsers isto requer passive: false nos listeners, 
      // mas React gere isto. Se falhar, o scroll nativo acontece)
      setCurrentY(diff * DAMPING);
    }
  };

  const handleTouchEnd = async () => {
    if (isRefreshing) return;

    if (currentY > THRESHOLD) {
      setIsRefreshing(true);
      setCurrentY(THRESHOLD); // Mantém na posição de loading
      
      try {
        await onRefresh();
      } finally {
        // Pequeno delay para mostrar o sucesso antes de fechar
        setTimeout(() => {
            setIsRefreshing(false);
            setCurrentY(0);
        }, 500);
      }
    } else {
      setCurrentY(0);
    }
    setStartY(0);
  };

  // Efeito para bloquear scroll body durante o refresh (opcional, melhora UX)
  useEffect(() => {
    document.body.style.overflow = isRefreshing ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isRefreshing]);

  return (
    <div 
      className="min-h-screen relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      ref={contentRef}
    >
      {/* Loading Indicator Container */}
      <div 
        className="absolute top-0 left-0 w-full flex justify-center pointer-events-none z-0 overflow-hidden"
        style={{ 
            height: `${currentY}px`,
            opacity: currentY > 5 ? 1 : 0,
            transition: isRefreshing ? 'height 0.2s' : 'none'
        }}
      >
        <div className="flex items-center justify-center h-full pb-2">
            <div className={`p-2 rounded-full bg-card-dark border border-white/10 shadow-xl flex items-center justify-center transition-transform ${currentY > THRESHOLD ? 'rotate-180' : ''}`}>
                {isRefreshing ? (
                    <span className="material-symbols-outlined text-primary animate-spin">refresh</span>
                ) : (
                    <span className="material-symbols-outlined text-gray-400" style={{ transform: `rotate(${currentY * 2}deg)` }}>arrow_downward</span>
                )}
            </div>
        </div>
      </div>

      {/* Main Content with Transform */}
      <div 
        className="relative z-10 bg-background-dark min-h-screen transition-transform duration-300 ease-out"
        style={{ 
            transform: `translateY(${currentY}px)`,
            // Se soltar e não for refresh, anima suavemente de volta. Se for drag, é instantaneo.
            transition: isRefreshing || currentY === 0 ? 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
        }}
      >
        {children}
      </div>
    </div>
  );
};
