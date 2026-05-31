/**
 * VirtualOS Settings Application
 * Change wallpaper, toggle theme, customize accent color, switch OS mode, animations, and sound settings
 */
VOS.SettingsApp = {
    init(winId, container) {
        const currentSettings = VOS.State.settings || { 
            wallpaper: 'wallpaper1', 
            theme: 'dark', 
            accentColor: '#0078d7', 
            osMode: 'win11',
            animationsEnabled: true,
            soundsEnabled: true
        };
        const currentOS = VOS.ThemeEngine?.currentOS || currentSettings.osMode || 'win11';

        // OS Mode cards data
        const osModes = [
            { id: 'win11', name: 'Windows 11', icon: '🪟', desc: 'Modern fluent design with centered taskbar', color: '#0078d7' },
            { id: 'macos', name: 'macOS Sonoma', icon: '🍎', desc: 'Elegant menu bar and floating dock', color: '#a855f7' },
            { id: 'ubuntu', name: 'Ubuntu Linux', icon: '🐧', desc: 'GNOME desktop with side launcher', color: '#e95420' }
        ];

        let osModeHtml = '';
        osModes.forEach(os => {
            const sel = currentOS === os.id ? 'selected' : '';
            osModeHtml += `
                <div class="os-mode-card ${sel}" data-os="${os.id}" style="--card-accent:${os.color}">
                    <div class="os-mode-icon">${os.icon}</div>
                    <div class="os-mode-info">
                        <div class="os-mode-name">${os.name}</div>
                        <div class="os-mode-desc">${os.desc}</div>
                    </div>
                    <div class="os-mode-check">${sel ? '✓' : ''}</div>
                </div>`;
        });

        // Generate wallpaper options
        let wallpaperHtml = '';
        Object.entries(VOS.Config.WALLPAPERS).forEach(([key, url]) => {
            const selected = currentSettings.wallpaper === key ? 'selected' : '';
            const bgUrl = url.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
            wallpaperHtml += `<div class="wallpaper-option ${selected}" data-wallpaper="${key}" style="background-image: url('${bgUrl}')"></div>`;
        });

        // Generate accent color swatches
        let accentHtml = '';
        VOS.Config.ACCENT_COLORS.forEach(c => {
            const selected = currentSettings.accentColor === c.value ? 'selected' : '';
            accentHtml += `<div class="accent-swatch ${selected}" data-color="${c.value}" data-rgb="${c.rgb}" style="background:${c.value}" title="${c.name}"></div>`;
        });

        container.innerHTML = `
            <div class="settings-app">
                <div class="settings-section">
                    <div class="settings-section-title">🖥️ Operating System</div>
                    <div class="os-mode-grid" id="${winId}-os-mode-grid">
                        ${osModeHtml}
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section-title">🎨 Appearance</div>
                    <div class="settings-item">
                        <div class="settings-item-label">
                            <strong>Dark Mode</strong>
                            <span>Toggle between dark and light themes</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="${winId}-theme-toggle" ${currentSettings.theme === 'dark' ? 'checked' : ''} />
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-label">
                            <strong>Window Animations</strong>
                            <span>Enable desktop transition effects</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="${winId}-animations-toggle" ${currentSettings.animationsEnabled !== false ? 'checked' : ''} />
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <div class="settings-item-label">
                            <strong>Sound Effects</strong>
                            <span>Enable boot audio and chime alerts</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="${winId}-sounds-toggle" ${currentSettings.soundsEnabled !== false ? 'checked' : ''} />
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section-title">🖼️ Wallpaper</div>
                    <div class="wallpaper-grid" id="${winId}-wallpaper-grid">
                        ${wallpaperHtml}
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section-title">💎 Accent Color</div>
                    <div class="accent-swatches" id="${winId}-accent-swatches">
                        ${accentHtml}
                    </div>
                </div>

                <div class="settings-save-btn">
                    <button id="${winId}-settings-save">💾 Save Settings</button>
                </div>
            </div>
        `;

        // Local state for pending changes
        const pending = { ...currentSettings, osMode: currentOS };

        // OS mode selection
        document.getElementById(`${winId}-os-mode-grid`).addEventListener('click', (e) => {
            const card = e.target.closest('.os-mode-card');
            if (!card) return;
            const mode = card.dataset.os;
            document.querySelectorAll(`#${winId}-os-mode-grid .os-mode-card`).forEach(c => {
                c.classList.remove('selected');
                c.querySelector('.os-mode-check').textContent = '';
            });
            card.classList.add('selected');
            card.querySelector('.os-mode-check').textContent = '✓';
            pending.osMode = mode;
            // Instantly switch OS
            VOS.ThemeEngine.switchOS(mode);
        });

        // Theme toggle
        document.getElementById(`${winId}-theme-toggle`).addEventListener('change', (e) => {
            pending.theme = e.target.checked ? 'dark' : 'light';
            this._previewTheme(pending.theme);
        });

        // Animations toggle
        document.getElementById(`${winId}-animations-toggle`).addEventListener('change', (e) => {
            pending.animationsEnabled = e.target.checked;
            this._previewAnimations(pending.animationsEnabled);
        });

        // Sounds toggle
        document.getElementById(`${winId}-sounds-toggle`).addEventListener('change', (e) => {
            pending.soundsEnabled = e.target.checked;
            if (pending.soundsEnabled) {
                // Play quick confirmation chime
                this.playSystemSound('chime');
            }
        });

        // Wallpaper selection
        document.getElementById(`${winId}-wallpaper-grid`).addEventListener('click', (e) => {
            const opt = e.target.closest('.wallpaper-option');
            if (!opt) return;
            document.querySelectorAll(`#${winId}-wallpaper-grid .wallpaper-option`).forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            pending.wallpaper = opt.dataset.wallpaper;
            this._previewWallpaper(pending.wallpaper);
        });

        // Accent color selection
        document.getElementById(`${winId}-accent-swatches`).addEventListener('click', (e) => {
            const swatch = e.target.closest('.accent-swatch');
            if (!swatch) return;
            document.querySelectorAll(`#${winId}-accent-swatches .accent-swatch`).forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            pending.accentColor = swatch.dataset.color;
            this._previewAccentColor(swatch.dataset.color, swatch.dataset.rgb);
        });

        // Save button
        document.getElementById(`${winId}-settings-save`).addEventListener('click', async () => {
            try {
                const saved = await VOS.API.put('/settings', pending);
                VOS.State.settings = saved;
                VOS.Notify.show('Settings', 'Preferences saved!', '⚙️');
            } catch (err) {
                VOS.Notify.show('Error', 'Could not save settings', '❌');
            }
        });
    },

    /**
     * Apply saved settings to the desktop (called on login)
     */
    applySettings(settings) {
        if (!settings) return;
        this._previewTheme(settings.theme);
        this._previewWallpaper(settings.wallpaper);
        const accent = VOS.Config.ACCENT_COLORS.find(c => c.value === settings.accentColor);
        if (accent) {
            this._previewAccentColor(accent.value, accent.rgb);
        } else {
            this._previewAccentColor(settings.accentColor, '0, 120, 215');
        }
        if (settings.animationsEnabled !== undefined) {
            this._previewAnimations(settings.animationsEnabled);
        }
    },

    _previewTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    },

    _previewWallpaper(key) {
        const url = VOS.Config.WALLPAPERS[key];
        if (url) {
            document.documentElement.style.setProperty('--desktop-bg-url', url);
        }
    },

    _previewAccentColor(hex, rgb) {
        document.documentElement.style.setProperty('--accent-color', hex);
        if (rgb) {
            document.documentElement.style.setProperty('--accent-color-rgb', rgb);
        }
        const hoverHex = this._darkenHex(hex, 20);
        document.documentElement.style.setProperty('--accent-color-hover', hoverHex);
    },

    _previewAnimations(enabled) {
        const desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.classList.toggle('animations-disabled', !enabled);
        }
    },

    _darkenHex(hex, amount) {
        let color = hex.replace('#', '');
        let r = Math.max(0, parseInt(color.substr(0, 2), 16) - amount);
        let g = Math.max(0, parseInt(color.substr(2, 2), 16) - amount);
        let b = Math.max(0, parseInt(color.substr(4, 2), 16) - amount);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    },

    /**
     * Synthesizes audio using HTML5 Web Audio API, so it is 100% offline-ready and asset-less.
     */
    playSystemSound(type) {
        // Double check configuration settings
        if (VOS.State.settings && VOS.State.settings.soundsEnabled === false) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();

            if (type === 'chime') {
                // Gentle arpeggio notification chime: C5 -> E5 -> G5
                const now = ctx.currentTime;
                const playNote = (freq, start, duration) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, start);
                    gain.gain.setValueAtTime(0.1, start);
                    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(start);
                    osc.stop(start + duration);
                };
                playNote(523.25, now, 0.4);       // C5
                playNote(659.25, now + 0.1, 0.4); // E5
                playNote(783.99, now + 0.2, 0.5); // G5
            } else if (type === 'boot') {
                // Futuristic cinematic boot chime (deep C major sweep chord)
                const now = ctx.currentTime;
                const freqs = [130.81, 196.00, 261.63, 329.63, 392.00, 523.25]; // C3, G3, C4, E4, G4, C5
                freqs.forEach((f, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = i % 2 === 0 ? 'sine' : 'triangle';
                    osc.frequency.setValueAtTime(f, now);
                    osc.frequency.exponentialRampToValueAtTime(f * 1.004, now + 1.8);
                    
                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(0.04, now + 0.4);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 1.8);
                });
            } else if (type === 'click') {
                // Keyboard keyclick
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1000, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);
                
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.04);
            }
        } catch (err) {
            console.warn('System audio playback failed:', err);
        }
    }
};
