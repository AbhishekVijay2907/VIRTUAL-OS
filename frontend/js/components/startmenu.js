/**
 * VirtualOS Start Menu Component
 * App launcher with search
 */
VOS.StartMenu = {
    _isOpen: false,

    init() {
        // Start button toggle
        const startBtn = document.getElementById('start-button');
        startBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this._isOpen && !e.target.closest('.start-menu') && !e.target.closest('#start-button')) {
                this.close();
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this._isOpen) {
                this.close();
            }
        });

        // Render apps grid
        this.renderApps();

        // Search
        const searchInput = document.getElementById('start-search');
        searchInput?.addEventListener('input', (e) => this.filterApps(e.target.value));

        // Logout
        document.getElementById('start-logout')?.addEventListener('click', () => {
            this.close();
            VOS.Auth.logout();
        });
    },

    toggle() {
        this._isOpen ? this.close() : this.open();
    },

    open() {
        const menu = document.getElementById('start-menu');
        if (menu) {
            menu.classList.add('open');
            this._isOpen = true;
            document.getElementById('start-search')?.focus();
        }
    },

    close() {
        const menu = document.getElementById('start-menu');
        if (menu) {
            menu.classList.remove('open');
            this._isOpen = false;
        }
    },

    renderApps(filter = '') {
        const grid = document.getElementById('start-apps-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const filtered = VOS.Config.APPS.filter(app =>
            app.name.toLowerCase().includes(filter.toLowerCase())
        );

        filtered.forEach(app => {
            const item = document.createElement('div');
            item.className = 'start-app-item';
            item.innerHTML = `
                <span class="start-app-icon">${app.icon}</span>
                <span class="start-app-label">${app.name}</span>
            `;
            item.addEventListener('click', () => {
                VOS.WM.open(app.id);
                this.close();
            });
            grid.appendChild(item);
        });

        if (filtered.length === 0) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted);font-size:0.85rem;">No apps found</div>';
        }
    },

    filterApps(query) {
        this.renderApps(query);
    }
};
