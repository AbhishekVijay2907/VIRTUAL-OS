/**
 * VirtualOS Dynamic OS Theme Engine
 * Manages dynamically switching layouts and styling between:
 * - Windows 11 Mode
 * - macOS Sonoma Mode
 * - Ubuntu Linux Mode
 */
VOS.ThemeEngine = {
    currentOS: 'win11',

    init() {
        // Sync with loaded state settings
        const mode = VOS.State.settings?.osMode || 'win11';
        this.applyOS(mode);
    },

    /**
     * Hot-swap layout theme dynamically
     */
    switchOS(mode) {
        if (!['win11', 'macos', 'ubuntu'].includes(mode)) return;
        
        // Dynamic Fade-out overlay animation
        const screen = document.getElementById('desktop-screen');
        if (screen) {
            screen.style.transition = 'opacity 0.4s ease';
            screen.style.opacity = '0';
        }

        setTimeout(() => {
            this.applyOS(mode);
            
            // Fade-in workspace back
            if (screen) {
                screen.style.opacity = '1';
            }

            VOS.Notify.show('System Switcher', `Welcome to ${this.getOSName(mode)}!`, '🖥️');
        }, 400);
    },

    applyOS(mode) {
        this.currentOS = mode;
        if (!VOS.State.settings) VOS.State.settings = {};
        VOS.State.settings.osMode = mode;

        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        // Reset OS classes on body and desktop container
        desktop.classList.remove('os-win11', 'os-macos', 'os-ubuntu');
        desktop.classList.add(`os-${mode}`);

        const topbar = document.getElementById('desktop-topbar');
        const leftDock = document.getElementById('desktop-left-dock');
        const winTaskbar = document.getElementById('windows-taskbar');
        const macDock = document.getElementById('macos-floating-dock');

        // Hide all by default, show selectively
        if (topbar) topbar.style.display = 'none';
        if (leftDock) leftDock.style.display = 'none';
        if (winTaskbar) winTaskbar.style.display = 'none';
        if (macDock) macDock.style.display = 'none';

        // Auto apply matching wallpaper presets if settings aren't customized
        let defaultWallpaper = 'wallpaper1';

        switch (mode) {
            case 'win11':
                if (winTaskbar) winTaskbar.style.display = 'flex';
                defaultWallpaper = 'wallpaper1';
                break;
                
            case 'macos':
                if (topbar) topbar.style.display = 'flex';
                if (macDock) macDock.style.display = 'flex';
                defaultWallpaper = 'wallpaper2';
                this.renderMacTopbar();
                this.renderMacDock();
                break;
                
            case 'ubuntu':
                if (topbar) topbar.style.display = 'flex';
                if (leftDock) leftDock.style.display = 'flex';
                defaultWallpaper = 'wallpaper4';
                this.renderUbuntuTopbar();
                this.renderUbuntuDock();
                break;
        }

        // Apply wallpaper if user settings haven't been loaded yet or mapped
        if (!VOS.State.settings?.wallpaper) {
            VOS.SettingsApp?.applySettings({
                wallpaper: defaultWallpaper,
                theme: VOS.State.settings?.theme || 'dark',
                accentColor: VOS.State.settings?.accentColor || '#0078d7',
                osMode: mode
            });
        } else {
            // Apply current settings
            VOS.SettingsApp?.applySettings(VOS.State.settings);
        }

        // Refresh all windows control orientations & dynamic terminal styles
        document.querySelectorAll('.window').forEach(win => {
            const appId = win.dataset.appId;
            if (appId === 'terminal') {
                VOS.TerminalApp?.applyTerminalTheming(win.id);
            }
        });

        // Sync start menu apps grid & taskbars
        VOS.Taskbar.update();
    },

    getOSName(mode) {
        if (mode === 'win11') return 'Windows 11';
        if (mode === 'macos') return 'macOS Sonoma';
        if (mode === 'ubuntu') return 'Ubuntu Linux';
        return '';
    },

    /* ====================================================
       macOS DOCK & TOPBAR RENDERING
       ==================================================== */
    renderMacTopbar() {
        const left = document.getElementById('topbar-left-content');
        const center = document.getElementById('topbar-center-content');
        const right = document.getElementById('topbar-right-content');
        
        if (left) {
            left.innerHTML = `
                <span class="topbar-item topbar-logo" onclick="VOS.StartMenu.toggle()"></span>
                <span class="topbar-item" style="font-weight: 700;">Finder</span>
                <span class="topbar-item">File</span>
                <span class="topbar-item">Edit</span>
                <span class="topbar-item">View</span>
                <span class="topbar-item">Go</span>
                <span class="topbar-item">Window</span>
                <span class="topbar-item">Help</span>
            `;
        }
        if (center) center.innerHTML = '';
        if (right) {
            right.innerHTML = `
                <span class="topbar-item" onclick="VOS.ThemeEngine.triggerSpotlight()">🔍</span>
                <span class="topbar-item">📶</span>
                <span class="topbar-item">🔋 98%</span>
                <span class="topbar-item topbar-clock" id="mac-clock">10:50 AM</span>
            `;
        }
        this.updateClockElement('mac-clock');
    },

    renderMacDock() {
        const grid = document.getElementById('macos-dock-icons-grid');
        if (!grid) return;
        grid.innerHTML = '';

        VOS.Config.APPS.forEach(app => {
            const running = VOS.State.windows.some(w => w.appId === app.id);
            const item = document.createElement('div');
            item.className = `macos-dock-item${running ? ' running' : ''}`;
            item.title = app.name;
            item.textContent = app.icon;
            item.addEventListener('click', () => VOS.Taskbar.handleAppClick(app.id));
            grid.appendChild(item);
        });
    },

    /* ====================================================
       UBUNTU LAUNCHER DOCK & TOPBAR RENDERING
       ==================================================== */
    renderUbuntuTopbar() {
        const left = document.getElementById('topbar-left-content');
        const center = document.getElementById('topbar-center-content');
        const right = document.getElementById('topbar-right-content');

        if (left) {
            left.innerHTML = `
                <span class="topbar-item" style="font-weight: 700;" onclick="VOS.StartMenu.toggle()">🌀 Activities</span>
            `;
        }
        if (center) {
            center.innerHTML = `
                <span class="topbar-item topbar-clock" id="ubuntu-clock" style="font-weight: 500;">Fri 10:50 AM</span>
            `;
        }
        if (right) {
            right.innerHTML = `
                <span class="topbar-item">📶</span>
                <span class="topbar-item">🔉</span>
                <span class="topbar-item">🔋</span>
                <span class="topbar-item">⚙️</span>
            `;
        }
        this.updateClockElement('ubuntu-clock');
    },

    renderUbuntuDock() {
        const grid = document.getElementById('left-dock-icons-grid');
        if (!grid) return;
        grid.innerHTML = '';

        // Add GNOME Activities App Launcher icon at the top
        const startIcon = document.createElement('div');
        startIcon.className = 'ubuntu-dock-icon';
        startIcon.title = 'Show Applications';
        startIcon.textContent = '🌀';
        startIcon.addEventListener('click', () => VOS.StartMenu.toggle());
        grid.appendChild(startIcon);

        VOS.Config.APPS.forEach(app => {
            const running = VOS.State.windows.some(w => w.appId === app.id);
            const item = document.createElement('div');
            item.className = `ubuntu-dock-icon${running ? ' running' : ''}`;
            item.title = app.name;
            item.textContent = app.icon;
            item.addEventListener('click', () => VOS.Taskbar.handleAppClick(app.id));
            grid.appendChild(item);
        });
    },

    updateClockElement(elementId) {
        const update = () => {
            const el = document.getElementById(elementId);
            if (!el) return;
            const now = new Date();
            if (elementId === 'mac-clock') {
                el.textContent = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            } else if (elementId === 'ubuntu-clock') {
                el.textContent = now.toLocaleDateString(undefined, { weekday: 'short' }) + ' ' + now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            }
        };
        update();
        setInterval(update, 1000);
    },

    triggerSpotlight() {
        VOS.Notify.show('Spotlight', 'Spotlight Search activated! Type ⌘Space to search files.', '🔍');
    }
};
