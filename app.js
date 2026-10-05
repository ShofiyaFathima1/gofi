/**
 * OUR STORY — Memory Journal & Friendship Timeline
 * Interactive logic, scroll animations, audio player & particle canvas
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. Element Selectors
  // ==========================================================================
  const beginStoryBtn = document.getElementById('begin-story-btn');
  const headerMusicBtn = document.getElementById('header-music-btn');
  const chapter1 = document.getElementById('chapter-1');
  const musicSection = document.getElementById('music-reveal-section');
  const chapterSections = document.querySelectorAll('.chapter-section');
  const timelineProgress = document.getElementById('timeline-progress-bar');
  const timelineContainer = document.getElementById('timeline-flow');

  // Music Player Elements
  const playOurSongBtn = document.getElementById('play-our-song-btn');
  const playBtnIcon = document.getElementById('play-btn-icon');
  const playBtnText = document.getElementById('play-btn-text');
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioToggleIcon = document.getElementById('audio-toggle-icon');
  const audioRewindBtn = document.getElementById('audio-rewind-btn');
  const audioForwardBtn = document.getElementById('audio-forward-btn');
  const mainAudio = document.getElementById('main-audio');
  const vinylDisc = document.getElementById('vinyl-disc');
  const progressTrack = document.getElementById('audio-progress-track');
  const progressFill = document.getElementById('audio-progress-fill');
  const currentTimeEl = document.getElementById('audio-current-time');
  const totalTimeEl = document.getElementById('audio-total-time');
  const audioStatusBox = document.getElementById('audio-status-box');
  const audioStatusMessage = document.getElementById('audio-status-message');
  const userAudioFileInput = document.getElementById('user-audio-file-input');

  // Fullscreen Memory Overlay Elements
  const fullscreenOverlay = document.getElementById('fullscreen-memory-overlay');
  const closeFullscreenOverlayBtn = document.getElementById('close-fullscreen-overlay-btn');

  // Lightbox Elements
  const photoLightbox = document.getElementById('photo-lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-modal-img');
  const lightboxCaption = document.getElementById('lightbox-modal-caption');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');

  // Particles Canvas & Toggle
  const canvas = document.getElementById('particles-canvas');
  const toggleParticlesBtn = document.getElementById('toggle-particles-btn');

  // Custom photo uploaders
  const customPhotoUploaders = document.querySelectorAll('.custom-photo-uploader');

  // ==========================================================================
  // 2. Navigation & Smooth Scrolling
  // ==========================================================================
  if (beginStoryBtn && chapter1) {
    beginStoryBtn.addEventListener('click', () => {
      chapter1.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (headerMusicBtn && musicSection) {
    headerMusicBtn.addEventListener('click', () => {
      musicSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // ==========================================================================
  // 3. Scroll-Spy & Timeline Progress
  // ==========================================================================
  const chapterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
  });

  chapterSections.forEach(section => chapterObserver.observe(section));

  // Dynamic timeline progress height
  const updateTimelineProgress = () => {
    if (!timelineContainer || !timelineProgress) return;
    const rect = timelineContainer.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const startY = rect.top;
    const totalHeight = rect.height;

    // Calculate progress through the timeline container
    if (startY < windowHeight * 0.6) {
      const scrolled = (windowHeight * 0.6) - startY;
      const progressPercent = Math.min(Math.max((scrolled / totalHeight) * 100, 0), 100);
      timelineProgress.style.height = `${progressPercent}%`;
    } else {
      timelineProgress.style.height = '0%';
    }
  };

  window.addEventListener('scroll', updateTimelineProgress, { passive: true });
  updateTimelineProgress();

  // ==========================================================================
  // 4. Audio Player & Song Reveal
  // ==========================================================================
  let isPlaying = false;
  let audioContext = null;
  let synthInterval = null;
  let usingSynthesizerFallback = false;

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs) || secs === Infinity) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Play ambient chords using Web Audio API if no MP3 file exists yet
  const playGentleAmbientFallback = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    usingSynthesizerFallback = true;
    isPlaying = true;
    updatePlayUI(true);
    triggerFullscreenOverlay();

    // Gentle chord frequencies in soft pastel keys (F major / D minor nostalgic harmony)
    const chords = [
      [349.23, 440.00, 523.25], // F, A, C
      [329.63, 392.00, 493.88], // E, G, B
      [293.66, 349.23, 440.00], // D, F, A
      [261.63, 329.63, 392.00], // C, E, G
    ];

    let chordIdx = 0;
    const playNextChord = () => {
      if (!isPlaying || !usingSynthesizerFallback) return;
      const notes = chords[chordIdx % chords.length];
      chordIdx++;

      notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioContext.currentTime + (i * 0.08));

        gain.gain.setValueAtTime(0.001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.06, audioContext.currentTime + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 3.8);

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start(audioContext.currentTime + (i * 0.08));
        osc.stop(audioContext.currentTime + 4.0);
      });
    };

    playNextChord();
    if (synthInterval) clearInterval(synthInterval);
    synthInterval = setInterval(playNextChord, 4000);
  };

  const stopAmbientFallback = () => {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
    usingSynthesizerFallback = false;
  };

  // Update UI State for playing/paused
  const updatePlayUI = (playing) => {
    isPlaying = playing;
    if (playing) {
      vinylDisc.classList.add('is-spinning');
      if (audioToggleIcon) audioToggleIcon.textContent = '❚❚';
      if (playBtnIcon) playBtnIcon.textContent = '❚❚';
      if (playBtnText) playBtnText.textContent = 'PAUSE OUR SONG';
    } else {
      vinylDisc.classList.remove('is-spinning');
      if (audioToggleIcon) audioToggleIcon.textContent = '▶';
      if (playBtnIcon) playBtnIcon.textContent = '▶';
      if (playBtnText) playBtnText.textContent = 'PLAY OUR SONG';
    }
  };

  // Trigger Fullscreen Memory Screen
  let hasTriggeredOverlay = false;
  const triggerFullscreenOverlay = () => {
    if (fullscreenOverlay) {
      fullscreenOverlay.classList.add('is-active');
      hasTriggeredOverlay = true;
    }
  };

  // Handle Play/Pause
  const togglePlay = () => {
    if (!isPlaying) {
      // Try playing the audio element
      const playPromise = mainAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            updatePlayUI(true);
            triggerFullscreenOverlay();
            audioStatusMessage.innerHTML = `✨ Playing: <strong>${activeSongName}</strong>`;
          })
          .catch((err) => {
            console.warn('Audio playback info:', err.message);
            // If file is not present or blocked, inform user gracefully
            audioStatusMessage.innerHTML = 'Add your <strong>Poraney Poraney</strong> audio file here:';
            // Start gentle ambient synth experience as graceful preview
            playGentleAmbientFallback();
          });
      }
    } else {
      // Pause
      if (usingSynthesizerFallback) {
        stopAmbientFallback();
      } else {
        mainAudio.pause();
      }
      updatePlayUI(false);
    }
  };

  if (playOurSongBtn) {
    playOurSongBtn.addEventListener('click', togglePlay);
  }

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', togglePlay);
  }

  // Audio Progress & Time Updates
  mainAudio.addEventListener('timeupdate', () => {
    if (mainAudio.duration) {
      const percent = (mainAudio.currentTime / mainAudio.duration) * 100;
      progressFill.style.width = `${percent}%`;
      currentTimeEl.textContent = formatTime(mainAudio.currentTime);
      totalTimeEl.textContent = formatTime(mainAudio.duration);
    }
  });

  mainAudio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(mainAudio.duration);
    audioStatusMessage.innerHTML = '🎶 "Poraney Poraney" is ready to play!';
  });

  mainAudio.addEventListener('ended', () => {
    updatePlayUI(false);
    progressFill.style.width = '0%';
  });

  // Rewind & Fast Forward (10s)
  if (audioRewindBtn) {
    audioRewindBtn.addEventListener('click', () => {
      mainAudio.currentTime = Math.max(mainAudio.currentTime - 10, 0);
    });
  }

  if (audioForwardBtn) {
    audioForwardBtn.addEventListener('click', () => {
      if (mainAudio.duration) {
        mainAudio.currentTime = Math.min(mainAudio.currentTime + 10, mainAudio.duration);
      }
    });
  }

  // Seek bar scrub
  if (progressTrack) {
    progressTrack.addEventListener('click', (e) => {
      const rect = progressTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const targetPercent = clickX / width;
      if (mainAudio.duration) {
        mainAudio.currentTime = targetPercent * mainAudio.duration;
      }
    });
  }

  // ==========================================================================
  // IndexedDB Persistent Audio Storage (Persists song across runs/refreshes)
  // ==========================================================================
  const DB_NAME = 'ScrapbookAudioDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'audio_files';
  let activeSongName = 'Poraney Poraney';

  const openAudioDB = () => {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        return reject(new Error('IndexedDB not supported'));
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  };

  const saveAudioToDB = (file) => {
    return openAudioDB().then(db => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ blob: file, name: file.name, type: file.type }, 'saved_song');
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
      });
    });
  };

  const getAudioFromDB = () => {
    return openAudioDB().then(db => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('saved_song');
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e.target.error);
      });
    }).catch(() => null);
  };

  // Restore saved song from IndexedDB on startup if available
  getAudioFromDB().then((saved) => {
    if (saved && saved.blob) {
      const fileUrl = URL.createObjectURL(saved.blob);
      mainAudio.src = fileUrl;
      mainAudio.load();
      activeSongName = saved.name || 'Poraney Poraney';
      if (audioStatusMessage) {
        audioStatusMessage.innerHTML = `🎵 Saved audio: <strong>${activeSongName}</strong> ready to play!`;
      }
    }
  });

  // User Local Audio File Picker (Saves to IndexedDB for all future runs)
  if (userAudioFileInput) {
    userAudioFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        activeSongName = file.name;
        const fileUrl = URL.createObjectURL(file);
        stopAmbientFallback();
        mainAudio.src = fileUrl;
        mainAudio.load();
        audioStatusMessage.innerHTML = `🎵 Loaded: <strong>${file.name}</strong> (saved for next runs!)`;
        saveAudioToDB(file).catch(err => console.warn('Could not save to IndexedDB:', err));
        mainAudio.play().then(() => {
          updatePlayUI(true);
          triggerFullscreenOverlay();
        });
      }
    });
  }

  // Close Fullscreen Overlay & return to scrapbook
  if (closeFullscreenOverlayBtn && fullscreenOverlay) {
    closeFullscreenOverlayBtn.addEventListener('click', () => {
      fullscreenOverlay.classList.remove('is-active');
    });
  }

  // ==========================================================================
  // 5. Photo Lightbox Modal
  // ==========================================================================
  const polaroidFrames = document.querySelectorAll('.polaroid-frame, .keepsake-mini-card');

  polaroidFrames.forEach(frame => {
    frame.addEventListener('click', (e) => {
      // Don't trigger if clicked on the change photo button
      if (e.target.closest('.photo-replace-prompt')) return;

      const img = frame.querySelector('img');
      const title = frame.getAttribute('data-modal-title') || 'Memory Keepsake';
      const caption = frame.getAttribute('data-modal-caption') || '';

      if (img && photoLightbox) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || title;
        lightboxCaption.innerHTML = `<strong>${title}</strong><br><span style="font-size:1.2rem; color:var(--ink-secondary); font-family:var(--font-serif); font-style:italic;">${caption}</span>`;
        photoLightbox.classList.add('is-open');
        photoLightbox.setAttribute('aria-hidden', 'false');
      }
    });
  });

  const closeLightbox = () => {
    if (photoLightbox) {
      photoLightbox.classList.remove('is-open');
      photoLightbox.setAttribute('aria-hidden', 'true');
    }
  };

  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', closeLightbox);
  }

  if (photoLightbox) {
    photoLightbox.addEventListener('click', (e) => {
      if (e.target === photoLightbox) closeLightbox();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      if (fullscreenOverlay) fullscreenOverlay.classList.remove('is-active');
    }
  });

  // ==========================================================================
  // 6. Custom Photo Upload Support (Local Storage persistence)
  // ==========================================================================
  customPhotoUploaders.forEach(input => {
    const targetImgId = input.getAttribute('data-target');
    const targetImg = document.getElementById(targetImgId);

    // Load saved image if available
    const savedPhoto = localStorage.getItem(`scrapbook_photo_${targetImgId}`);
    if (savedPhoto && targetImg) {
      targetImg.src = savedPhoto;
    }

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && targetImg) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target.result;
          targetImg.src = result;
          try {
            localStorage.setItem(`scrapbook_photo_${targetImgId}`, result);
          } catch (storageErr) {
            console.warn('Local storage quota limit reached for photo persistence');
          }
        };
        reader.readAsDataURL(file);
      }
    });
  });

  // ==========================================================================
  // 7. Ambient Particle Animation (Soft Petals, Tiny Stars, Gentle Hearts)
  // ==========================================================================
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let animationId = null;
    let particlesEnabled = true;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Particle Palette
    const particleColors = [
      'rgba(248, 227, 222, 0.65)', // blush pink
      'rgba(207, 163, 150, 0.45)', // dusty rose
      'rgba(232, 224, 242, 0.6)',  // soft lavender
      'rgba(252, 230, 220, 0.55)', // muted peach
      'rgba(220, 229, 223, 0.45)', // light sage
    ];

    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * height; // initial spread
      }

      reset() {
        this.x = Math.random() * width;
        this.y = -20;
        this.size = Math.random() * 8 + 4;
        this.speedY = Math.random() * 0.8 + 0.4;
        this.speedX = Math.sin(Math.random() * Math.PI * 2) * 0.6;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.02;
        this.color = particleColors[Math.floor(Math.random() * particleColors.length)];
        this.type = Math.random() > 0.4 ? 'petal' : (Math.random() > 0.5 ? 'heart' : 'sparkle');
        this.opacity = Math.random() * 0.5 + 0.3;
      }

      update() {
        this.y += this.speedY;
        this.x += Math.sin(this.y * 0.01) * 0.8 + this.speedX * 0.3;
        this.rotation += this.rotSpeed;

        if (this.y > height + 20 || this.x < -30 || this.x > width + 30) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;

        if (this.type === 'petal') {
          // Soft curved blossom petal
          ctx.beginPath();
          ctx.ellipse(0, 0, this.size, this.size * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (this.type === 'heart') {
          // Tiny delicate heart
          const s = this.size * 0.35;
          ctx.beginPath();
          ctx.moveTo(0, s * 0.7);
          ctx.bezierCurveTo(-s * 1.5, -s * 0.5, -s * 1.5, -s * 2, 0, -s * 1.2);
          ctx.bezierCurveTo(s * 1.5, -s * 2, s * 1.5, -s * 0.5, 0, s * 0.7);
          ctx.fill();
        } else {
          // Tiny diamond sparkle
          const s = this.size * 0.4;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.6, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.6, 0);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }
    }

    const particlesCount = Math.min(Math.floor(width / 26), 40);
    const particles = Array.from({ length: particlesCount }, () => new Particle());

    const animateParticles = () => {
      ctx.clearRect(0, 0, width, height);
      if (particlesEnabled) {
        particles.forEach(p => {
          p.update();
          p.draw();
        });
      }
      animationId = requestAnimationFrame(animateParticles);
    };

    animateParticles();

    if (toggleParticlesBtn) {
      toggleParticlesBtn.addEventListener('click', () => {
        particlesEnabled = !particlesEnabled;
        toggleParticlesBtn.style.opacity = particlesEnabled ? '1' : '0.6';
        toggleParticlesBtn.querySelector('span:last-child').textContent = particlesEnabled ? 'Petals' : 'Paused';
      });
    }
  }
});
