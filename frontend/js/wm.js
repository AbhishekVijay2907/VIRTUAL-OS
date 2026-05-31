/**
 * VirtualOS Window Manager
 * Handles opening, closing, dragging, resizing, minimizing, maximizing windows
 */
VOS.WM = {
    /**
     * Open an application window
     * @param {string} appId - The app identifier (e.g., 'notes', 'calculator')
     */
    open(appId) {
        const appDef = VOS.Config.APPS.find(a => a.id === appId);
        if (!appDef) return;

        // Generate a unique window ID
        const winId = `win-${appId}-${Date.now()}`;
        const zIndex = VOS.State.getNextZIndex();

        // Calculate centered position with a slight random offset
        const screen = document.getElementById('desktop-screen');
        const sW = screen.offsetWidth;
        const sH = screen.offsetHeight;
        const wW = Math.min(appDef.defaultWidth, sW - 40);
        const wH = Math.min(appDef.defaultHeight, sH - 40);
        const offsetX = Math.floor(Math.random() * 40) - 20;
        const offsetY = Math.floor(Math.random() * 40) - 20;
        const left = Math.max(10, (sW - wW) / 2 + offsetX);
        const top = Math.max(10, (sH - wH) / 2 + offsetY);

        // Create window DOM
        const win = document.createElement('div');
        win.className = 'window active';
        win.id = winId;
        win.style.cssText = `left:${left}px;top:${top}px;width:${wW}px;height:${wH}px;z-index:${zIndex};`;
        win.dataset.appId = appId;

        win.innerHTML = `
            <div class="window-titlebar" data-win="${winId}">
                <span class="window-title-icon">${appDef.icon}</span>
                <span class="window-title-text">${appDef.name}</span>
                <div class="window-controls">
                    <button class="window-ctrl-btn window-ctrl-minimize" data-action="minimize" data-win="${winId}" title="Minimize">—</button>
                    <button class="window-ctrl-btn window-ctrl-maximize" data-action="maximize" data-win="${winId}" title="Maximize">☐</button>
                    <button class="window-ctrl-btn window-ctrl-close" data-action="close" data-win="${winId}" title="Close">✕</button>
                </div>
            </div>
            <div class="window-content" id="${winId}-content"></div>
            <div class="window-resize-handle" data-win="${winId}"></div>
        `;

        document.getElementById('windows-container').appendChild(win);

        // Store window state
        const winState = {
            id: winId,
            appId,
            minimized: false,
            maximized: false,
            prevBounds: null // Stores bounds before maximize
        };
        VOS.State.windows.push(winState);

        // Focus this window
        this.focus(winId);

        // Bind events
        this._bindDrag(win);
        this._bindResize(win);
        this._bindControls(win);

        // Click to focus
        win.addEventListener('mousedown', () => this.focus(winId));

        // Init the app content
        this._initApp(appId, winId);

        // Update taskbar
        VOS.Taskbar.update();

        return winId;
    },

    /**
     * Focus a window (bring to top)
     */
    focus(winId) {
        // Deactivate all windows
        document.querySelectorAll('.window.active').forEach(w => w.classList.remove('active'));
        const win = document.getElementById(winId);
        if (win) {
            win.classList.add('active');
            win.style.zIndex = VOS.State.getNextZIndex();
        }
        VOS.State.activeWindowId = winId;
        VOS.Taskbar.update();
    },

    /**
     * Close a window
     */
    close(winId) {
        const winState = VOS.State.windows.find(w => w.id === winId);
        if (winState) {
            const appName = winState.appId.charAt(0).toUpperCase() + winState.appId.slice(1) + 'App';
            const app = VOS[appName];
            if (app && typeof app.destroy === 'function') {
                try {
                    app.destroy(winId);
                } catch (err) {
                    console.error(`Error destroying app ${winState.appId}:`, err);
                }
            }
        }

        const win = document.getElementById(winId);
        if (win) {
            win.style.transform = 'scale(0.9)';
            win.style.opacity = '0';
            win.style.transition = 'transform 0.2s ease, opacity 0.15s ease';
            setTimeout(() => win.remove(), 200);
        }
        VOS.State.windows = VOS.State.windows.filter(w => w.id !== winId);
        if (VOS.State.activeWindowId === winId) {
            VOS.State.activeWindowId = null;
        }
        VOS.Taskbar.update();
    },

    /**
     * Minimize a window
     */
    minimize(winId) {
        const win = document.getElementById(winId);
        const winState = VOS.State.windows.find(w => w.id === winId);
        if (win && winState) {
            win.classList.add('minimized');
            win.classList.remove('active');
            winState.minimized = true;
            VOS.State.activeWindowId = null;
            VOS.Taskbar.update();
        }
    },

    /**
     * Restore a minimized window
     */
    restore(winId) {
        const win = document.getElementById(winId);
        const winState = VOS.State.windows.find(w => w.id === winId);
        if (win && winState) {
            win.classList.remove('minimized');
            winState.minimized = false;
            this.focus(winId);
        }
    },

    /**
     * Toggle maximize/restore
     */
    toggleMaximize(winId) {
        const win = document.getElementById(winId);
        const winState = VOS.State.windows.find(w => w.id === winId);
        if (!win || !winState) return;

        if (winState.maximized) {
            // Restore
            win.classList.remove('maximized');
            if (winState.prevBounds) {
                win.style.left = winState.prevBounds.left;
                win.style.top = winState.prevBounds.top;
                win.style.width = winState.prevBounds.width;
                win.style.height = winState.prevBounds.height;
            }
            winState.maximized = false;
        } else {
            // Save current bounds
            winState.prevBounds = {
                left: win.style.left,
                top: win.style.top,
                width: win.style.width,
                height: win.style.height
            };
            win.classList.add('maximized');
            winState.maximized = true;
        }
        this.focus(winId);
    },

    /**
     * Bind drag behavior to titlebar
     */
    _bindDrag(win) {
        const titlebar = win.querySelector('.window-titlebar');
        let isDragging = false;
        let startX, startY, origLeft, origTop;

        titlebar.addEventListener('mousedown', (e) => {
            // Don't drag if clicking controls
            if (e.target.closest('.window-controls')) return;
            const winState = VOS.State.windows.find(w => w.id === win.id);
            if (winState?.maximized) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            origLeft = win.offsetLeft;
            origTop = win.offsetTop;
            win.style.transition = 'none';
            document.body.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            win.style.left = `${origLeft + dx}px`;
            win.style.top = `${Math.max(0, origTop + dy)}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                win.style.transition = '';
                document.body.style.cursor = '';
            }
        });
    },

    /**
     * Bind resize behavior to resize handle
     */
    _bindResize(win) {
        const handle = win.querySelector('.window-resize-handle');
        let isResizing = false;
        let startX, startY, origW, origH;

        handle.addEventListener('mousedown', (e) => {
            const winState = VOS.State.windows.find(w => w.id === win.id);
            if (winState?.maximized) return;

            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            origW = win.offsetWidth;
            origH = win.offsetHeight;
            win.style.transition = 'none';
            document.body.style.cursor = 'se-resize';
            e.stopPropagation();
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            win.style.width = `${Math.max(320, origW + dx)}px`;
            win.style.height = `${Math.max(240, origH + dy)}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                win.style.transition = '';
                document.body.style.cursor = '';
            }
        });
    },

    /**
     * Bind window control buttons (minimize, maximize, close)
     */
    _bindControls(win) {
        win.querySelectorAll('.window-ctrl-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const winId = btn.dataset.win;
                if (action === 'close') this.close(winId);
                else if (action === 'minimize') this.minimize(winId);
                else if (action === 'maximize') this.toggleMaximize(winId);
            });
        });

        // Double-click titlebar to toggle maximize
        const titlebar = win.querySelector('.window-titlebar');
        titlebar.addEventListener('dblclick', (e) => {
            if (e.target.closest('.window-controls')) return;
            this.toggleMaximize(win.id);
        });
    },

    /**
     * Initialize app content inside a window
     */
    _initApp(appId, winId) {
        const container = document.getElementById(`${winId}-content`);
        if (!container) return;

        switch (appId) {
            case 'notes':       VOS.NotesApp.init(winId, container); break;
            case 'calculator':  VOS.CalculatorApp.init(winId, container); break;
            case 'filemanager': VOS.FileManagerApp.init(winId, container); break;
            case 'terminal':    VOS.TerminalApp.init(winId, container); break;
            case 'settings':    VOS.SettingsApp.init(winId, container); break;
            case 'sysmonitor':  VOS.SysMonitorApp.init(winId, container); break;
        }
    },

    /**
     * Get all windows for a specific app
     */
    getWindowsByApp(appId) {
        return VOS.State.windows.filter(w => w.appId === appId);
    }
};
