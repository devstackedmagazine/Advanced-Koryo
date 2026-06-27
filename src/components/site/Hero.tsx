import heroAsset from "@/assets/hero-genesis-gv70.png.asset.json";

export function Hero() {
  return (
    <section className="relative w-full min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <img
        src={heroAsset.url}
        alt="Genesis GV70"
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Light gradient overlay — brighter at top, subtle shadow at bottom for button contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

    </section>
  );
}
