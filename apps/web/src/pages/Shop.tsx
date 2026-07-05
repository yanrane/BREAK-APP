import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useReport, STAGE_LABELS, type ShopItem, type PetStage } from '../features/profile/useReport';
import { cn } from '../lib/cn';

const STAGE_ORDER: PetStage[] = ['EGG', 'BABY', 'TEEN', 'ADULT'];

const CATEGORY_LABELS: Record<ShopItem['category'], string> = {
  UTILITY: '🛠 Utility',
  EMOTE: '😄 Emote',
  OUTFIT: '👕 Outfit',
  COSMETIC: '✨ Cosmetic',
};

export default function Shop() {
  const { data, loading, error, refetch } = useReport();
  const [items, setItems] = useState<ShopItem[] | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ success: true; data: ShopItem[] }>('/shop/items')
      .then((res) => setItems(res.data.data))
      .catch(() => setItems([]));
  }, []);

  if (loading || !data) {
    return error ? (
      <p className="text-coral font-semibold">{error}</p>
    ) : (
      <p className="text-muted font-semibold">Memuat shop...</p>
    );
  }

  const petStage: PetStage = data.pet?.stage ?? 'EGG';
  const ownedIds = new Set(data.ownedItems.map((i) => i.id));

  async function buy(item: ShopItem) {
    setBuying(item.id);
    setMessage(null);
    try {
      await api.post('/shop/buy', { itemId: item.id });
      setMessage(`✓ Berhasil membeli ${item.title}!`);
      await refetch();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Pembelian gagal';
      setMessage(`✗ ${msg}`);
    } finally {
      setBuying(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Shop</h1>
          <p className="text-sm text-muted font-semibold">
            Tukar coins hasil misimu dengan item untuk pet-mu.
          </p>
        </div>
        <div className="border-2 border-ink px-4 py-2 shadow-hard-sm bg-amber-100">
          <span className="font-extrabold">🪙 {data.user.coins} coins</span>
        </div>
      </div>

      {message && (
        <div
          className={cn(
            'border-2 border-ink px-4 py-3 font-semibold text-sm',
            message.startsWith('✓') ? 'bg-lime-100' : 'bg-red-50 text-coral border-coral',
          )}
        >
          {message}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(items ?? []).map((item) => {
          const owned = ownedIds.has(item.id);
          const locked = STAGE_ORDER.indexOf(petStage) < STAGE_ORDER.indexOf(item.minStage);
          const affordable = data.user.coins >= item.price;
          return (
            <div key={item.id} className="border-2 border-ink p-5 shadow-hard bg-cream flex flex-col">
              <p className="text-xs font-extrabold uppercase tracking-widest text-muted mb-1">
                {CATEGORY_LABELS[item.category]}
              </p>
              <h2 className="font-extrabold mb-1">{item.title}</h2>
              <p className="text-sm text-muted font-medium flex-1">{item.description}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="font-extrabold">🪙 {item.price}</span>
                {owned ? (
                  <span className="px-3 py-1.5 text-xs font-extrabold border-2 border-ink bg-lime-100">
                    ✓ Dimiliki
                  </span>
                ) : locked ? (
                  <span className="px-3 py-1.5 text-xs font-extrabold border-2 border-ink bg-cream-2 text-muted">
                    🔒 Stage {STAGE_LABELS[item.minStage]}
                  </span>
                ) : (
                  <button
                    onClick={() => buy(item)}
                    disabled={!affordable || buying === item.id}
                    className="px-4 py-1.5 text-xs font-extrabold border-2 border-ink bg-ink text-cream hover:bg-cream hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {buying === item.id ? '...' : affordable ? 'Beli' : 'Coins kurang'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
