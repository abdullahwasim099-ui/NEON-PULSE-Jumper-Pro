export type CosmeticType = 'free' | 'points' | 'premium';

export interface Skin {
  id: string;
  name: string;
  type: CosmeticType;
  cost?: number;
  price?: string;
  desc?: string;
  geom: string;
  color: number;
  emissive?: number;
  wireframe?: boolean;
  metalness?: number;
  roughness?: number;
  opacity?: number;
  transparent?: boolean;
}

export interface Trail {
  id: string;
  name: string;
  type: CosmeticType;
  cost?: number;
  price?: string;
  desc?: string;
  color: number;
}

export interface Background {
  id: string;
  name: string;
  type: CosmeticType;
  cost?: number;
  price?: string;
  desc?: string;
  gridColor: number;
  skyColor: number;
}

export const SKINS: Skin[] = [
  { id: 'skin_0', name: 'Supernova Red', type: 'free', cost: 0, geom: 'sphere', color: 0xff3300 },
  { id: 'skin_1', name: 'Cyber Pink', type: 'points', cost: 1000, geom: 'sphere', color: 0xff007f },
  { id: 'skin_2', name: 'Matrix Wire', type: 'points', cost: 1000, geom: 'sphere', color: 0x39ff14, wireframe: true },
  { id: 'skin_3', name: 'Laser Orange', type: 'points', cost: 1000, geom: 'sphere', color: 0xffaa00 },
  { id: 'skin_4', name: 'Jupiter Gas', type: 'points', cost: 1000, geom: 'sphere', color: 0xcc9966 },
  { id: 'skin_5', name: 'Polygonal Gold', type: 'points', cost: 1000, geom: 'icosahedron', color: 0xffd700, metalness: 0.9 },
  { id: 'skin_6', name: 'Ruby Core', type: 'points', cost: 1000, geom: 'octahedron', color: 0xff0000 },
  { id: 'skin_7', name: 'Obsidian Box', type: 'points', cost: 1000, geom: 'box', color: 0x111111, metalness: 0.8 },
  { id: 'skin_8', name: 'Ice Prism', type: 'points', cost: 1000, geom: 'tetrahedron', color: 0xaaffff, opacity: 0.7, transparent: true },
  { id: 'skin_9', name: 'Emerald Ring', type: 'points', cost: 1000, geom: 'torus', color: 0x00ff88 },
  { id: 'skin_10', name: 'Void Core', type: 'points', cost: 1000, geom: 'sphere', color: 0x08001a },
  { id: 'skin_11', name: 'Synthwave Star', type: 'points', cost: 1000, geom: 'sphere', color: 0xff00aa, wireframe: true },
  { id: 'skin_12', name: 'SubZero Spike', type: 'points', cost: 1000, geom: 'icosahedron', color: 0x0088ff, wireframe: true },
  { id: 'skin_13', name: 'Solar Flare', type: 'points', cost: 1000, geom: 'sphere', color: 0xff3300 },
  { id: 'skin_14', name: 'Vapor Ring', type: 'points', cost: 1000, geom: 'torus', color: 0xffffff, wireframe: true },
  { id: 'skin_15', name: 'Hyper Blue', type: 'points', cost: 1000, geom: 'dodecahedron', color: 0x0000ff },
  { id: 'skin_16', name: 'Neon Lime', type: 'points', cost: 1000, geom: 'sphere', color: 0x00ff00 },
  { id: 'skin_17', name: 'Deep Purple', type: 'points', cost: 1000, geom: 'octahedron', color: 0x800080 },
  { id: 'skin_18', name: 'Crimson Cube', type: 'points', cost: 1000, geom: 'box', color: 0xaa0000 },
  { id: 'skin_19', name: 'Ghost White', type: 'points', cost: 1000, geom: 'sphere', color: 0xffffff, opacity: 0.5, transparent: true },
  { id: 'skin_p1', name: 'Chameleon Pro', type: 'premium', price: '$1.99', desc: 'Active RGB color-shift', geom: 'sphere', color: 0xff0000 },
  { id: 'skin_p2', name: 'Hypercube 4D', type: 'premium', price: '$1.99', desc: 'Double nested wireframes', geom: 'box', color: 0x00ffff, wireframe: true },
  { id: 'skin_p3', name: 'Plasma Helix', type: 'premium', price: '$1.99', desc: 'Glowing TorusKnot', geom: 'torusKnot', color: 0xff00ff },
  { id: 'skin_p4', name: 'Nova White', type: 'premium', price: '$1.99', desc: 'Dual nested meshes', geom: 'sphere', color: 0xffffff },
  { id: 'skin_p5', name: 'Electric Web', type: 'premium', price: '$1.99', desc: 'Dense octahedron tracking', geom: 'octahedron', color: 0x00ff88, wireframe: true },
];

