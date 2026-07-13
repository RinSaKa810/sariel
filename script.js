const envelope = document.querySelector('.envelope');
const overlay = document.querySelector('.letter-overlay');
const letterCard = document.querySelector('.letter-card');
const musicToggle = document.querySelector('.music-toggle');
const musicAudio = document.querySelector('#music-audio');
const MUSIC_URL = 'music/bgmm.mp3'; // Replace with path to your MP3 file
const AudioCtor = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
const audioContext = AudioCtor ? new AudioCtor() : null;
let hasStartedMusic = false;
let isMusicEnabled = false;

function playOpenSound() {
  if (!audioContext) return;

  const playTone = () => {
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.14);
  };

  if (audioContext.state === 'suspended') {
    audioContext.resume().then(playTone).catch(() => {});
  } else {
    playTone();
  }
}

// Detect if device supports hover (non-touch)
const isTouchDevice = () => {
  return (
    (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
  );
};

const supportsHover = !isTouchDevice();

function openLetter() {
  overlay.classList.add('open');
  envelope.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  envelope.setAttribute('aria-expanded', 'true');
  document.body.classList.add('letter-open');
  playOpenSound();
  setMusicState(true);
}

function closeLetter() {
  overlay.classList.remove('open');
  envelope.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  envelope.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('letter-open');
}

function toggleLetter() {
  const isOpen = overlay.classList.contains('open');
  if (isOpen) {
    closeLetter();
  } else {
    openLetter();
  }
}

function handlePointerMove(event) {
  if (!supportsHover || !envelope || overlay.classList.contains('open')) {
    envelope?.classList.remove('proximity-hover');
    envelope && (envelope.style.transform = '');
    return;
  }

  const rect = envelope.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
  const proximity = Math.max(0, 1 - distance / 220);

  if (proximity > 0.18) {
    envelope.classList.add('proximity-hover');
    envelope.style.transform = `translate(${(event.clientX - centerX) * 0.02}px, ${(event.clientY - centerY) * 0.02}px) scale(1.035)`;
  } else {
    envelope.classList.remove('proximity-hover');
    envelope.style.transform = '';
  }
}

function setMusicState(enabled) {
  if (!musicToggle || !musicAudio) return;

  isMusicEnabled = enabled;
  musicToggle.classList.toggle('active', enabled);
  musicToggle.setAttribute('aria-pressed', String(enabled));
  musicToggle.setAttribute('aria-label', enabled ? 'Turn off background music' : 'Turn on background music');

  if (enabled) {
    if (!hasStartedMusic) {
      hasStartedMusic = true;
      musicAudio.src = MUSIC_URL;
      musicAudio.preload = 'auto';
      musicAudio.loop = true;
      musicAudio.load();
    }

    musicAudio.volume = 1;
    if (musicAudio.paused) {
      musicAudio.play().catch(err => console.log('Autoplay prevented:', err));
    }
  } else {
    if (!musicAudio.paused) {
      musicAudio.volume = 0;
    }
  }
}

envelope?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  toggleLetter();
});

overlay?.addEventListener('click', () => {
  closeLetter();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeLetter();
  }
});

musicToggle?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  const isEnabled = musicToggle.classList.contains('active');
  setMusicState(!isEnabled);
});

// Only add pointer move listener on devices with hover support
if (supportsHover) {
  document.addEventListener('pointermove', handlePointerMove);
}

document.addEventListener('mousemove', handlePointerMove);
setMusicState(false);
