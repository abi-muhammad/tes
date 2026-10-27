const STORAGE_SEEN_HELP_KEY = 'kpw_seen_controls_v1';
const STORAGE_VCONTROLS_KEY = 'kpw_show_vcontrols';

export class UIManager {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.bubbleTimeout = null;
    this.showVirtualControls = localStorage.getItem(STORAGE_VCONTROLS_KEY) !== 'false';

    this.cacheElements();
    this.bindUIEvents();
    this.bindInputControls();
    this.syncSettingsUI();
  }

  cacheElements() {
    this.canvasContainer = document.getElementById('canvas-container');
    this.webglFallback = document.getElementById('webgl-fallback');
    this.orientationToast = document.getElementById('orientation-toast');
    this.btnDismissToast = document.getElementById('btn-dismiss-toast');

    this.hud = document.getElementById('hud');
    this.hudScore = document.getElementById('hud-score');
    this.hudCoins = document.getElementById('hud-coins');
    this.hudHighscore = document.getElementById('hud-highscore');
    this.hudFps = document.getElementById('hud-fps');
    this.btnHudHelp = document.getElementById('btn-hud-help');
    this.btnHudMute = document.getElementById('btn-hud-mute');
    this.btnHudPause = document.getElementById('btn-hud-pause');

    this.chaseStatusText = document.getElementById('chase-status-text');
    this.chaseDistanceText = document.getElementById('chase-distance-text');
    this.chaseBarFill = document.getElementById('chase-bar-fill');
    this.chaseTeacherHead = document.getElementById('chase-teacher-head');

    this.hudPowerups = document.getElementById('hud-powerups');
    this.comicBubble = document.getElementById('comic-bubble');
    this.comicBubbleText = document.getElementById('comic-bubble-text');

    this.virtualControls = document.getElementById('virtual-controls');
    this.btnVcLeft = document.getElementById('btn-vc-left');
    this.btnVcRight = document.getElementById('btn-vc-right');
    this.btnVcJump = document.getElementById('btn-vc-jump');
    this.btnVcSlide = document.getElementById('btn-vc-slide');

    this.menuScreen = document.getElementById('menu-screen');
    this.menuBestScore = document.getElementById('menu-best-score');
    this.menuTotalCoins = document.getElementById('menu-total-coins');
    this.selectQuality = document.getElementById('select-quality');
    this.toggleVControls = document.getElementById('toggle-vcontrols');
    this.btnStartGame = document.getElementById('btn-start-game');
    this.btnOpenHelp = document.getElementById('btn-open-help');
    this.btnMenuMute = document.getElementById('btn-menu-mute');

    this.pauseScreen = document.getElementById('pause-screen');
    this.selectQualityPause = document.getElementById('select-quality-pause');
    this.toggleVControlsPause = document.getElementById('toggle-vcontrols-pause');
    this.btnResumeGame = document.getElementById('btn-resume-game');
    this.btnPauseHelp = document.getElementById('btn-pause-help');
    this.btnRestartFromPause = document.getElementById('btn-restart-from-pause');
    this.btnQuitToMenu = document.getElementById('btn-quit-to-menu');

    this.gameoverScreen = document.getElementById('gameover-screen');
    this.gameoverQuote = document.getElementById('gameover-quote');
    this.goScore = document.getElementById('go-score');
    this.goCoins = document.getElementById('go-coins');
    this.goBest = document.getElementById('go-best');
    this.newRecordBanner = document.getElementById('new-record-banner');
    this.btnPlayAgain = document.getElementById('btn-play-again');
    this.btnGameoverMenu = document.getElementById('btn-gameover-menu');

    this.helpModal = document.getElementById('help-modal');
    this.btnCloseHelp = document.getElementById('btn-close-help');
  }

  bindUIEvents() {
    this.btnStartGame.addEventListener('click', () => {
      // Jika pemain baru pertama kali bermain, tampilkan petunjuk kontrol lebih dulu
      if (!localStorage.getItem(STORAGE_SEEN_HELP_KEY)) {
        try {
          localStorage.setItem(STORAGE_SEEN_HELP_KEY, 'true');
        } catch {}
        this.openHelp(true);
      } else {
        this.callbacks.onStartGame();
      }
    });

    this.btnOpenHelp.addEventListener('click', () => this.openHelp(false));
    this.btnPauseHelp.addEventListener('click', () => this.openHelp(false));
    this.btnHudHelp.addEventListener('click', () => {
      this.callbacks.onPauseGame();
      this.openHelp(false);
    });

    this.btnCloseHelp.addEventListener('click', () => {
      const shouldStart = this.helpModal.dataset.startAfterClose === 'true';
      this.helpModal.dataset.startAfterClose = 'false';
      this.helpModal.classList.add('hidden');
      if (shouldStart) {
        this.callbacks.onStartGame();
      }
    });

    this.btnHudPause.addEventListener('click', () => this.callbacks.onPauseGame());
    this.btnResumeGame.addEventListener('click', () => this.callbacks.onResumeGame());
    this.btnRestartFromPause.addEventListener('click', () => this.callbacks.onStartGame());
    this.btnQuitToMenu.addEventListener('click', () => this.callbacks.onQuitToMenu());

    this.btnPlayAgain.addEventListener('click', () => this.callbacks.onStartGame());
    this.btnGameoverMenu.addEventListener('click', () => this.callbacks.onQuitToMenu());

    this.btnHudMute.addEventListener('click', () => this.callbacks.onToggleMute());
    this.btnMenuMute.addEventListener('click', () => this.callbacks.onToggleMute());

    this.selectQuality.addEventListener('change', (e) => {
      this.selectQualityPause.value = e.target.value;
      this.callbacks.onChangeQuality(e.target.value);
    });

    this.selectQualityPause.addEventListener('change', (e) => {
      this.selectQuality.value = e.target.value;
      this.callbacks.onChangeQuality(e.target.value);
    });

    const handleVControlChange = (checked) => {
      this.showVirtualControls = checked;
      this.toggleVControls.checked = checked;
      this.toggleVControlsPause.checked = checked;
      try {
        localStorage.setItem(STORAGE_VCONTROLS_KEY, String(checked));
      } catch {}
      this.updateVirtualControlsVisibility(this.callbacks.isPlaying());
    };

    this.toggleVControls.addEventListener('change', (e) => handleVControlChange(e.target.checked));
    this.toggleVControlsPause.addEventListener('change', (e) =>
      handleVControlChange(e.target.checked)
    );

    this.btnDismissToast.addEventListener('click', () => {
      this.orientationToast.classList.add('hidden');
      this.orientationToast.dataset.dismissed = 'true';
    });
  }

  bindInputControls() {
    // 1. Kontrol Keyboard untuk Desktop
    window.addEventListener('keydown', (e) => {
      if (!this.helpModal.classList.contains('hidden')) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.btnCloseHelp.click();
        }
        return;
      }

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (this.callbacks.isPlaying()) {
          this.callbacks.onPauseGame();
        } else if (this.callbacks.isPaused()) {
          this.callbacks.onResumeGame();
        }
        return;
      }

      if (!this.callbacks.isPlaying()) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          this.callbacks.onAction('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          this.callbacks.onAction('RIGHT');
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          e.preventDefault();
          this.callbacks.onAction('JUMP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          this.callbacks.onAction('SLIDE');
          break;
        default:
          break;
      }
    });

    // 2. Kontrol Tombol Virtual (Respons Cepat via pointerdown)
    const bindVCButton = (btn, actionName) => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add('active-press');
        if (this.callbacks.isPlaying()) {
          this.callbacks.onAction(actionName);
        }
      });
      const clearPress = () => btn.classList.remove('active-press');
      btn.addEventListener('pointerup', clearPress);
      btn.addEventListener('pointercancel', clearPress);
      btn.addEventListener('pointerleave', clearPress);
    };

    bindVCButton(this.btnVcLeft, 'LEFT');
    bindVCButton(this.btnVcRight, 'RIGHT');
    bindVCButton(this.btnVcJump, 'JUMP');
    bindVCButton(this.btnVcSlide, 'SLIDE');

    // 3. Kontrol Swipe Layar Sentuh (Kompatibel Chrome Android via Touch & Pointer Events)
    const SWIPE_THRESHOLD = 30; // Minimal 30px agar sentuhan tidak sengaja tidak memicu gerakan
    let startX = 0;
    let startY = 0;
    let swipeActive = false;
    let swipeTriggered = false;

    const onGestureStart = (x, y) => {
      if (!this.callbacks.isPlaying()) return;
      startX = x;
      startY = y;
      swipeActive = true;
      swipeTriggered = false;
    };

    const onGestureMove = (x, y) => {
      if (!swipeActive || swipeTriggered || !this.callbacks.isPlaying()) return;
      const dx = x - startX;
      const dy = y - startY;

      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
        return;
      }

      // Kunci agar satu swipe hanya memicu tepat satu aksi
      swipeTriggered = true;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          this.callbacks.onAction('RIGHT');
        } else {
          this.callbacks.onAction('LEFT');
        }
      } else {
        if (dy < 0) {
          this.callbacks.onAction('JUMP');
        } else {
          this.callbacks.onAction('SLIDE');
        }
      }
    };

    const onGestureEnd = () => {
      swipeActive = false;
      swipeTriggered = false;
    };

    // Touch Events untuk Android Chrome
    this.canvasContainer.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length === 1) {
          onGestureStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );

    this.canvasContainer.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length === 1) {
          onGestureMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );

    this.canvasContainer.addEventListener('touchend', onGestureEnd, { passive: true });
    this.canvasContainer.addEventListener('touchcancel', onGestureEnd, { passive: true });

    // Pointer Events untuk perangkat hybrid/desktop drag
    this.canvasContainer.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // Sudah ditangani touchstart
      onGestureStart(e.clientX, e.clientY);
    });
    this.canvasContainer.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      onGestureMove(e.clientX, e.clientY);
    });
    this.canvasContainer.addEventListener('pointerup', onGestureEnd);
    this.canvasContainer.addEventListener('pointercancel', onGestureEnd);
  }

  syncSettingsUI() {
    this.toggleVControls.checked = this.showVirtualControls;
    this.toggleVControlsPause.checked = this.showVirtualControls;
  }

  setQualitySelect(quality) {
    this.selectQuality.value = quality;
    this.selectQualityPause.value = quality;
  }

  updateMuteButtons(muted) {
    this.btnHudMute.textContent = muted ? '🔇' : '🔊';
    this.btnMenuMute.textContent = muted ? '🔇 Suara: OFF' : '🔊 Suara: ON';
  }

  updateVirtualControlsVisibility(isPlaying) {
    if (isPlaying && this.showVirtualControls) {
      this.virtualControls.classList.remove('hidden');
    } else {
      this.virtualControls.classList.add('hidden');
    }
  }

  checkOrientationHint() {
    if (this.orientationToast.dataset.dismissed === 'true') return;
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isPortrait && window.innerWidth < 768) {
      this.orientationToast.classList.remove('hidden');
    } else {
      this.orientationToast.classList.add('hidden');
    }
  }

  openHelp(startAfterClose = false) {
    this.helpModal.dataset.startAfterClose = String(startAfterClose);
    this.helpModal.classList.remove('hidden');
  }

  showMenu(highScore, totalCoins) {
    this.menuBestScore.textContent = `${Math.floor(highScore)} m`;
    this.menuTotalCoins.textContent = `${totalCoins}`;
    this.menuScreen.classList.remove('hidden');
    this.pauseScreen.classList.add('hidden');
    this.gameoverScreen.classList.add('hidden');
    this.hud.classList.add('hidden');
    this.updateVirtualControlsVisibility(false);
  }

  showPlaying(highScore) {
    this.hudHighscore.textContent = `${Math.floor(highScore)} m`;
    this.menuScreen.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.gameoverScreen.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.updateVirtualControlsVisibility(true);
  }

  showPause() {
    this.pauseScreen.classList.remove('hidden');
    this.updateVirtualControlsVisibility(false);
  }

  showGameOver(score, coins, highScore, isNewRecord, quote) {
    this.goScore.textContent = `${Math.floor(score)} m`;
    this.goCoins.textContent = `${coins}`;
    this.goBest.textContent = `${Math.floor(highScore)} m`;
    this.gameoverQuote.textContent = quote;

    if (isNewRecord) {
      this.newRecordBanner.classList.remove('hidden');
    } else {
      this.newRecordBanner.classList.add('hidden');
    }

    this.gameoverScreen.classList.remove('hidden');
    this.updateVirtualControlsVisibility(false);
  }

  showWebGLFallback() {
    this.webglFallback.classList.remove('hidden');
    this.menuScreen.classList.add('hidden');
  }

  showComicBubble(text, durationMs = 3000) {
    this.comicBubbleText.textContent = text;
    this.comicBubble.classList.remove('hidden');
    if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);
    this.bubbleTimeout = setTimeout(() => {
      this.comicBubble.classList.add('hidden');
    }, durationMs);
  }

  updateHUD(score, coins, highScore, teacherDistance, maxDistance, activeBuffs, currentFps = 60) {
    this.hudScore.textContent = `${Math.floor(score)} m`;
    this.hudCoins.textContent = `${coins}`;
    this.hudHighscore.textContent = `${Math.floor(Math.max(score, highScore))} m`;
    if (this.hudFps) {
      this.hudFps.textContent = `${Math.round(currentFps)} FPS`;
    }

    // Update meter jarak kejaran Pak Wahid
    const distRounded = Math.max(0, Math.round(teacherDistance));
    this.chaseDistanceText.textContent = `${distRounded} m di belakang`;

    const ratio = Math.max(0, Math.min(1, teacherDistance / maxDistance));
    const fillPct = Math.round(ratio * 100);
    this.chaseBarFill.style.width = `${fillPct}%`;
    // Posisi ikon Pak Wahid mendekati siswa (96%) saat jarak mengecil
    const teacherLeftPct = Math.round(92 - ratio * 84);
    this.chaseTeacherHead.style.left = `${teacherLeftPct}%`;

    if (teacherDistance <= 6.5) {
      this.chaseStatusText.textContent = '🚨 Pak Wahid: DEKAT SEKALI!';
      this.chaseStatusText.classList.add('danger');
    } else if (teacherDistance <= 12) {
      this.chaseStatusText.textContent = '⚠️ Pak Wahid: Mengejar!';
      this.chaseStatusText.classList.remove('danger');
    } else {
      this.chaseStatusText.textContent = '👨‍🏫 Pak Wahid: Jarak Aman';
      this.chaseStatusText.classList.remove('danger');
    }

    // Update daftar badge power-up
    if (activeBuffs.length === 0) {
      if (this.hudPowerups.innerHTML !== '') {
        this.hudPowerups.innerHTML = '';
      }
    } else {
      this.hudPowerups.innerHTML = activeBuffs
        .map((b) => `<div class="powerup-badge"><span>${b.label}</span> <strong>${b.remaining}d</strong></div>`)
        .join('');
    }
  }
}