export const TRAILS: Trail[] = [
  { id: 'trail_0', name: 'None', type: 'free', cost: 0, color: 0x000000 },
  { id: 'trail_1', name: 'Cyber Cyan', type: 'points', cost: 500, color: 0x00ffff },
  { id: 'trail_2', name: 'Shock Pink', type: 'points', cost: 500, color: 0xff007f },
  { id: 'trail_3', name: 'Matrix Stream', type: 'points', cost: 500, color: 0x39ff14 },
  { id: 'trail_4', name: 'Solar Tail', type: 'points', cost: 500, color: 0xffaa00 },
  { id: 'trail_5', name: 'Deep Purple', type: 'points', cost: 500, color: 0x9400d3 },
  { id: 'trail_6', name: 'Frost Spark', type: 'points', cost: 500, color: 0x87ceeb },
  { id: 'trail_7', name: 'Gold Dust', type: 'points', cost: 500, color: 0xffd700 },
  { id: 'trail_8', name: 'Shadow Fog', type: 'points', cost: 500, color: 0x222222 },
  { id: 'trail_9', name: 'Ruby Dust', type: 'points', cost: 500, color: 0xff0000 },
  { id: 'trail_10', name: 'Binary Trail', type: 'points', cost: 500, color: 0x00ffaa },
  { id: 'trail_11', name: 'Spectrum Split', type: 'points', cost: 500, color: 0xffff00 },
  { id: 'trail_12', name: 'Infrared Glow', type: 'points', cost: 500, color: 0x8b0000 },
  { id: 'trail_13', name: 'Ultraviolet', type: 'points', cost: 500, color: 0xda70d6 },
  { id: 'trail_14', name: 'Toxic Blast', type: 'points', cost: 500, color: 0xadff2f },
  { id: 'trail_15', name: 'Neon Blue', type: 'points', cost: 500, color: 0x0000ff },
  { id: 'trail_16', name: 'Hot Pink', type: 'points', cost: 500, color: 0xff1493 },
  { id: 'trail_17', name: 'Electric Green', type: 'points', cost: 500, color: 0x00ff00 },
  { id: 'trail_18', name: 'Orange Blaze', type: 'points', cost: 500, color: 0xff4500 },
  { id: 'trail_19', name: 'White Noise', type: 'points', cost: 500, color: 0xffffff },
  { id: 'trail_p1', name: 'Rainbow Helix', type: 'premium', price: '$1.99', desc: 'DNA rainbow orbits', color: 0xffffff },
  { id: 'trail_p2', name: 'Glitch Stream', type: 'premium', price: '$1.99', desc: 'Chromatic blocks', color: 0xff00ff },
  { id: 'trail_p3', name: 'Supernova Ring', type: 'premium', price: '$1.99', desc: 'Radial particle bursts', color: 0xffaa00 },
  { id: 'trail_p4', name: 'Quantum Flux', type: 'premium', price: '$1.99', desc: 'Snapping geometric nodes', color: 0x00ffff },
  { id: 'trail_p5', name: 'Void Tendrils', type: 'premium', price: '$1.99', desc: 'Curved wrapping trails', color: 0x800080 },
];

