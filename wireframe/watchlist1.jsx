import React, { useState } from 'react';

const TradoLassoWireframe = () => {
  const [activeTab, setActiveTab] = useState('Watchlists');
  const [selectedAsset, setSelectedAsset] = useState('ELEC.PA');
  const [timeframe, setTimeframe] = useState('D');
  const [watchlistMenuOpen, setWatchlistMenuOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, assetTicker: null });
  const [assetFlags, setAssetFlags] = useState({});
  const [assets, setAssets] = useState([
    { ticker: 'ELEC.PA', name: 'Électricité de Strasbourg SA', flag: '🇫🇷' },
    { ticker: '0020.HK', name: 'SenseTime Group Inc Class B', flag: '🇭🇰' },
    { ticker: '000333.SZ', name: 'Midea Group Co Ltd', flag: '🇨🇳' },
  ]);

  const flagColors = [
    { name: 'Accumulation (1)', value: '#06b6d4' },
    { name: 'Bullish (2)', value: '#22c55e' },
    { name: 'Distribution (3)', value: '#a855f7' },
    { name: 'Bearish (4)', value: '#ef4444' },
    { name: 'Neutral', value: '#6b7280' },
    { name: 'Consolidation', value: '#ec4899' },
    { name: 'Breakout', value: '#3b82f6' },
    { name: 'Reversal', value: '#eab308' },
    { name: 'Strong', value: '#166534' },
    { name: 'Average', value: '#d4a574' },
    { name: 'Weak', value: '#92400e' },
    { name: 'Warning', value: '#f97316' },
  ];

  const handleContextMenu = (e, ticker) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      assetTicker: ticker,
    });
  };

  const handleSetFlag = (color) => {
    if (contextMenu.assetTicker) {
      setAssetFlags(prev => ({
        ...prev,
        [contextMenu.assetTicker]: color,
      }));
    }
    setContextMenu({ visible: false, x: 0, y: 0, assetTicker: null });
  };

  const handleRemoveFlag = () => {
    if (contextMenu.assetTicker) {
      setAssetFlags(prev => {
        const newFlags = { ...prev };
        delete newFlags[contextMenu.assetTicker];
        return newFlags;
      });
    }
    setContextMenu({ visible: false, x: 0, y: 0, assetTicker: null });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, assetTicker: null });
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newAssets = [...assets];
    const [draggedItem] = newAssets.splice(draggedIndex, 1);
    newAssets.splice(dropIndex, 0, draggedItem);
    
    setAssets(newAssets);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const navItems = ['My Finance', 'Watchlists', 'Screener', 'Admin'];
  const timeframes = ['H', 'D', 'W', 'M', 'Auto', 'Log'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      
      {/* ═══════════════════════════════════════════════════════════════════
          TOP NAVBAR
      ═══════════════════════════════════════════════════════════════════ */}
      <nav className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
        {/* Logo + Nav Links */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">TradoLasso</span>
          </div>
          
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => setActiveTab(item)}
                className={`px-4 py-2 text-sm rounded transition-colors ${
                  activeTab === item
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center cursor-pointer hover:border-slate-600">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
          <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:bg-cyan-500">
            S
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-3.5rem)]">
        
        {/* ═══════════════════════════════════════════════════════════════════
            LEFT SIDEBAR - WATCHLIST
        ═══════════════════════════════════════════════════════════════════ */}
        <aside className="w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col">
          {/* Watchlist Header with Dropdown */}
          <div className="p-4 border-b border-slate-800 relative">
            <button
              onClick={() => setWatchlistMenuOpen(!watchlistMenuOpen)}
              className="flex items-center gap-2 hover:bg-slate-800/50 rounded px-2 py-1 -mx-2 transition-colors group"
            >
              <h2 className="font-semibold text-white">Mes dividendes</h2>
              <span className="text-slate-500">({assets.length})</span>
              <svg 
                className={`w-4 h-4 text-slate-400 transition-transform ${watchlistMenuOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {watchlistMenuOpen && (
              <div className="absolute top-full left-2 right-2 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700/50 flex items-center gap-3 transition-colors">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Renommer
                </button>
                <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700/50 flex items-center gap-3 transition-colors">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Gérer les actifs
                </button>
                <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700/50 flex items-center gap-3 transition-colors">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Dupliquer
                </button>
                <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700/50 flex items-center gap-3 transition-colors">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Partager
                </button>
                <div className="border-t border-slate-700 my-1" />
                <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-500/10 flex items-center gap-3 text-red-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Supprimer
                </button>
              </div>
            )}
          </div>

          {/* Asset List */}
          <div className="flex-1 overflow-y-auto">
            {assets.map((asset, index) => (
              <div
                key={asset.ticker}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedAsset(asset.ticker)}
                onContextMenu={(e) => handleContextMenu(e, asset.ticker)}
                className={`group w-full px-4 py-3 text-left border-l-4 transition-all cursor-grab active:cursor-grabbing ${
                  selectedAsset === asset.ticker
                    ? 'bg-blue-600/20 border-blue-500'
                    : 'border-transparent hover:bg-slate-800/50'
                } ${draggedIndex === index ? 'opacity-50' : ''} ${
                  dragOverIndex === index ? 'border-t-2 border-t-cyan-400' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    <svg className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="9" cy="6" r="1.5" />
                      <circle cx="15" cy="6" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" />
                      <circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="18" r="1.5" />
                      <circle cx="15" cy="18" r="1.5" />
                    </svg>
                    {/* Color Flag Indicator */}
                    {assetFlags[asset.ticker] && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: assetFlags[asset.ticker] }}
                      />
                    )}
                    <span className="text-lg">{asset.flag}</span>
                    <div>
                      <div className="font-medium text-sm">{asset.ticker}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[120px]">
                        {asset.name}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAssets(assets.filter((_, i) => i !== index));
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-500/20 transition-all"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN CONTENT - CHART AREA
        ═══════════════════════════════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col">
          {/* Chart Header */}
          <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">{selectedAsset}</span>
              <span className="text-slate-500">- ENXTPA (D)</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Timeframe Buttons */}
              <div className="flex items-center bg-slate-800/50 rounded overflow-hidden">
                {timeframes.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      timeframe === tf
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {/* Add to Watchlist */}
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 rounded hover:border-slate-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Ajouter à watchlist
              </button>
            </div>
          </div>

          {/* Chart Container */}
          <div className="flex-1 relative p-4">
            {/* Chart Placeholder */}
            <div className="w-full h-full bg-slate-900/30 rounded-lg border border-slate-800 flex items-center justify-center relative overflow-hidden">
              {/* Grid Lines (decorative) */}
              <div className="absolute inset-0 opacity-20">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={`h-${i}`}
                    className="absolute w-full border-t border-slate-700"
                    style={{ top: `${(i + 1) * 12}%` }}
                  />
                ))}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={`v-${i}`}
                    className="absolute h-full border-l border-slate-700"
                    style={{ left: `${(i + 1) * 8}%` }}
                  />
                ))}
              </div>

              {/* Placeholder Candlesticks */}
              <div className="absolute bottom-16 left-8 right-20 h-3/4 flex items-end justify-around gap-1">
                {[40, 35, 45, 50, 48, 55, 52, 60, 58, 65, 62, 70, 68, 75, 72, 78, 80, 76, 82, 85].map((h, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className={`w-2 rounded-sm ${i % 3 === 0 ? 'bg-red-500/60' : 'bg-emerald-500/60'}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>

              {/* Moving Average Lines (decorative) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                <path
                  d="M 50 400 Q 200 380 400 320 T 800 220 T 1200 180"
                  fill="none"
                  stroke="rgba(59, 130, 246, 0.5)"
                  strokeWidth="2"
                />
                <path
                  d="M 50 420 Q 200 400 400 360 T 800 280 T 1200 240"
                  fill="none"
                  stroke="rgba(168, 85, 247, 0.5)"
                  strokeWidth="2"
                />
              </svg>

              {/* Y-Axis Labels */}
              <div className="absolute right-2 top-4 bottom-16 flex flex-col justify-between text-xs text-slate-500">
                <span>190.00</span>
                <span>175.00</span>
                <span>160.00</span>
                <span>145.00</span>
                <span>130.00</span>
                <span>115.00</span>
                <span>100.00</span>
              </div>

              {/* X-Axis Labels */}
              <div className="absolute bottom-2 left-8 right-20 flex justify-between text-xs text-slate-500">
                <span>2023</span>
                <span>févr.</span>
                <span>mars</span>
                <span>avr.</span>
                <span>mai</span>
                <span>juin</span>
                <span>juil.</span>
                <span>août</span>
                <span>sept.</span>
                <span>oct.</span>
                <span>nov.</span>
                <span>déc.</span>
              </div>

              {/* Current Price Indicator */}
              <div className="absolute right-0 top-1/4 flex items-center">
                <div className="h-px w-full border-t border-dashed border-yellow-500/50" />
                <div className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded font-medium">
                  175.00
                </div>
              </div>

              {/* TradingView Watermark */}
              <div className="absolute bottom-4 left-4 opacity-30">
                <span className="text-2xl font-bold text-slate-600">TV</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Context Menu for Color Flags */}
      {contextMenu.visible && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
          />
          {/* Menu */}
          <div
            className="fixed z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-2 min-w-[200px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className="grid grid-cols-4 gap-1 px-3 py-2">
              {flagColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => handleSetFlag(color.value)}
                  className="group flex flex-col items-center gap-1 p-2 rounded hover:bg-slate-700/50 transition-colors"
                  title={color.name}
                >
                  <div
                    className={`w-5 h-5 rounded-full ring-2 ring-transparent group-hover:ring-white/30 transition-all ${
                      assetFlags[contextMenu.assetTicker] === color.value ? 'ring-white/50' : ''
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                  <span className="text-[9px] text-slate-400 text-center leading-tight">{color.name}</span>
                </button>
              ))}
            </div>
            {assetFlags[contextMenu.assetTicker] && (
              <>
                <div className="border-t border-slate-700 my-1" />
                <button
                  onClick={handleRemoveFlag}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700/50 flex items-center gap-3 text-slate-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Retirer le flag
                </button>
              </>
            )}
            <div className="border-t border-slate-700 my-1" />
            <button
              onClick={() => {
                const asset = assets.find(a => a.ticker === contextMenu.assetTicker);
                if (asset) setSelectedAsset(asset.ticker);
                closeContextMenu();
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-slate-700/50 flex items-center gap-3 transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Ouvrir dans V.I.S.
            </button>
            <button
              onClick={() => {
                setAssets(assets.filter(a => a.ticker !== contextMenu.assetTicker));
                closeContextMenu();
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-500/10 flex items-center gap-3 text-red-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer de la liste
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TradoLassoWireframe;
