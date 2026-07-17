import { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { SKINS, TRAILS, BACKGROUNDS } from './game/data';
import { Shop, type ShopTab } from './components/Shop';
import { BillboardAd } from './components/BillboardAd';

type Screen = 'start' | 'playing' | 'paused' | 'gameover' | 'shop' | 'settings';

function loadNum(key: string, fallback: number): number {
  const v = localStorage.getItem(key);
  return v ? parseInt(v) || fallback : fallback;
}

function loadArr(key: string, fallback: string[]): string[] {
  const v = localStorage.getItem(key);
  return v ? JSON.parse(v) : fallback;
}

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [screen, setScreen] = useState<Screen>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => loadNum('np_high_score', 0));
  const [wallet, setWallet] = useState(() => loadNum('np_wallet', 0));
  const [sessionCoins, setSessionCoins] = useState(0);

  // Cosmetics state
  const [currentSkinId, setCurrentSkinId] = useState(() => localStorage.getItem('np_active_skin') || 'skin_0');
  const [currentTrailId, setCurrentTrailId] = useState(() => localStorage.getItem('np_active_trail') || 'trail_0');
  const [currentBgId, setCurrentBgId] = useState(() => localStorage.getItem('np_active_bg') || 'bg_0');

  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => loadArr('np_unlocked_skins', ['skin_0']));
  const [unlockedTrails, setUnlockedTrails] = useState<string[]>(() => loadArr('np_unlocked_trails', ['trail_0']));
  const [unlockedBgs, setUnlockedBgs] = useState<string[]>(() => loadArr('np_unlocked_backgrounds', ['bg_0']));

  // Settings
  const [volume, setVolume] = useState(() => {
    const v = parseFloat(localStorage.getItem('np_volume') || '');
    return isNaN(v) ? 70 : v * 100;
  });
  const [vibrationEnabled, setVibrationEnabled] = useState(() => localStorage.getItem('np_vibrate') !== 'false');

  const haptic = useCallback((ms: number) => {
    if (vibrationEnabled && 'vibrate' in navigator) navigator.vibrate(ms);
  }, [vibrationEnabled]);

  // Init engine on mount
  useEffect(() => {
    if (!containerRef.current) return;
    engineRef.current = new GameEngine(
      containerRef.current,
      { skinId: currentSkinId, trailId: currentTrailId, backgroundId: currentBgId },
      {
        onScore: (s) => setScore(Math.floor(s)),
        onCoins: (_total, _delta) => setSessionCoins((prev) => prev + 10),
        onGameOver: (s) => {
          setScore(Math.floor(s));
          setScreen('gameover');
          if (Math.floor(s) > highScore) {
            setHighScore(Math.floor(s));
            localStorage.setItem('np_high_score', String(Math.floor(s)));
          }
        },
        onPickup: () => {},
        onHaptic: haptic,
      }
    );
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setSessionCoins(0);
    engineRef.current?.start();
    setScreen('playing');
  }, []);

  const togglePause = useCallback(() => {
    engineRef.current?.pause();
    setScreen((prev) => (prev === 'playing' ? 'paused' : 'playing'));
  }, []);

  const returnHome = useCallback(() => {
    engineRef.current?.pause();
    setScreen('start');
  }, []);

  const handleEquip = useCallback((id: string, type: ShopTab) => {
    const currentId =
      type === 'skins' ? currentSkinId
      : type === 'trails' ? currentTrailId
      : currentBgId;

    if (id === currentId) return;

    const unlocked =
      type === 'skins' ? unlockedSkins
      : type === 'trails' ? unlockedTrails
      : unlockedBgs;

    const item =
      type === 'skins' ? SKINS.find((s) => s.id === id)
      : type === 'trails' ? TRAILS.find((t) => t.id === id)
      : BACKGROUNDS.find((b) => b.id === id);

    if (!item) return;

    if (unlocked.includes(id)) {
      // Equip
      if (type === 'skins') { setCurrentSkinId(id); localStorage.setItem('np_active_skin', id); }
      else if (type === 'trails') { setCurrentTrailId(id); localStorage.setItem('np_active_trail', id); }
      else { setCurrentBgId(id); localStorage.setItem('np_active_bg', id); }
      engineRef.current?.updateConfig({
        skinId: type === 'skins' ? id : currentSkinId,
        trailId: type === 'trails' ? id : currentTrailId,
        backgroundId: type === 'backgrounds' ? id : currentBgId,
      });
    } else {
      if (item.type === 'premium') {
        alert('Premium cosmetics unlocked via Google Play Billing integration.');
        return;
      }
      const cost = item.cost ?? 0;
      if (wallet >= cost) {
        const newWallet = wallet - cost;
        setWallet(newWallet);
        localStorage.setItem('np_wallet', String(newWallet));
        if (type === 'skins') {
          const updated = [...unlockedSkins, id];
          setUnlockedSkins(updated);
          localStorage.setItem('np_unlocked_skins', JSON.stringify(updated));
          setCurrentSkinId(id);
          localStorage.setItem('np_active_skin', id);
        } else if (type === 'trails') {
          const updated = [...unlockedTrails, id];
          setUnlockedTrails(updated);
          localStorage.setItem('np_unlocked_trails', JSON.stringify(updated));
          setCurrentTrailId(id);
          localStorage.setItem('np_active_trail', id);
        } else {
          const updated = [...unlockedBgs, id];
          setUnlockedBgs(updated);
          localStorage.setItem('np_unlocked_backgrounds', JSON.stringify(updated));
          setCurrentBgId(id);
          localStorage.setItem('np_active_bg', id);
        }
        engineRef.current?.updateConfig({
          skinId: type === 'skins' ? id : currentSkinId,
          trailId: type === 'trails' ? id : currentTrailId,
          backgroundId: type === 'backgrounds' ? id : currentBgId,
        });
      } else {
        alert('Not enough Neon Coins!');
      }
    }
  }, [currentSkinId, currentTrailId, currentBgId, unlockedSkins, unlockedTrails, unlockedBgs, wallet]);

  const updateVolume = useCallback((val: number) => {
    setVolume(val);
    localStorage.setItem('np_volume', String(val / 100));
  }, []);

  const toggleVibration = useCallback(() => {
    setVibrationEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('np_vibrate', String(next));
      if (next && 'vibrate' in navigator) navigator.vibrate(100);
      return next;
    });
  }, []);

  return (
    <div className="fixed inset-0 bg-[#030008] overflow-hidden font-mono select-none touch-none">
      {/* Game canvas container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Score HUD */}
      {screen === 'playing' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-orange-500 text-xl sm:text-2xl font-black tracking-widest" style={{ textShadow: '0 0 10px #ff3300' }}>
          SCORE: {score}
        </div>
      )}

      {/* Top bar with coins + pause/home */}
      {(screen === 'playing' || screen === 'paused') && (
        <div className="absolute top-6 left-0 right-0 px-6 flex justify-between items-center z-10 pointer-events-none">
          <div className="flex gap-2 pointer-events-auto">
            <button
              onClick={togglePause}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#0a031499] border border-orange-500/30 text-orange-500 flex items-center justify-center shadow-[0_0_15px_rgba(255,51,0,0.2)] hover:scale-110 transition-transform"
            >
              {screen === 'paused' ? '▶' : 'II'}
            </button>
            <button
              onClick={returnHome}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#0a031499] border border-orange-500/30 text-orange-500 flex items-center justify-center shadow-[0_0_15px_rgba(255,51,0,0.2)] hover:scale-110 transition-transform"
            >
              H
            </button>
          </div>
          <div className="text-[#ffd700] text-sm sm:text-base font-black tracking-widest bg-[#0a031499] px-3 py-1.5 rounded-full border border-[#ffd700]/30 flex items-center gap-1.5 pointer-events-auto" style={{ textShadow: '0 0 10px rgba(255,215,0,0.6)' }}>
            {sessionCoins}
          </div>
        </div>
      )}

      {/* Mobile touch controls */}
      {screen === 'playing' && (
        <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-between items-end px-4 pb-6 sm:pb-8 pointer-events-none">
          <button
            onTouchStart={(e) => { e.preventDefault(); simulateKey('ArrowLeft'); }}
            className="pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0a031499] border-2 border-orange-500/40 text-orange-500 text-2xl font-black flex items-center justify-center active:bg-orange-500/30 transition-colors"
          >
            L
          </button>
          <button
            onTouchStart={(e) => { e.preventDefault(); simulateKey('Space'); }}
            className="pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0a031499] border-2 border-cyan-500/40 text-cyan-400 text-xl font-black flex items-center justify-center active:bg-cyan-500/30 transition-colors"
          >
            JUMP
          </button>
          <button
            onTouchStart={(e) => { e.preventDefault(); simulateKey('ArrowRight'); }}
            className="pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0a031499] border-2 border-orange-500/40 text-orange-500 text-2xl font-black flex items-center justify-center active:bg-orange-500/30 transition-colors"
          >
            R
          </button>
        </div>
      )}

      {/* Start screen */}
      {screen === 'start' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white bg-[radial-gradient(circle_at_center,rgba(14,5,28,0.98),rgba(3,1,8,1))] backdrop-blur-xl px-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-widest mb-1" style={{
            background: 'linear-gradient(45deg, #ff3300, #ff007f, #00ffff)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'shine 4s linear infinite',
          }}>
            NEON PULSE
          </h1>
          <div className="text-[#8a7fa6] text-xs sm:text-sm tracking-[5px] uppercase mb-6">Jumper Pro Edition</div>
          <div className="text-[#ffd700] mb-6 text-sm font-bold tracking-widest">HIGH SCORE: {highScore}</div>
          <button
            onClick={startGame}
            className="px-7 py-3.5 text-sm sm:text-base font-black tracking-widest border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-500 hover:text-black hover:shadow-[0_0_25px_#ff3300] transition-all mb-4"
          >
            START GAME
          </button>
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => setScreen('shop')}
              className="px-4 py-2 text-xs font-black tracking-widest border-2 border-cyan-400 text-cyan-400 rounded-full hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_25px_#00ffff] transition-all"
            >
              CUSTOMIZE
            </button>
            <button
              onClick={() => setScreen('settings')}
              className="px-4 py-2 text-xs font-black tracking-widest border-2 border-cyan-400 text-cyan-400 rounded-full hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_25px_#00ffff] transition-all"
            >
              SETTINGS
            </button>
          </div>
          <BillboardAd variant="menu" />
        </div>
      )}

      {/* Shop screen */}
      {screen === 'shop' && (
        <Shop
          wallet={wallet}
          unlockedSkins={unlockedSkins}
          unlockedTrails={unlockedTrails}
          unlockedBackgrounds={unlockedBgs}
          currentSkinId={currentSkinId}
          currentTrailId={currentTrailId}
          currentBackgroundId={currentBgId}
          onEquip={handleEquip}
          onBack={() => setScreen('start')}
        />
      )}

      {/* Settings screen */}
      {screen === 'settings' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white bg-[radial-gradient(circle_at_center,rgba(14,5,28,0.98),rgba(3,1,8,1))] backdrop-blur-xl px-4">
          <h2 className="text-2xl sm:text-3xl text-cyan-400 mb-4 font-black tracking-wider">SETTINGS</h2>
          <div className="w-full max-w-sm border-b border-white/10 mb-4" />
          <div className="flex justify-between items-center my-4 w-full max-w-sm text-sm">
            <span>SFX & Audio Volume</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => updateVolume(Number(e.target.value))}
              className="w-36 accent-orange-500"
            />
          </div>
          <div className="flex justify-between items-center my-4 w-full max-w-sm text-sm">
            <span>Vibration Haptics</span>
            <button
              onClick={toggleVibration}
              className="px-4 py-1.5 text-xs font-bold border border-orange-500 text-orange-500 rounded-full hover:bg-orange-500/20 transition-colors"
            >
              {vibrationEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <button
            onClick={() => setScreen('start')}
            className="mt-4 px-7 py-3 text-sm font-black tracking-widest border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-500 hover:text-black hover:shadow-[0_0_25px_#ff3300] transition-all"
          >
            SAVE & EXIT
          </button>
        </div>
      )}

      {/* Pause screen */}
      {screen === 'paused' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white bg-[radial-gradient(circle_at_center,rgba(14,5,28,0.98),rgba(3,1,8,1))] backdrop-blur-xl">
          <h1 className="text-3xl sm:text-5xl font-black text-orange-500 mb-6 tracking-widest" style={{ textShadow: '0 0 25px rgba(255,51,0,0.6)' }}>
            PAUSED
          </h1>
          <button
            onClick={togglePause}
            className="px-7 py-3 text-sm font-black tracking-widest border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-500 hover:text-black hover:shadow-[0_0_25px_#ff3300] transition-all mb-3"
          >
            RESUME
          </button>
          <button
            onClick={startGame}
            className="px-7 py-3 text-sm font-black tracking-widest border-2 border-cyan-400 text-cyan-400 rounded-full hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_25px_#00ffff] transition-all"
          >
            RESTART
          </button>
        </div>
      )}

      {/* Game over screen */}
      {screen === 'gameover' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white bg-[radial-gradient(circle_at_center,rgba(14,5,28,0.98),rgba(3,1,8,1))] backdrop-blur-xl">
          <h1 className="text-4xl sm:text-6xl font-black text-orange-500 mb-5 tracking-widest" style={{ textShadow: '0 0 25px rgba(255,51,0,0.6)' }}>
            GAME OVER
          </h1>
          <div className="text-lg sm:text-xl mb-6 font-bold">SCORE: {score}</div>
          <button
            onClick={startGame}
            className="px-7 py-3 text-sm font-black tracking-widest border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-500 hover:text-black hover:shadow-[0_0_25px_#ff3300] transition-all mb-3"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={returnHome}
            className="px-7 py-3 text-sm font-black tracking-widest border-2 border-cyan-400 text-cyan-400 rounded-full hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_25px_#00ffff] transition-all"
          >
            MENU
          </button>
          <BillboardAd variant="menu" />
        </div>
      )}
    </div>
  );
}

function simulateKey(code: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { code }));
}
