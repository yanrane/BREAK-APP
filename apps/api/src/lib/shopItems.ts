import { PetStage } from '@prisma/client';

export type ShopCategory = 'UTILITY' | 'EMOTE' | 'OUTFIT' | 'COSMETIC';

export interface ShopItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: ShopCategory;
  /** Stage pet minimum agar item bisa dibeli. */
  minStage: PetStage;
  /** Item consumable bisa dibeli berulang (mis. streak recovery). */
  consumable: boolean;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'streak-recovery',
    title: 'Streak Recovery',
    description: 'Kembalikan streak yang terputus dan lanjutkan hitunganmu.',
    price: 100,
    category: 'UTILITY',
    minStage: 'EGG',
    consumable: true,
  },
  { id: 'emote-happy', title: 'Emote Senang', description: 'Pet-mu bisa tersenyum lebar.', price: 50, category: 'EMOTE', minStage: 'BABY', consumable: false },
  { id: 'emote-cool', title: 'Emote Keren', description: 'Pet-mu pasang gaya santai.', price: 50, category: 'EMOTE', minStage: 'BABY', consumable: false },
  { id: 'emote-fire', title: 'Emote Semangat', description: 'Pet-mu menyala penuh semangat.', price: 75, category: 'EMOTE', minStage: 'BABY', consumable: false },
  { id: 'outfit-scarf', title: 'Syal Hangat', description: 'Syal stylish untuk pet-mu.', price: 150, category: 'OUTFIT', minStage: 'TEEN', consumable: false },
  { id: 'outfit-hat', title: 'Topi Petualang', description: 'Topi untuk pet yang suka misi outdoor.', price: 150, category: 'OUTFIT', minStage: 'TEEN', consumable: false },
  { id: 'cosmetic-glow', title: 'Aura Berkilau', description: 'Efek aura eksklusif untuk pet dewasa.', price: 300, category: 'COSMETIC', minStage: 'ADULT', consumable: false },
  { id: 'cosmetic-crown', title: 'Mahkota Emas', description: 'Simbol konsistensi tertinggi.', price: 500, category: 'COSMETIC', minStage: 'ADULT', consumable: false },
];

export function findShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}
