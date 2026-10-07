export type Tone = "green" | "coral" | "butter" | "sky" | "plum";

const TONES: Record<Tone, string> = {
  green: "radial-gradient(circle at 30% 25%, #eaf3e3 0%, #cfe0c3 45%, #a9c69a 100%)",
  coral: "radial-gradient(circle at 30% 25%, #fdebe4 0%, #f7c9b8 45%, #ee9c80 100%)",
  butter: "radial-gradient(circle at 30% 25%, #fff6d6 0%, #fbe3a1 45%, #efc55f 100%)",
  sky: "radial-gradient(circle at 30% 25%, #eef5fb 0%, #cfe1f0 45%, #a9c6de 100%)",
  plum: "radial-gradient(circle at 30% 25%, #f3e9f1 0%, #e0c8dc 45%, #c39fbd 100%)",
};

export function FoodTile({ emoji, tone, className = "", size = "text-7xl" }: { emoji: string; tone: Tone; className?: string; size?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`} style={{ background: TONES[tone] }} aria-hidden>
      <span className={`${size} drop-shadow-[0_10px_18px_rgba(31,42,34,0.25)] select-none`}>{emoji}</span>
    </div>
  );
}
