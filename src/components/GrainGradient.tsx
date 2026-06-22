/**
 * Futuristic ambient backdrop:
 *  - a warm vertical glow from the top,
 *  - an animated, ribbed "orange ribbon" crossing the viewport (CSS-only,
 *    fakes an extruded 3D band with cylindrical shading + a sweeping sheen),
 *  - a film-grain overlay.
 * Sits behind all content; cards stay readable on top.
 */

const GRAIN_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const RIBBON_FADE =
  "linear-gradient(to bottom, transparent 0%, #000 22%, #000 78%, transparent 100%)";

export function GrainGradient({
  variant = "subtle",
}: {
  variant?: "subtle" | "bold";
}) {
  const bold = variant === "bold";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Warm vertical glow from the top */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: bold ? "78vh" : "58vh",
          background:
            "linear-gradient(180deg, rgba(253,186,116,0.40) 0%, rgba(249,115,22,0.30) 24%, rgba(124,45,18,0.18) 48%, rgba(9,9,11,0) 86%)",
          opacity: bold ? 0.85 : 0.6,
        }}
      />

      {/* Soft radial bloom for depth */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 rounded-full blur-3xl"
        style={{
          width: "120vw",
          height: bold ? "55vh" : "38vh",
          background:
            "radial-gradient(ellipse at center, rgba(249,115,22,0.28) 0%, rgba(249,115,22,0) 70%)",
          opacity: bold ? 0.7 : 0.5,
        }}
      />

      {/* Animated extruded ribbon */}
      <div
        className="animate-ribbon-float absolute left-1/2 top-1/2"
        style={{
          width: "150vw",
          height: bold ? "40vh" : "32vh",
          transform: "translate(-50%, -50%) rotate(-8deg)",
          WebkitMaskImage: RIBBON_FADE,
          maskImage: RIBBON_FADE,
          filter: "blur(1px)",
          opacity: bold ? 0.95 : 0.8,
        }}
      >
        {/* Base horizontal glow (bright in the center, dark on the sides) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(120,40,10,0) 0%, rgba(194,65,12,0.85) 22%, rgba(249,115,22,0.95) 42%, rgba(254,215,170,0.98) 50%, rgba(249,115,22,0.95) 58%, rgba(194,65,12,0.85) 78%, rgba(120,40,10,0) 100%)",
          }}
        />

        {/* Vertical slats (the ribbed / extruded look) */}
        <div
          className="animate-ribbon-shimmer absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 3px, rgba(0,0,0,0) 4px, rgba(255,255,255,0.10) 6px, rgba(0,0,0,0) 8px, rgba(0,0,0,0) 16px)",
            backgroundSize: "80px 100%",
            mixBlendMode: "overlay",
          }}
        />

        {/* Cylindrical shading (fakes roundness top-to-bottom) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 30%, rgba(255,255,255,0.20) 50%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.65) 100%)",
          }}
        />

        {/* Sweeping light sheen */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="animate-sheen-sweep absolute inset-y-0 -left-1/3 w-1/3"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)",
              filter: "blur(8px)",
            }}
          />
        </div>
      </div>

      {/* Film grain */}
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          backgroundImage: `url("${GRAIN_URI}")`,
          backgroundSize: "180px 180px",
          opacity: bold ? 0.16 : 0.12,
        }}
      />
    </div>
  );
}
