const COLORS = ['#C2F13B', '#F04D25', '#13120E', '#FFD700', '#4ade80', '#F8F4EC'];

/** Confetti CSS ringan untuk momen selesai misi / naik level — tanpa library. */
export default function Confetti({ count = 28 }: { count?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="absolute -top-4 w-2.5 h-2.5 animate-confetti"
          style={{
            left: `${(i * 37) % 100}%`,
            backgroundColor: COLORS[i % COLORS.length],
            animationDelay: `${(i % 9) * 0.18}s`,
            animationDuration: `${2.2 + (i % 5) * 0.35}s`,
            transform: `rotate(${(i * 47) % 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}
