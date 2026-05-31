/**
 * VirtualOS Music Player Application
 * Premium music player with visualizer, playlist, and full playback controls
 */
VOS.MusicApp = {
    _states: {},

    _playlist: [
        { title: 'Midnight City',       artist: 'M83',               duration: 243 },
        { title: 'Blinding Lights',     artist: 'The Weeknd',        duration: 200 },
        { title: 'Bohemian Rhapsody',   artist: 'Queen',             duration: 354 },
        { title: 'Starboy',             artist: 'The Weeknd',        duration: 230 },
        { title: 'Strobe',              artist: 'Deadmau5',          duration: 637 },
        { title: 'Redbone',             artist: 'Childish Gambino',  duration: 327 },
        { title: 'Nuvole Bianche',      artist: 'Ludovico Einaudi',  duration: 348 },
        { title: 'Bad Guy',             artist: 'Billie Eilish',     duration: 194 }
    ],

    init(winId, container) {
        const state = {
            currentTrack: 0,
            playing: false,
            shuffle: false,
            repeat: false,
            volume: 0.75,
            elapsed: 0,
            progressInterval: null,
            visualizerInterval: null,
            visualizerBars: [],
            visualizerTargets: []
        };
        this._states[winId] = state;

        container.innerHTML = this._buildHTML(winId);

        this._cacheDOM(winId, container);
        this._renderPlaylist(winId);
        this._updateTrackDisplay(winId);
        this._initVisualizer(winId);
        this._bindEvents(winId);
        this._bindMiniWidget(winId);
        this.updateMiniWidget();
    },

    /* ─────────── HTML Template ─────────── */

    _buildHTML(winId) {
        return `
            <div class="music-app">
                <div class="music-body">
                    <!-- LEFT: Disc, Info, Visualizer, Controls -->
                    <div class="music-left">
                        <div class="music-disc-container">
                            <div class="music-disc" id="${winId}-disc">🎵</div>
                        </div>
                        <div class="music-song-info">
                            <div class="music-song-title" id="${winId}-title">—</div>
                            <div class="music-song-artist" id="${winId}-artist">—</div>
                        </div>
                        <canvas class="music-visualizer-canvas" id="${winId}-visualizer"></canvas>
                        <div class="music-controls-row">
                            <button class="music-btn" id="${winId}-shuffle" title="Shuffle">🔀</button>
                            <button class="music-btn" id="${winId}-prev"    title="Previous">⏮</button>
                            <button class="music-btn music-btn-play" id="${winId}-play" title="Play">▶</button>
                            <button class="music-btn" id="${winId}-next"    title="Next">⏭</button>
                            <button class="music-btn" id="${winId}-repeat"  title="Repeat">🔁</button>
                        </div>
                        <div class="music-progress-bar">
                            <span id="${winId}-elapsed">0:00</span>
                            <input type="range" class="music-progress-slider" id="${winId}-progress" min="0" max="100" value="0" />
                            <span id="${winId}-duration">0:00</span>
                        </div>
                        <div class="music-progress-bar" style="margin-top:10px;">
                            <span style="font-size:0.85rem;">🔊</span>
                            <input type="range" class="music-progress-slider" id="${winId}-volume" min="0" max="100" value="75" />
                        </div>
                    </div>
                    <!-- RIGHT: Playlist -->
                    <div class="music-right">
                        <div class="playlist-header">Playlist</div>
                        <div id="${winId}-playlist"></div>
                    </div>
                </div>
            </div>`;
    },

    /* ─────────── DOM Caching ─────────── */

    _cacheDOM(winId, container) {
        const s = this._states[winId];
        s.dom = {
            disc:        container.querySelector(`#${winId}-disc`),
            title:       container.querySelector(`#${winId}-title`),
            artist:      container.querySelector(`#${winId}-artist`),
            canvas:      container.querySelector(`#${winId}-visualizer`),
            playBtn:     container.querySelector(`#${winId}-play`),
            prevBtn:     container.querySelector(`#${winId}-prev`),
            nextBtn:     container.querySelector(`#${winId}-next`),
            shuffleBtn:  container.querySelector(`#${winId}-shuffle`),
            repeatBtn:   container.querySelector(`#${winId}-repeat`),
            progress:    container.querySelector(`#${winId}-progress`),
            elapsedEl:   container.querySelector(`#${winId}-elapsed`),
            durationEl:  container.querySelector(`#${winId}-duration`),
            volumeEl:    container.querySelector(`#${winId}-volume`),
            playlistEl:  container.querySelector(`#${winId}-playlist`)
        };
    },

    /* ─────────── Event Binding ─────────── */

    _bindEvents(winId) {
        const s = this._states[winId];
        const d = s.dom;

        d.playBtn.addEventListener('click', () => this._togglePlay(winId));
        d.prevBtn.addEventListener('click', () => this._prevTrack(winId));
        d.nextBtn.addEventListener('click', () => this._nextTrack(winId));

        d.shuffleBtn.addEventListener('click', () => {
            s.shuffle = !s.shuffle;
            d.shuffleBtn.style.opacity = s.shuffle ? '1' : '0.45';
        });

        d.repeatBtn.addEventListener('click', () => {
            s.repeat = !s.repeat;
            d.repeatBtn.style.opacity = s.repeat ? '1' : '0.45';
        });

        // Initial toggle visual states
        d.shuffleBtn.style.opacity = '0.45';
        d.repeatBtn.style.opacity  = '0.45';

        d.progress.addEventListener('input', () => {
            const track = this._playlist[s.currentTrack];
            s.elapsed = Math.floor((d.progress.value / 100) * track.duration);
            d.elapsedEl.textContent = this._fmtTime(s.elapsed);
        });

        d.volumeEl.addEventListener('input', () => {
            s.volume = d.volumeEl.value / 100;
        });
    },

    /* ─────────── Playback Logic ─────────── */

    _togglePlay(winId) {
        const s = this._states[winId];
        s.playing ? this._pause(winId) : this._play(winId);
    },

    _play(winId) {
        const s = this._states[winId];
        s.playing = true;
        s.dom.playBtn.textContent = '⏸';
        s.dom.disc.classList.add('playing');

        // Progress interval – tick every 1 s
        this._clearInterval(s, 'progressInterval');
        s.progressInterval = setInterval(() => {
            const track = this._playlist[s.currentTrack];
            if (s.elapsed >= track.duration) {
                this._onTrackEnd(winId);
                return;
            }
            s.elapsed++;
            s.dom.progress.value = (s.elapsed / track.duration) * 100;
            s.dom.elapsedEl.textContent = this._fmtTime(s.elapsed);
        }, 1000);

        // Visualizer interval – animate at ~30 fps
        this._startVisualizer(winId);
        this.updateMiniWidget();
    },

    _pause(winId) {
        const s = this._states[winId];
        s.playing = false;
        s.dom.playBtn.textContent = '▶';
        s.dom.disc.classList.remove('playing');

        this._clearInterval(s, 'progressInterval');
        this._stopVisualizer(winId);
        this.updateMiniWidget();
    },

    _onTrackEnd(winId) {
        const s = this._states[winId];
        if (s.repeat) {
            s.elapsed = 0;
            return; // keep playing same track
        }
        this._nextTrack(winId);
    },

    _prevTrack(winId) {
        const s = this._states[winId];
        const wasPlaying = s.playing;
        if (wasPlaying) this._pause(winId);

        if (s.elapsed > 3) {
            // restart current track if more than 3 s in
            s.elapsed = 0;
        } else {
            s.currentTrack = (s.currentTrack - 1 + this._playlist.length) % this._playlist.length;
        }
        s.elapsed = 0;
        this._updateTrackDisplay(winId);
        this._highlightPlaylist(winId);
        if (wasPlaying) this._play(winId);
    },

    _nextTrack(winId) {
        const s = this._states[winId];
        const wasPlaying = s.playing;
        if (wasPlaying) this._pause(winId);

        if (s.shuffle) {
            let next;
            do { next = Math.floor(Math.random() * this._playlist.length); } while (next === s.currentTrack && this._playlist.length > 1);
            s.currentTrack = next;
        } else {
            s.currentTrack = (s.currentTrack + 1) % this._playlist.length;
        }
        s.elapsed = 0;
        this._updateTrackDisplay(winId);
        this._highlightPlaylist(winId);
        if (wasPlaying) this._play(winId);
    },

    _selectTrack(winId, index) {
        const s = this._states[winId];
        const wasPlaying = s.playing;
        if (wasPlaying) this._pause(winId);

        s.currentTrack = index;
        s.elapsed = 0;
        this._updateTrackDisplay(winId);
        this._highlightPlaylist(winId);
        this._play(winId);
    },

    /* ─────────── UI Updates ─────────── */

    _updateTrackDisplay(winId) {
        const s = this._states[winId];
        const track = this._playlist[s.currentTrack];
        s.dom.title.textContent    = track.title;
        s.dom.artist.textContent   = track.artist;
        s.dom.durationEl.textContent = this._fmtTime(track.duration);
        s.dom.elapsedEl.textContent  = this._fmtTime(s.elapsed);
        s.dom.progress.value = 0;
        s.dom.progress.max = 100;
        this.updateMiniWidget();
    },

    _renderPlaylist(winId) {
        const s = this._states[winId];
        let html = '';
        this._playlist.forEach((t, i) => {
            html += `
                <div class="playlist-item${i === s.currentTrack ? ' active' : ''}" data-index="${i}">
                    <span class="playlist-song-num">${i + 1}</span>
                    <span style="flex:1;overflow:hidden;">
                        <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.title}</div>
                        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px;">${t.artist}</div>
                    </span>
                    <span style="opacity:0.45;font-size:0.75rem;">${this._fmtTime(t.duration)}</span>
                </div>`;
        });
        s.dom.playlistEl.innerHTML = html;

        // Attach click handlers
        s.dom.playlistEl.querySelectorAll('.playlist-item').forEach(el => {
            el.addEventListener('click', () => {
                this._selectTrack(winId, parseInt(el.dataset.index));
            });
        });
    },

    _highlightPlaylist(winId) {
        const s = this._states[winId];
        s.dom.playlistEl.querySelectorAll('.playlist-item').forEach((el, i) => {
            el.classList.toggle('active', i === s.currentTrack);
        });
    },

    /* ─────────── Premium Gradient Visualizer ─────────── */

    _initVisualizer(winId) {
        const s = this._states[winId];
        const canvas = s.dom.canvas;
        // Set canvas pixel dimensions to match CSS layout
        const rect = canvas.getBoundingClientRect();
        canvas.width  = rect.width  || 300;
        canvas.height = rect.height || 45;

        const barCount = 32;
        s.visualizerBars    = new Array(barCount).fill(0);
        s.visualizerTargets = new Array(barCount).fill(0);

        // Initial idle draw
        this._drawVisualizerFrame(winId);
    },

    _startVisualizer(winId) {
        const s = this._states[winId];
        this._clearInterval(s, 'visualizerInterval');

        s.visualizerInterval = setInterval(() => {
            const bars = s.visualizerBars;
            const targets = s.visualizerTargets;
            const len = bars.length;

            // Generate new random targets every few frames
            for (let i = 0; i < len; i++) {
                // Create a smooth curve shape biased toward the center
                const center = len / 2;
                const distFromCenter = Math.abs(i - center) / center;
                const envelope = 1 - distFromCenter * 0.55;
                targets[i] = (Math.random() * 0.85 + 0.15) * envelope;
            }

            // Ease current values toward targets
            for (let i = 0; i < len; i++) {
                bars[i] += (targets[i] - bars[i]) * 0.28;
            }

            this._drawVisualizerFrame(winId);
        }, 50);
    },

    _stopVisualizer(winId) {
        const s = this._states[winId];
        this._clearInterval(s, 'visualizerInterval');

        // Decay bars to zero
        const decayId = setInterval(() => {
            let allZero = true;
            for (let i = 0; i < s.visualizerBars.length; i++) {
                s.visualizerBars[i] *= 0.82;
                if (s.visualizerBars[i] > 0.005) allZero = false;
                else s.visualizerBars[i] = 0;
            }
            this._drawVisualizerFrame(winId);
            if (allZero) clearInterval(decayId);
        }, 40);
    },

    _drawVisualizerFrame(winId) {
        const s = this._states[winId];
        const canvas = s.dom.canvas;
        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        const bars = s.visualizerBars;
        const len = bars.length;
        const gap = 2;
        const barW = (W - gap * (len - 1)) / len;

        ctx.clearRect(0, 0, W, H);

        for (let i = 0; i < len; i++) {
            const barH = Math.max(2, bars[i] * H * 0.92);
            const x = i * (barW + gap);
            const y = H - barH;

            // Premium gradient per bar: accent → purple → pink
            const grad = ctx.createLinearGradient(x, H, x, y);
            const hue1 = 200 + (i / len) * 120;   // cyan → blue → purple
            const hue2 = 280 + (i / len) * 60;     // purple → magenta
            grad.addColorStop(0, `hsla(${hue1}, 80%, 60%, 0.9)`);
            grad.addColorStop(0.5, `hsla(${(hue1 + hue2) / 2}, 85%, 55%, 0.95)`);
            grad.addColorStop(1, `hsla(${hue2}, 90%, 65%, 1)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            // Rounded-top bars
            const r = Math.min(barW / 2, 3);
            ctx.moveTo(x, H);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.lineTo(x + barW - r, y);
            ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
            ctx.lineTo(x + barW, H);
            ctx.closePath();
            ctx.fill();

            // Glow effect
            ctx.shadowColor = `hsla(${hue1}, 80%, 60%, 0.35)`;
            ctx.shadowBlur = 6;
        }
        ctx.shadowBlur = 0;
    },

    /* ─────────── Utilities ─────────── */

    _fmtTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    },

    _clearInterval(state, key) {
        if (state[key]) {
            clearInterval(state[key]);
            state[key] = null;
        }
    },

    /* ─────────── Cleanup (called by Window Manager on close) ─────────── */

    destroy(winId) {
        const s = this._states[winId];
        if (!s) return;
        this._clearInterval(s, 'progressInterval');
        this._clearInterval(s, 'visualizerInterval');
        delete this._states[winId];
        this.updateMiniWidget();
    },

    _bindMiniWidget(winId) {
        if (this._miniWidgetBound) return;
        this._miniWidgetBound = true;
        
        document.getElementById('widget-music-play-btn')?.addEventListener('click', () => {
            const activeWinId = Object.keys(this._states)[0];
            if (activeWinId) {
                this._togglePlay(activeWinId);
            } else {
                VOS.WM.open('music');
            }
        });

        document.getElementById('widget-music-next-btn')?.addEventListener('click', () => {
            const activeWinId = Object.keys(this._states)[0];
            if (activeWinId) {
                this._nextTrack(activeWinId);
            }
        });
    },

    updateMiniWidget() {
        const titleEl = document.getElementById('widget-music-title');
        const artistEl = document.getElementById('widget-music-artist');
        const playBtn = document.getElementById('widget-music-play-btn');
        
        const activeWinId = Object.keys(this._states)[0];
        if (!activeWinId) {
            if (titleEl) titleEl.textContent = 'Not Playing';
            if (artistEl) artistEl.textContent = '—';
            if (playBtn) playBtn.textContent = '▶';
            return;
        }
        
        const s = this._states[activeWinId];
        const track = this._playlist[s.currentTrack];
        
        if (titleEl) titleEl.textContent = s.playing ? track.title : 'Paused';
        if (artistEl) artistEl.textContent = s.playing ? track.artist : '—';
        if (playBtn) playBtn.textContent = s.playing ? '⏸' : '▶';
    }
};
