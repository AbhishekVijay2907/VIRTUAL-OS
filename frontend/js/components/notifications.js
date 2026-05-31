/**
 * VirtualOS Notification System
 * Toast notifications with auto-dismiss
 */
VOS.Notify = {
    _container: null,

    _getContainer() {
        if (!this._container) {
            this._container = document.getElementById('notifications-container');
        }
        // Fallback: if no container exists yet (before desktop init), create one
        if (!this._container) {
            const c = document.createElement('div');
            c.className = 'notifications-container';
            c.id = 'notifications-container';
            document.body.appendChild(c);
            this._container = c;
        }
        return this._container;
    },

    /**
     * Show a toast notification
     * @param {string} title - Notification title
     * @param {string} message - Notification body text
     * @param {string} icon - Emoji icon
     * @param {number} duration - Auto-dismiss time in ms (default 4000)
     */
    show(title, message, icon = 'ℹ️', duration = 4000) {
        const container = this._getContainer();

        // Play chime sound
        VOS.SettingsApp?.playSystemSound('chime');

        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <div class="notification-body">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <span class="notification-close">✕</span>
        `;

        container.appendChild(toast);

        // Trigger show animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Close button
        toast.querySelector('.notification-close').addEventListener('click', () => {
            this._dismiss(toast);
        });

        // Auto-dismiss
        setTimeout(() => {
            this._dismiss(toast);
        }, duration);
    },

    _dismiss(toast) {
        if (!toast || !toast.parentNode) return;
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    }
};
