/**
 * VirtualOS Configuration
 * Central configuration for API endpoints and app registry
 */
window.VOS = window.VOS || {};

VOS.Config = {
    API_BASE: 'http://localhost:8080/api',
    
    // Wallpaper presets
    WALLPAPERS: {
        wallpaper1: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop')",
        wallpaper2: "url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1920&auto=format&fit=crop')",
        wallpaper3: "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1920&auto=format&fit=crop')",
        wallpaper4: "url('https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=1920&auto=format&fit=crop')",
        wallpaper5: "url('https://images.unsplash.com/photo-1614850715649-1d0106568571?q=80&w=1920&auto=format&fit=crop')",
        wallpaper6: "url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1920&auto=format&fit=crop')"
    },

    // Accent color presets
    ACCENT_COLORS: [
        { name: 'Blue', value: '#0078d7', rgb: '0, 120, 215' },
        { name: 'Purple', value: '#7b2ff7', rgb: '123, 47, 247' },
        { name: 'Teal', value: '#00b4d8', rgb: '0, 180, 216' },
        { name: 'Green', value: '#00c853', rgb: '0, 200, 83' },
        { name: 'Orange', value: '#ff6d00', rgb: '255, 109, 0' },
        { name: 'Pink', value: '#e91e63', rgb: '233, 30, 99' },
        { name: 'Red', value: '#f44336', rgb: '244, 67, 54' },
        { name: 'Gold', value: '#ffc107', rgb: '255, 193, 7' }
    ],

    // App definitions
    APPS: [
        { id: 'notes', name: 'Notes', icon: '📝', defaultWidth: 700, defaultHeight: 480 },
        { id: 'calculator', name: 'Calculator', icon: '🧮', defaultWidth: 320, defaultHeight: 480 },
        { id: 'filemanager', name: 'Files', icon: '📁', defaultWidth: 700, defaultHeight: 500 },
        { id: 'terminal', name: 'Terminal', icon: '💻', defaultWidth: 650, defaultHeight: 420 },
        { id: 'settings', name: 'Settings', icon: '⚙️', defaultWidth: 520, defaultHeight: 560 },
        { id: 'sysmonitor', name: 'System Monitor', icon: '📊', defaultWidth: 720, defaultHeight: 560 },
        { id: 'music', name: 'Music Player', icon: '🎵', defaultWidth: 720, defaultHeight: 460 }
    ]
};

// Helper: Make authenticated fetch requests
VOS.API = {
    async request(endpoint, options = {}) {
        const token = VOS.State?.token;
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {})
        };
        
        try {
            const response = await fetch(`${VOS.Config.API_BASE}${endpoint}`, {
                ...options,
                headers
            });
            
            if (response.status === 401) {
                VOS.Auth?.logout();
                return null;
            }
            
            if (response.status === 204) return null;
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }
            return data;
        } catch (err) {
            console.error(`API Error [${endpoint}]:`, err);
            throw err;
        }
    },
    get(endpoint) { return this.request(endpoint); },
    post(endpoint, body) { return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) }); },
    put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }); },
    delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
};
