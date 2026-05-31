/**
 * VirtualOS Context Menu Component
 * Desktop right-click menu and custom context menus for items
 */
VOS.ContextMenu = {
    _el: null,

    init() {
        this._el = document.getElementById('context-menu');

        // Desktop right-click
        const desktopScreen = document.getElementById('desktop-screen');
        desktopScreen?.addEventListener('contextmenu', (e) => {
            // Only show if right-clicked on the desktop itself, not on a window
            if (e.target.closest('.window') || e.target.closest('.taskbar') || e.target.closest('.start-menu')) return;
            e.preventDefault();
            this.showDesktopMenu(e.clientX, e.clientY);
        });

        // Close on any click
        document.addEventListener('click', () => this.hide());
        document.addEventListener('contextmenu', () => this.hide());
    },

    showDesktopMenu(x, y) {
        const actions = [
            { label: '📝 New Note', action: () => VOS.WM.open('notes') },
            { label: '🧮 Calculator', action: () => VOS.WM.open('calculator') },
            { label: '📁 File Manager', action: () => VOS.WM.open('filemanager') },
            { label: '💻 Terminal', action: () => VOS.WM.open('terminal') },
            { divider: true },
            { label: '⚙️ Settings', action: () => VOS.WM.open('settings') },
            { divider: true },
            { label: '🔄 Refresh Desktop', action: () => location.reload() }
        ];
        this._render(x, y, actions);
    },

    /**
     * Show a custom context menu at position (x, y) with custom actions
     * Used by File Manager and other apps
     */
    showCustom(x, y, actions) {
        this._render(x, y, actions);
    },

    _render(x, y, actions) {
        if (!this._el) return;
        this._el.innerHTML = '';

        actions.forEach(item => {
            if (item.divider) {
                const div = document.createElement('div');
                div.className = 'context-menu-divider';
                this._el.appendChild(div);
            } else {
                const el = document.createElement('div');
                el.className = 'context-menu-item';
                el.textContent = item.label;
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.hide();
                    item.action?.();
                });
                this._el.appendChild(el);
            }
        });

        // Position with bounds checking
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const menuWidth = 170;
        const menuHeight = actions.length * 34;

        let posX = x;
        let posY = y;
        if (x + menuWidth > vw) posX = vw - menuWidth - 10;
        if (y + menuHeight > vh) posY = vh - menuHeight - 10;

        this._el.style.left = `${posX}px`;
        this._el.style.top = `${posY}px`;
        this._el.classList.add('open');
    },

    hide() {
        this._el?.classList.remove('open');
    }
};
