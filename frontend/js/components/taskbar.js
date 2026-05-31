/**
 * VirtualOS Taskbar Component
 * Running apps, system tray, clock
 */
VOS.Taskbar = {
    _clockInterval: null,

    init() {
        this.update();
        // Start clock
        if (this._clockInterval) clearInterval(this._clockInterval);
        this._clockInterval = setInterval(() => this.updateClock(), 1000);
    },

    /**
     * Update taskbar app icons to reflect running windows
     */
    update() {
        const center = document.getElementById('taskbar-center');
        if (!center) return;
        center.innerHTML = '';

        // Show pinned app icons
        VOS.Config.APPS.forEach(app => {
            const running = VOS.State.windows.some(w => w.appId === app.id);
            const isActive = VOS.State.windows.some(w => w.appId === app.id && w.id === VOS.State.activeWindowId && !w.minimized);

            const icon = document.createElement('div');
            icon.className = `taskbar-app-icon${running ? ' running' : ''}${isActive ? ' active' : ''}`;
            icon.title = app.name;
            icon.textContent = app.icon;
            icon.addEventListener('click', () => this.handleAppClick(app.id));
            center.appendChild(icon);
        });
    },

    /**
     * Handle click on a taskbar app icon
     * - If no windows: open new window
     * - If window is minimized: restore it
     * - If window is active: minimize it
     * - If window exists but not active: focus it
     */
    handleAppClick(appId) {
        const windows = VOS.WM.getWindowsByApp(appId);
        if (windows.length === 0) {
            VOS.WM.open(appId);
        } else {
            const win = windows[0];
            if (win.minimized) {
                VOS.WM.restore(win.id);
            } else if (win.id === VOS.State.activeWindowId) {
                VOS.WM.minimize(win.id);
            } else {
                VOS.WM.focus(win.id);
            }
        }
    },

    /**
     * Update the system clock display
     */
    updateClock() {
        const clockEl = document.getElementById('system-clock');
        if (!clockEl) return;
        const now = new Date();
        const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        clockEl.innerHTML = `<div>${time}</div><div style="font-size:0.72rem;opacity:0.7">${date}</div>`;
    }
};
