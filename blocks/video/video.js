// /blocks/video/video.js
// Overlay + single-row custom controls; supports "no-interaction" and "no-pause".
// Uses kebab-case CSS hooks to satisfy Stylelint.

export default async function decorate(block) {
  // ---------- helpers ----------
  const txt = (el) => (el?.textContent || '').trim();
  const has = (c) => block.classList.contains(c);
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const formatTime = (sec0) => {
    const sec = Number.isFinite(sec0) && sec0 > 0 ? sec0 : 0;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const two = (n) => (n < 10 ? `0${n}` : `${n}`);
    return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`;
  };

  const parseGridConfig = () => {
    const cfg = {};
    [...block.children].forEach((row) => {
      if (!row.children || row.children.length !== 2) return;
      const [kEl, vEl] = row.children;
      const key = txt(kEl.querySelector('p,span,strong,em') || kEl);
      if (!key) return;
      let val = '';
      if (/^poster$/i.test(key)) {
        const img = vEl.querySelector('img');
        val = img?.getAttribute('src')
                    || vEl
                      .querySelector('source[srcset]')
                      ?.getAttribute('srcset')
                      ?.split(',')
                      ?.pop()
                      ?.trim()
                      ?.split(' ')?.[0]
                    || '';
      } else if (/^source$/i.test(key)) {
        const a = vEl.querySelector('a[href]');
        val = a ? a.href : txt(vEl);
      } else {
        val = txt(vEl);
      }
      cfg[key] = val;
    });
    return cfg;
  };

  const parseAspect = (v) => {
    if (!v || v.toLowerCase() === 'auto') return null;
    if (v.includes(':')) {
      const [w, h] = v.split(':').map(Number);
      if (w > 0 && h > 0) return `${w} / ${h}`;
    }
    if (v.includes('/')) return v;
    const f = parseFloat(v);
    return Number.isFinite(f) && f > 0 ? `${f} / 1` : null;
  };

  const classAspect = () => {
    const map = {
      'aspect-16x9': '16 / 9',
      'aspect-4x3': '4 / 3',
      'aspect-1x1': '1 / 1',
      'aspect-21x9': '21 / 9',
      'aspect-auto': null,
    };
    const entry = Object.entries(map).find(([cls]) => block.classList.contains(cls));
    return entry ? entry[1] : undefined;
  };

  // ---------- read config ----------
  const cfgGrid = parseGridConfig();
  const get = (k, d = '') => (cfgGrid[k] ?? cfgGrid[k?.toLowerCase?.()] ?? d).toString().trim();

  const src = get('Source', '');
  const poster = get('Poster', '');
  let controls = (get('Controls', 'none') || 'none').toLowerCase(); // none | native | custom
  let aspect = parseAspect(get('Aspect Ratio', '16:9'));
  let fit = (get('Fit', 'cover') || 'cover').toLowerCase(); // cover | contain
  const caption = get('Caption', '');
  let preload = (get('Preload', 'metadata') || 'metadata').toLowerCase(); // metadata | auto | none

  // class overrides
  if (has('native-controls')) controls = 'native';
  if (has('custom-controls')) controls = 'custom';
  if (has('no-controls')) controls = 'none';
  if (has('contain')) fit = 'contain';
  if (has('cover')) fit = 'cover';
  const classAsp = classAspect();
  if (classAsp !== undefined) aspect = classAsp;
  if (has('preload-auto')) preload = 'auto';
  if (has('preload-none')) preload = 'none';
  if (has('preload-metadata')) preload = 'metadata';

  // interaction guards
  const allowInteraction = !has('no-interaction');
  const allowKeyboard = allowInteraction && !has('no-keyboard');
  const blockContextMenu = has('no-context-menu');
  const forcePlay = has('no-pause') || has('force-play');
  const pipWanted = allowInteraction && has('pip');

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  let autoplay = !reducedMotion;
  if (has('autoplay')) autoplay = true;
  if (has('no-autoplay')) autoplay = false;

  let muted = true;
  if (has('muted')) muted = true;
  if (has('unmuted')) muted = false;

  let loop = true;
  if (has('loop')) loop = true;
  if (has('no-loop')) loop = false;

  let playsinline = true;
  if (has('playsinline')) playsinline = true;
  if (has('no-playsinline')) playsinline = false;

  const clickToggle = allowInteraction && !has('no-click-toggle');
  let pauseOffscreen = !has('no-pause-offscreen');
  if (forcePlay) pauseOffscreen = false;

  const restrictDownload = !has('allow-download');
  const restrictRate = !has('allow-rate');

  if (!src) {
    block.innerHTML = '<p class="video-error" style="color:#c33">[video] Missing Source</p>';
    return;
  }

  // ---------- build ----------
  block.textContent = ''; // clear authoring grid

  const figure = document.createElement('figure');
  figure.className = 'video';
  figure.style.setProperty('--video-fit', fit);
  if (aspect !== undefined && aspect !== null) figure.style.setProperty('--video-aspect', aspect);
  if (has('rounded')) figure.classList.add('video-rounded');
  if (has('shadow')) figure.classList.add('video-shadow');
  if (!allowInteraction) figure.classList.add('is-noninteractive');

  const mediaWrap = document.createElement('div');
  mediaWrap.className = 'video-media';

  const isGif = /\.gif(\?|$)/i.test(src);
  let v;

  if (isGif) {
    const img = document.createElement('img');
    img.className = 'video-gif';
    img.src = src;
    img.alt = caption || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    if (!allowInteraction) img.style.pointerEvents = 'none';
    mediaWrap.appendChild(img);
    figure.classList.add('is-gif');
    controls = 'none';
  } else {
    v = document.createElement('video');
    v.className = 'video-player';
    v.setAttribute('preload', preload);
    if (poster) v.poster = poster;

    const s = document.createElement('source');
    s.src = src;
    if (/\.mp4(\?|$)/i.test(src)) s.type = 'video/mp4';
    else if (/\.webm(\?|$)/i.test(src)) s.type = 'video/webm';
    else if (/\.og[gv](\?|$)/i.test(src)) s.type = 'video/ogg';
    v.appendChild(s);

    v.muted = muted;
    v.loop = loop;
    v.autoplay = autoplay && muted;
    v.playsInline = playsinline;
    if (playsinline) v.setAttribute('playsinline', '');
    if (controls === 'native' && allowInteraction) v.controls = true;

    const cl = [];
    if (restrictDownload) cl.push('nodownload');
    if (restrictRate) cl.push('noplaybackrate');
    cl.push('noremoteplayback');
    v.setAttribute('controlsList', cl.join(' '));

    if (!allowInteraction) {
      v.controls = false;
      v.style.pointerEvents = 'none';
    }

    mediaWrap.appendChild(v);
  }

  figure.appendChild(mediaWrap);

  if (blockContextMenu) {
    figure.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // overlay button (skip when no-interaction or GIF)
  let overlayBtn;
  if (!isGif && allowInteraction) {
    overlayBtn = document.createElement('button');
    overlayBtn.type = 'button';
    overlayBtn.className = 'video-overlay';
    overlayBtn.setAttribute('aria-label', 'Play');
    overlayBtn.textContent = '►';
    mediaWrap.appendChild(overlayBtn);

    const updateOverlayIcon = () => {
      if (v.ended) {
        overlayBtn.textContent = '↺';
        overlayBtn.setAttribute('aria-label', 'Replay');
      } else if (v.paused) {
        overlayBtn.textContent = '►';
        overlayBtn.setAttribute('aria-label', 'Play');
      } else {
        overlayBtn.textContent = '❚❚';
        overlayBtn.setAttribute('aria-label', 'Pause');
      }
    };

    const overlayToggle = () => {
      if (v.ended) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else if (v.paused) v.play().catch(() => {});
      else if (!forcePlay) v.pause();
    };

    overlayBtn.addEventListener('click', overlayToggle);
    if (clickToggle && controls !== 'custom') {
      v.addEventListener('click', overlayToggle);
      mediaWrap.addEventListener('touchstart', () => {});
    }
    ['play', 'pause', 'ended'].forEach((ev) => v.addEventListener(ev, updateOverlayIcon));
    updateOverlayIcon();
  }

  // custom controls
  if (!isGif && controls === 'custom' && allowInteraction) {
    const ctrls = document.createElement('div');
    ctrls.className = 'video-controls';
    ctrls.setAttribute('role', 'group');
    ctrls.setAttribute('aria-label', 'Video controls');

    const mkBtn = (cls, label, textIcon) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `video-btn ${cls}`;
      b.setAttribute('aria-label', label);
      b.setAttribute('title', label);
      b.textContent = textIcon;
      return b;
    };

    const btnPlay = mkBtn('video-btn-play', 'Play/Pause', '►');
    const btnStop = mkBtn('video-btn-stop', 'Stop', '■');
    const btnMute = mkBtn('video-btn-mute', 'Mute/Unmute', '🔇');

    const timeCurrent = document.createElement('span');
    const timeSep = document.createElement('span');
    const timeTotal = document.createElement('span');
    timeCurrent.className = 'video-time-current';
    timeSep.className = 'video-time-sep';
    timeTotal.className = 'video-time-total';
    timeCurrent.textContent = '0:00';
    timeSep.textContent = '/';
    timeTotal.textContent = '0:00';

    const track = document.createElement('div');
    track.className = 'video-track';
    const buffered = document.createElement('div');
    buffered.className = 'video-track-buffered';
    const progress = document.createElement('div');
    progress.className = 'video-track-progress';
    const seek = document.createElement('input');
    seek.type = 'range';
    seek.className = 'video-seek';
    seek.min = 0;
    seek.max = 1000;
    seek.value = 0;
    track.append(buffered, progress, seek);

    const volIcon = document.createElement('span');
    volIcon.className = 'video-volume-icon';
    volIcon.textContent = '🔊';
    const volRange = document.createElement('input');
    volRange.type = 'range';
    volRange.className = 'video-volume-range';
    volRange.min = 0;
    volRange.max = 1;
    volRange.step = 0.01;
    const vol = Number.isFinite(v.volume) ? v.volume : 1;
    volRange.value = v.muted ? 0 : vol;

    // PiP + Fullscreen
    const pipSupported = pipWanted && 'pictureInPictureEnabled' in document;
    const btnPip = pipSupported ? mkBtn('video-btn-pip', 'Picture in Picture', '⧉') : null;
    const btnFs = mkBtn('video-btn-fs', 'Fullscreen', '⤢');

    ctrls.append(
      btnPlay,
      btnStop,
      timeCurrent,
      timeSep,
      timeTotal,
      track,
      btnMute,
      volIcon,
      volRange,
      ...(btnPip ? [btnPip] : []),
      btnFs,
    );
    figure.appendChild(ctrls);

    // sync helpers
    const syncPlayIcon = () => {
      btnPlay.textContent = v.paused ? '►' : '❚❚';
    };
    const syncMuteIcon = () => {
      const mutedNow = v.muted || v.volume === 0;
      btnMute.textContent = mutedNow ? '🔇' : '🔊';
      volIcon.textContent = mutedNow ? '🔇' : '🔊';
    };
    const syncTime = () => {
      const d = Number.isFinite(v.duration) ? v.duration : 0;
      const c = Number.isFinite(v.currentTime) ? v.currentTime : 0;
      timeCurrent.textContent = formatTime(c);
      timeTotal.textContent = formatTime(d);
      const pct = d > 0 ? (c / d) * 100 : 0;
      progress.style.width = `${pct}%`;
      seek.value = Math.round((pct / 100) * seek.max);
      try {
        if (v.buffered?.length) {
          const end = v.buffered.end(v.buffered.length - 1);
          const bpct = d > 0 ? (end / d) * 100 : 0;
          buffered.style.width = `${bpct}%`;
        }
      } catch (_) { /* empty */ }
    };
    const updateVolBG = () => {
      const pct = Math.round((v.muted ? 0 : v.volume) * 100);
      volRange.style.backgroundSize = `${pct}% 2px`;
    };
    const syncOverlay = () => {
      if (!overlayBtn) return;
      let icon = '❚❚';
      let label = 'Pause';
      if (v.ended) {
        icon = '↺';
        label = 'Replay';
      } else if (v.paused) {
        icon = '►';
        label = 'Play';
      }
      overlayBtn.textContent = icon;
      overlayBtn.setAttribute('aria-label', label);
    };

    // wire
    btnPlay.addEventListener('click', () => {
      if (v.paused) {
        v.play().catch(() => {});
      } else if (!forcePlay) {
        v.pause();
      }
    });
    btnStop.addEventListener('click', () => {
      v.pause();
      v.currentTime = 0;
      if (forcePlay) v.play().catch(() => {});
    });
    btnMute.addEventListener('click', () => {
      if (!v.muted && v.volume === 0) v.volume = 0.5;
      v.muted = !v.muted;
    });
    volRange.addEventListener('input', () => {
      const val = clamp(parseFloat(volRange.value), 0, 1);
      v.volume = val;
      v.muted = val === 0;
      updateVolBG();
      syncMuteIcon();
    });
    seek.addEventListener('input', () => {
      const d = Number.isFinite(v.duration) ? v.duration : 0;
      const pct = seek.value / seek.max;
      if (d > 0) v.currentTime = d * pct;
      if (v.paused && forcePlay) v.play().catch(() => {});
    });

    // PiP
    if (btnPip) {
      const exitPip = () => {
        if (document.pictureInPictureElement) {
          return document.exitPictureInPicture();
        }
        return Promise.resolve();
      };

      const enterPip = () => {
        if (typeof v.requestPictureInPicture === 'function') {
          return v.requestPictureInPicture();
        }
        return Promise.resolve();
      };
      const updatePip = () => figure.classList.toggle('is-pip', document.pictureInPictureElement === v);
      btnPip.addEventListener('click', async () => {
        try {
          if (document.pictureInPictureElement === v) {
            await exitPip();
          } else {
            await enterPip();
          }
        } catch (_) { /* empty */ }
        updatePip();
      });
      document.addEventListener('enterpictureinpicture', updatePip);
      document.addEventListener('leavepictureinpicture', updatePip);
      updatePip();
    }

    // Fullscreen
    const isFs = () => document.fullscreenElement === figure;
    const enterFs = async () => {
      if (figure.requestFullscreen) await figure.requestFullscreen();
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    };
    const exitFs = async () => {
      if (document.exitFullscreen) await document.exitFullscreen();
    };
    const syncFs = () => {
      btnFs.textContent = isFs() ? '⤡' : '⤢';
      btnFs.setAttribute('aria-label', isFs() ? 'Exit Fullscreen' : 'Fullscreen');
    };
    btnFs.addEventListener('click', async () => {
      try {
        if (isFs()) { await exitFs(); } else { await enterFs(); }
      } catch (_) { /* empty */ }
      syncFs();
    });
    document.addEventListener('fullscreenchange', syncFs);
    syncFs();

    // events
    v.addEventListener('play', () => {
      figure.classList.remove('is-ended');
      syncPlayIcon();
      syncOverlay();
    });
    v.addEventListener('pause', () => {
      if (forcePlay && !v.ended) v.play().catch(() => {});
      syncPlayIcon();
      syncOverlay();
    });
    v.addEventListener('ended', () => {
      figure.classList.add('is-ended');
      syncPlayIcon();
      syncOverlay();
    });
    v.addEventListener('timeupdate', syncTime);
    v.addEventListener('progress', syncTime);
    v.addEventListener('loadedmetadata', () => {
      timeTotal.textContent = formatTime(v.duration || 0);
      syncTime();
    });
    v.addEventListener('volumechange', () => {
      volRange.value = v.muted ? 0 : v.volume;
      updateVolBG();
      syncMuteIcon();
    });

    // init
    syncPlayIcon();
    syncMuteIcon();
    syncTime();
    updateVolBG();
    syncOverlay?.();
  }

  if (caption) {
    const figcap = document.createElement('figcaption');
    figcap.className = 'video-caption';
    figcap.innerHTML = caption;
    figure.appendChild(figcap);
  }

  // surface classes
  let cls = 'no-controls';

  if (controls === 'native') {
    cls = 'has-native-controls';
  } else if (controls === 'custom' && allowInteraction) {
    cls = 'has-custom-controls';
  }

  figure.classList.add(cls);
  figure.classList.toggle('fit-contain', fit === 'contain');
  figure.classList.toggle('fit-cover', fit === 'cover');

  // pause off-screen
  if (!isGif && pauseOffscreen && allowInteraction && !forcePlay) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const inView = e.isIntersecting && e.intersectionRatio > 0.25;
          const vEl = figure.querySelector('video');
          if (!vEl) return;
          if (inView) vEl.play().catch(() => {});
          else vEl.pause();
        });
      },
      { threshold: [0, 0.25, 0.75, 1] },
    );
    io.observe(figure.querySelector('video'));
  }

  // keyboard shortcuts
  if (!isGif && allowKeyboard) {
    figure.tabIndex = 0;
    figure.addEventListener('keydown', (e) => {
      if (/input|textarea|select/i.test(document.activeElement?.tagName)) return;
      const vEl = figure.querySelector('video');
      if (!vEl) return;
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (vEl.paused) {
            vEl.play().catch(() => {});
          } else if (!forcePlay) {
            vEl.pause();
          }
          break;
        case 'm':
          vEl.muted = !vEl.muted;
          break;
        case 'f':
          if (document.fullscreenElement === figure) {
            document.exitFullscreen?.();
          } else {
            figure.requestFullscreen?.();
          }
          break;
        case 'p':
          if (pipWanted && 'pictureInPictureEnabled' in document) {
            if (document.pictureInPictureElement) {
              document.exitPictureInPicture();
            } else {
              vEl.requestPictureInPicture?.();
            }
          }
          break;
        case 'arrowleft':
          vEl.currentTime = Math.max(0, vEl.currentTime - 5);
          break;
        case 'arrowright':
          vEl.currentTime = Math.min(vEl.duration || vEl.currentTime + 5, vEl.currentTime + 5);
          break;
        case 'arrowup':
          vEl.volume = clamp((vEl.volume || 0) + 0.05, 0, 1);
          vEl.muted = vEl.volume === 0;
          break;
        case 'arrowdown':
          vEl.volume = clamp((vEl.volume || 0) - 0.05, 0, 1);
          vEl.muted = vEl.volume === 0;
          break;
        default:
          break;
      }
    });
  }

  block.appendChild(figure);
}
