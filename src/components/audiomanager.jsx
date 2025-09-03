// AudioManager.jsx (or inside your main component)
import { useRef, useEffect } from "react";

export const useAudioManager = () => {
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const audioCache = useRef(new Map());
  const currentAudioRef = useRef(null); // track currently playing audio

  useEffect(() => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContextRef.current = new AudioContextClass();

    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.gain.value = 3.0; // 3x volume boost
    gainNodeRef.current.connect(audioContextRef.current.destination);

    // Preload bingo calls
    const ranges = {
      b: [1, 15],
      i: [16, 30],
      n: [31, 45],
      g: [46, 60],
      o: [61, 75],
    };

    for (const [cat, [start, end]] of Object.entries(ranges)) {
      for (let i = start; i <= end; i++) {
        const path = `/voicemale/${cat}_${i}.m4a`;
        const audio = new Audio(path);
        const source = audioContextRef.current.createMediaElementSource(audio);
        source.connect(gainNodeRef.current);
        audioCache.current.set(path, audio);
      }
    }

    // Preload other game sounds
    ["/game/shuffle.m4a", "/game/start_game.m4a", "/game/pause_game.m4a"].forEach(path => {
      const audio = new Audio(path);
      const source = audioContextRef.current.createMediaElementSource(audio);
      source.connect(gainNodeRef.current);
      audioCache.current.set(path, audio);
    });

    console.log("✅ AudioManager initialized with all sounds preloaded");
  }, []);

  // Generic function to play any cached sound
  const playSound = (path) => {
    const audioEl = audioCache.current.get(path);
    if (!audioEl) return console.warn("Audio not found:", path);

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }

    currentAudioRef.current = audioEl;
    audioEl.currentTime = 0;
    audioEl.play().catch(err => console.warn("Audio play blocked:", err));
  };

  // Convenience wrappers
  const playBingoCall = (cat, number) => playSound(`/voicemale/${cat}_${number}.m4a`);
  const playShuffle = () => playSound("/game/shuffle.m4a");
  const playStartGame = () => playSound("/game/start_game.m4a");
  const playPauseGame = () => playSound("/game/pause_game.m4a");

  return {
    playBingoCall,
    playShuffle,
    playStartGame,
    playPauseGame,
    playSound,
  };
};
