/**
 * VirtualOS Authentication Module
 * Handles login, signup, session persistence, and logout
 */
VOS.Auth = {
    init() {
        this.startLockScreenClock();
        
        // Bind Lock Screen Click/Key to Unlock
        const lockPanel = document.getElementById('lock-screen-panel');
        lockPanel?.addEventListener('click', () => this.unlockScreen());

        // Check for existing session
        if (VOS.State.isLoggedIn()) {
            // Already logged in - showing lock screen first, direct click unlocks
            this.showLockScreenOnly();
        } else {
            // Not logged in - show full login card after lock screen click
            this.showAuthScreen();
        }
    },

    startLockScreenClock() {
        const updateLockTime = () => {
            const timeEl = document.getElementById('lock-time');
            const dateEl = document.getElementById('lock-date');
            if (!timeEl || !dateEl) return;
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
            dateEl.textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
        };
        updateLockTime();
        setInterval(updateLockTime, 1000);
    },

    showLockScreenOnly() {
        const desktop = document.getElementById('desktop');
        const authScreen = document.getElementById('auth-screen');
        const lockPanel = document.getElementById('lock-screen-panel');
        const authCard = document.getElementById('auth-card');
        
        desktop.style.display = 'none';
        authScreen.style.display = 'flex';
        if (lockPanel) {
            lockPanel.style.display = 'flex';
            lockPanel.style.transform = 'translateY(0)';
            lockPanel.style.opacity = '1';
        }
        authCard.style.display = 'none';
    },

    showAuthScreen() {
        const desktop = document.getElementById('desktop');
        const authScreen = document.getElementById('auth-screen');
        const lockPanel = document.getElementById('lock-screen-panel');
        const authCard = document.getElementById('auth-card');
        
        desktop.style.display = 'none';
        authScreen.style.display = 'flex';
        if (lockPanel) {
            lockPanel.style.display = 'flex';
            lockPanel.style.transform = 'translateY(0)';
            lockPanel.style.opacity = '1';
        }
        authCard.style.display = 'none';
        
        this.showLoginForm();
    },

    unlockScreen() {
        const lockPanel = document.getElementById('lock-screen-panel');
        const authCard = document.getElementById('auth-card');
        
        // Transition: Slide lock screen up, fade login card in
        lockPanel.style.transition = 'transform 0.5s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.5s';
        lockPanel.style.transform = 'translateY(-100%)';
        lockPanel.style.opacity = '0';
        
        setTimeout(() => {
            lockPanel.style.display = 'none';
            if (VOS.State.isLoggedIn()) {
                // If logged in, skip the login credentials card entirely
                this.enterDesktop();
            } else {
                authCard.style.display = 'block';
                authCard.style.opacity = '0';
                authCard.style.transform = 'scale(0.9)';
                authCard.style.transition = 'all 0.4s cubic-bezier(0.1, 0.9, 0.2, 1)';
                // Force layout reflow
                authCard.offsetHeight;
                authCard.style.opacity = '1';
                authCard.style.transform = 'scale(1)';
                
                // Focus username field
                document.getElementById('auth-username')?.focus();
            }
        }, 300);
    },

    showLoginForm() {
        document.getElementById('auth-title').textContent = 'Welcome Back';
        document.getElementById('auth-subtitle').textContent = 'Sign in to your VirtualOS X session';
        document.getElementById('auth-submit-btn').textContent = 'Unlock Workspace';
        document.getElementById('auth-footer-text').innerHTML = `Don't have an account? <a onclick="VOS.Auth.showSignupForm()">Register Profile</a>`;
        document.getElementById('auth-error').style.display = 'none';
        document.getElementById('auth-form').dataset.mode = 'login';
        document.getElementById('auth-username').value = '';
        document.getElementById('auth-password').value = '';
        
        const avatar = document.getElementById('auth-avatar-display');
        if (avatar) {
            avatar.textContent = 'U';
            avatar.style.background = 'linear-gradient(135deg, var(--accent-color, #0078d7), #7b2ff7)';
        }
    },

    showSignupForm() {
        document.getElementById('auth-title').textContent = 'Create Profile';
        document.getElementById('auth-subtitle').textContent = 'Set up your VirtualOS X account';
        document.getElementById('auth-submit-btn').textContent = 'Create Profile';
        document.getElementById('auth-footer-text').innerHTML = `Already have an account? <a onclick="VOS.Auth.showLoginForm()">Sign In</a>`;
        document.getElementById('auth-error').style.display = 'none';
        document.getElementById('auth-form').dataset.mode = 'signup';
        document.getElementById('auth-username').value = '';
        document.getElementById('auth-password').value = '';
        
        const avatar = document.getElementById('auth-avatar-display');
        if (avatar) {
            avatar.textContent = '➕';
            avatar.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        }
    },

    async handleSubmit(e) {
        e.preventDefault();
        const form = document.getElementById('auth-form');
        const mode = form.dataset.mode || 'login';
        const username = document.getElementById('auth-username').value.trim();
        const password = document.getElementById('auth-password').value;
        const errorEl = document.getElementById('auth-error');
        const btn = document.getElementById('auth-submit-btn');

        if (!username || !password) {
            errorEl.textContent = 'Please fill in all fields';
            errorEl.style.display = 'block';
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Please wait...';
        errorEl.style.display = 'none';

        try {
            const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
            const data = await VOS.API.post(endpoint, { username, password });

            if (data && data.token) {
                VOS.State.setAuth(data.token, data.username, data.userId);
                VOS.Notify.show('Welcome!', `Logged in as ${data.username}`, '👋');
                this.enterDesktop();
            }
        } catch (err) {
            errorEl.textContent = err.message || 'Authentication failed';
            errorEl.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = mode === 'login' ? 'Sign In' : 'Create Account';
        }
    },

    async enterDesktop() {
        const desktop = document.getElementById('desktop');
        const authScreen = document.getElementById('auth-screen');
        authScreen.style.display = 'none';
        desktop.style.display = 'flex';

        // Load settings and apply theme
        try {
            const settings = await VOS.API.get('/settings');
            VOS.State.settings = settings;
            VOS.SettingsApp?.applySettings(settings);
            // Play boot chime
            VOS.SettingsApp?.playSystemSound('boot');
        } catch (err) {
            console.warn('Could not load settings, using defaults');
        }

        // Init desktop components
        VOS.Taskbar.init();
        VOS.StartMenu.init();
        VOS.ContextMenu.init();
        VOS.Taskbar.updateClock();

        // Set username in start menu
        const usernameEl = document.getElementById('start-username');
        const avatarEl = document.getElementById('start-avatar');
        if (usernameEl) usernameEl.textContent = VOS.State.username || 'User';
        if (avatarEl) avatarEl.textContent = (VOS.State.username || 'U')[0].toUpperCase();
    },

    logout() {
        VOS.State.clearAuth();
        // Close all windows
        document.getElementById('windows-container').innerHTML = '';
        // Reset UI
        this.showAuthScreen();
        VOS.Notify.show('Signed Out', 'You have been logged out', '🔒');
    }
};
