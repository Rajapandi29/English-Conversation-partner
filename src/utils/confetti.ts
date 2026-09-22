import confetti from 'canvas-confetti';

/**
 * Plays a gentle, pleasant synthesised celebration chime using standard Web Audio API
 */
const playCelebrationChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Celebratory major arpeggio notes (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);

      const startTime = ctx.currentTime + idx * 0.09;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  } catch {
    // If audio autoplay is locked until gesture, fail silently without error
  }
};

/**
 * Triggers a vibrant, multi-layered celebratory confetti animation effect
 * celebrating a perfect 100% grammar accuracy score.
 */
export const triggerGrammar100Confetti = () => {
  // Play celebration audio feedback
  playCelebrationChime();

  // Burst 1: High-impact central explosion
  confetti({
    particleCount: 90,
    spread: 100,
    origin: { x: 0.5, y: 0.55 },
    colors: ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#3B82F6', '#14B8A6', '#F43F5E'],
    ticks: 240,
    gravity: 1.1,
    scalar: 1.25,
    shapes: ['circle', 'square'],
    disableForReducedMotion: true,
  });

  // Burst 2: Left celebratory cannon
  setTimeout(() => {
    confetti({
      particleCount: 55,
      angle: 60,
      spread: 70,
      origin: { x: 0.05, y: 0.75 },
      colors: ['#10B981', '#34D399', '#6EE7B7', '#FBBF24', '#F472B6'],
      ticks: 280,
      gravity: 0.95,
      scalar: 1.1,
      disableForReducedMotion: true,
    });
  }, 160);

  // Burst 3: Right celebratory cannon
  setTimeout(() => {
    confetti({
      particleCount: 55,
      angle: 120,
      spread: 70,
      origin: { x: 0.95, y: 0.75 },
      colors: ['#6366F1', '#818CF8', '#A78BFA', '#F472B6', '#38BDF8'],
      ticks: 280,
      gravity: 0.95,
      scalar: 1.1,
      disableForReducedMotion: true,
    });
  }, 320);

  // Burst 4: Golden shower falling over the screen
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 130,
      origin: { x: 0.5, y: 0.2 },
      colors: ['#F59E0B', '#10B981', '#8B5CF6', '#34D399'],
      ticks: 220,
      gravity: 0.65,
      scalar: 0.95,
      disableForReducedMotion: true,
    });
  }, 500);
};