export const BACKGROUNDS: Background[] = [
  { id: 'bg_0', name: 'Classic Grid', type: 'free', cost: 0, gridColor: 0xff007f, skyColor: 0x030008 },
  { id: 'bg_1', name: 'Emerald Tech', type: 'points', cost: 2000, gridColor: 0x39ff14, skyColor: 0x000500 },
  { id: 'bg_2', name: 'Ocean Run', type: 'points', cost: 2000, gridColor: 0x00ffff, skyColor: 0x00050d },
  { id: 'bg_3', name: 'Sunset Blvd', type: 'points', cost: 2000, gridColor: 0xffd700, skyColor: 0x1f0015 },
  { id: 'bg_4', name: 'Midnight Out', type: 'points', cost: 2000, gridColor: 0x444444, skyColor: 0x000000 },
  { id: 'bg_5', name: 'Monochrome', type: 'points', cost: 2000, gridColor: 0xffffff, skyColor: 0x111111 },
  { id: 'bg_6', name: 'Acid Green', type: 'points', cost: 2000, gridColor: 0xadff2f, skyColor: 0x050f00 },
  { id: 'bg_7', name: 'Red Protocol', type: 'points', cost: 2000, gridColor: 0xff0000, skyColor: 0x100000 },
  { id: 'bg_8', name: 'Royal Gold', type: 'points', cost: 2000, gridColor: 0xffd700, skyColor: 0x110d00 },
  { id: 'bg_9', name: 'Amethyst Room', type: 'points', cost: 2000, gridColor: 0xba55d3, skyColor: 0x0a0010 },
  { id: 'bg_10', name: 'Deep Forest', type: 'points', cost: 2000, gridColor: 0x00fa9a, skyColor: 0x000a05 },
  { id: 'bg_11', name: 'Cyber Void', type: 'points', cost: 2000, gridColor: 0x0000ff, skyColor: 0x000008 },
  { id: 'bg_12', name: 'Hot Orange', type: 'points', cost: 2000, gridColor: 0xff4500, skyColor: 0x1a0500 },
  { id: 'bg_13', name: 'Pastel Dreams', type: 'points', cost: 2000, gridColor: 0xffb6c1, skyColor: 0x0c0f1d },
  { id: 'bg_14', name: 'Deep Abyss', type: 'points', cost: 2000, gridColor: 0x008080, skyColor: 0x000305 },
  { id: 'bg_15', name: 'Neon Blue', type: 'points', cost: 2000, gridColor: 0x0000ff, skyColor: 0x000022 },
  { id: 'bg_16', name: 'Toxic Green', type: 'points', cost: 2000, gridColor: 0x00ff00, skyColor: 0x001100 },
  { id: 'bg_17', name: 'Royal Purple', type: 'points', cost: 2000, gridColor: 0x800080, skyColor: 0x110011 },
  { id: 'bg_18', name: 'Crimson Red', type: 'points', cost: 2000, gridColor: 0xff0000, skyColor: 0x220000 },
  { id: 'bg_19', name: 'White Noise', type: 'points', cost: 2000, gridColor: 0xaaaaaa, skyColor: 0x222222 },
  { id: 'bg_p1', name: 'Digital Rain', type: 'premium', price: '$1.99', desc: 'Matrix binary columns', gridColor: 0x00ff00, skyColor: 0x000000 },
  { id: 'bg_p2', name: 'Synth Mountains', type: 'premium', price: '$1.99', desc: 'Deforming vector peaks', gridColor: 0xff00ff, skyColor: 0x000033 },
  { id: 'bg_p3', name: 'Hyper Starfield', type: 'premium', price: '$1.99', desc: 'Warp speed stars', gridColor: 0xffffff, skyColor: 0x000000 },
  { id: 'bg_p4', name: 'Chroma Aurora', type: 'premium', price: '$1.99', desc: 'Gradient sky dome', gridColor: 0x00ffff, skyColor: 0x001133 },
  { id: 'bg_p5', name: 'Cyber Tokyo', type: 'premium', price: '$1.99', desc: 'Wireframe cityscape', gridColor: 0xff3300, skyColor: 0x050005 },
];
