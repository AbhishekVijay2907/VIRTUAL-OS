/**
 * VirtualOS State Manager
 * Centralized state for authentication, desktop, and app data
 */
VOS.State = {
    token: localStorage.getItem('vos_token') || null,
    userId: localStorage.getItem('vos_userId') || null,
    username: localStorage.getItem('vos_username') || null,
    settings: null,
    windows: [],       // Array of active window objects
    nextZIndex: 100,   // Counter for z-index stacking
    activeWindowId: null,

    isLoggedIn() {
        return !!this.token;
    },

    setAuth(token, username, userId) {
        this.token = token;
        this.username = username;
        this.userId = userId;
        localStorage.setItem('vos_token', token);
        localStorage.setItem('vos_username', username);
        localStorage.setItem('vos_userId', userId);
    },

    clearAuth() {
        this.token = null;
        this.username = null;
        this.userId = null;
        this.settings = null;
        this.windows = [];
        this.nextZIndex = 100;
        this.activeWindowId = null;
        localStorage.removeItem('vos_token');
        localStorage.removeItem('vos_username');
        localStorage.removeItem('vos_userId');
    },

    getNextZIndex() {
        return ++this.nextZIndex;
    }
};
