import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ListMusic,
  Music,
  Pause,
  Play,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useStore } from "../store/useStore";

interface Station {
  id: string;
  name: string;
  url: string;
}

const STATIONS: Station[] = [
  { id: "lofi", name: "Lo-Fi Focus", url: "https://lofi.stream.laut.fm/lofi" },
  {
    id: "techno",
    name: "Hard Techno / Acid",
    url: "https://techno.stream.laut.fm/techno",
  },
  {
    id: "classical",
    name: "Deep Classical",
    url: "https://radioclassique.ice.infomaniak.ch/radioclassique-high.mp3",
  },
];

export function MusicPlayer() {
  const musicVolume = useStore((s) => s.musicVolume);
  const setMusicVolume = useStore((s) => s.setMusicVolume);
  const currentStation = useStore((s) => s.currentStation);
  const setCurrentStation = useStore((s) => s.setCurrentStation);
  const isMusicPlaying = useStore((s) => s.isMusicPlaying);
  const setIsMusicPlaying = useStore((s) => s.setIsMusicPlaying);

  const audioRef = useRef<HTMLAudioElement>(null);

  const station =
    STATIONS.find((s) => s.id === currentStation) ?? STATIONS[0];

  // Play / pause and react to station changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMusicPlaying) {
      const p = audio.play();
      if (p) p.catch((err) => console.warn("[music] play failed:", err));
    } else {
      audio.pause();
    }
  }, [isMusicPlaying, currentStation]);

  // Keep the audio element volume in sync.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = musicVolume;
  }, [musicVolume]);

  const VolumeIcon =
    musicVolume === 0 ? VolumeX : musicVolume < 0.5 ? Volume1 : Volume2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
      className="fixed bottom-6 left-1/2 z-20 w-[calc(100%-2rem)] max-w-md -translate-x-1/2"
    >
      <audio ref={audioRef} src={station.url} preload="none" />

      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/70 p-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl">
        {/* Play / Pause */}
        <button
          onClick={() => setIsMusicPlaying(!isMusicPlaying)}
          aria-label={isMusicPlaying ? "Mettre en pause" : "Lire la musique"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-orange-400 to-orange-600 text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors hover:from-orange-300 hover:to-orange-500"
        >
          {isMusicPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        {/* Station + volume */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <Music
              size={14}
              className={
                isMusicPlaying
                  ? "shrink-0 text-orange-400"
                  : "shrink-0 text-zinc-500"
              }
            />
            <div className="relative min-w-0 flex-1">
              <select
                value={currentStation}
                onChange={(e) => setCurrentStation(e.target.value)}
                aria-label="Choisir la station"
                className="w-full cursor-pointer appearance-none rounded-lg border border-white/10 bg-zinc-950/70 py-1 pl-2 pr-7 text-xs font-medium text-zinc-200 focus:border-orange-500 focus:outline-none"
              >
                {STATIONS.map((s) => (
                  <option key={s.id} value={s.id} className="bg-zinc-900">
                    {s.name}
                  </option>
                ))}
              </select>
              <ListMusic
                size={13}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500"
              />
            </div>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMusicVolume(musicVolume === 0 ? 0.5 : 0)}
              aria-label="Couper / rétablir le son"
              className="shrink-0 text-zinc-400 transition-colors hover:text-zinc-200"
            >
              <VolumeIcon size={16} />
            </button>
            <div className="relative h-1.5 flex-1 rounded-full bg-zinc-700">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-orange-500"
                style={{ width: `${musicVolume * 100}%` }}
              />
              <div
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400 shadow"
                style={{ left: `${musicVolume * 100}%` }}
              />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                aria-label="Volume"
                className="absolute inset-0 w-full cursor-pointer opacity-0"
              />
            </div>
            <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-zinc-500">
              {Math.round(musicVolume * 100)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
