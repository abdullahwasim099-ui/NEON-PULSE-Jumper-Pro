import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SKINS, TRAILS, BACKGROUNDS } from '../game/data';

interface PreviewEngine {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  ball: THREE.Mesh;
  rafId: number;
}

interface ShopPreviewProps {
  skinId: string;
  backgroundId: string;
}

export function ShopPreview({ skinId, backgroundId }: ShopPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PreviewEngine | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040108);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 1.2, 2.5);
    camera.lookAt(0, 0.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(150, 150);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const light = new THREE.PointLight(0x00ffff, 2, 10);
    light.position.set(1, 2, 1);
    scene.add(light);

    const ballGeom = new THREE.SphereGeometry(0.4, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0x440a00, roughness: 0.1 });
    const ball = new THREE.Mesh(ballGeom, ballMat);
    ball.position.set(0, 0.25, 0);
    scene.add(ball);

    const grid = new THREE.GridHelper(10, 10, 0xff007f, 0x444444);
    grid.position.y = -0.2;
    scene.add(grid);

    const animate = () => {
      engineRef.current!.rafId = requestAnimationFrame(animate);
      ball.rotation.y += 0.015;
      ball.rotation.x += 0.01;
      renderer.render(scene, camera);
    };

    engineRef.current = { scene, camera, renderer, ball, rafId: 0 };
    setReady(true);
    animate();

    return () => {
      if (engineRef.current) {
        cancelAnimationFrame(engineRef.current.rafId);
        renderer.dispose();
        if (renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!engineRef.current || !ready) return;
    const skin = SKINS.find((s) => s.id === skinId);
    if (skin) {
      (engineRef.current.ball.material as THREE.MeshStandardMaterial).color.setHex(skin.color);
      if (skin.emissive) {
        (engineRef.current.ball.material as THREE.MeshStandardMaterial).emissive.setHex(skin.emissive);
      }
      (engineRef.current.ball.material as THREE.MeshStandardMaterial).wireframe = skin.wireframe ?? false;
    }
  }, [skinId, ready]);

  useEffect(() => {
    if (!engineRef.current || !ready) return;
    const bg = BACKGROUNDS.find((b) => b.id === backgroundId);
    if (bg) {
      engineRef.current.scene.background = new THREE.Color(bg.skyColor);
    }
  }, [backgroundId, ready]);

  return (
    <div
      ref={containerRef}
      className="w-[150px] h-[150px] sm:w-[300px] sm:h-[300px] border-2 border-orange-500/30 rounded-2xl bg-black/50 relative overflow-hidden shadow-[inset_0_0_20px_rgba(255,51,0,0.2)]"
    >
      <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-[#8a7fa6] tracking-widest pointer-events-none z-10">
        LIVE 3D PREVIEW
      </span>
    </div>
  );
}

export type ShopTab = 'skins' | 'trails' | 'backgrounds';

interface ShopProps {
  wallet: number;
  unlockedSkins: string[];
  unlockedTrails: string[];
  unlockedBackgrounds: string[];
  currentSkinId: string;
  currentTrailId: string;
  currentBackgroundId: string;
  onEquip: (id: string, type: ShopTab) => void;
  onBack: () => void;
}

export function Shop(props: ShopProps) {
  const [activeTab, setActiveTab] = useState<ShopTab>('skins');

  const items =
    activeTab === 'skins' ? SKINS
    : activeTab === 'trails' ? TRAILS
    : BACKGROUNDS;

  const unlockedSet =
    activeTab === 'skins' ? props.unlockedSkins
    : activeTab === 'trails' ? props.unlockedTrails
    : props.unlockedBackgrounds;

  const currentId =
    activeTab === 'skins' ? props.currentSkinId
    : activeTab === 'trails' ? props.currentTrailId
    : props.currentBackgroundId;

  const previewSkinId = activeTab === 'skins' ? props.currentSkinId : props.currentSkinId;

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white bg-[radial-gradient(circle_at_center,rgba(14,5,28,0.98),rgba(3,1,8,1))] backdrop-blur-xl px-4 py-6 overflow-y-auto">
      <h2 className="text-2xl sm:text-3xl text-cyan-400 mb-3 font-black tracking-wider">CUSTOMIZE</h2>
      <div className="text-[#ffd700] mb-4 text-sm font-bold tracking-widest">MONEY: {props.wallet}</div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 w-full max-w-2xl items-center justify-center mb-4">
        <ShopPreview skinId={previewSkinId} backgroundId={props.currentBackgroundId} />

        <div className="flex-1 w-full max-w-md">
          <div className="flex justify-around mb-3 border-b border-white/10 pb-2">
            {(['skins', 'trails', 'backgrounds'] as ShopTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === tab ? 'text-orange-500' : 'text-[#8a7fa6]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1 np-scroll">
            {items.map((item) => {
              const isUnlocked = unlockedSet.includes(item.id);
              const isActive = currentId === item.id;
              const priceText = item.type === 'premium' ? item.price : (item.cost === 0 || item.cost === undefined) ? 'FREE' : `${item.cost}`;

              return (
                <button
                  key={item.id}
                  onClick={() => props.onEquip(item.id, activeTab)}
                  className={`rounded-xl p-3 text-[11px] flex flex-col justify-between min-h-[65px] transition-all ${
                    isActive
                      ? 'border border-orange-500 bg-orange-500/12 shadow-[0_0_15px_rgba(255,51,0,0.4)] text-orange-500'
                      : isUnlocked
                      ? 'border border-white/10 bg-white/4 text-white hover:border-orange-500/50'
                      : 'border border-dashed border-[#333] bg-black/50 text-[#555]'
                  }`}
                >
                  <strong className="text-[11px] leading-tight">{item.name}</strong>
                  {item.type === 'premium' && item.desc && (
                    <span className="text-[8px] text-[#aaa] leading-tight mt-0.5">{item.desc}</span>
                  )}
                  <span className="mt-auto font-bold text-cyan-400 text-[10px]">
                    {isActive ? 'EQUIPPED' : isUnlocked ? 'USE' : priceText}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        onClick={props.onBack}
        className="mt-4 px-7 py-3 text-sm font-black tracking-widest border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-500 hover:text-black hover:shadow-[0_0_25px_#ff3300] transition-all"
      >
        BACK
      </button>
    </div>
  );
}
