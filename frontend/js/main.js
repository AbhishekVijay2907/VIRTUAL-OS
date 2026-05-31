/**
 * VirtualOS Main Entry Point
 * Initializes the desktop environment and binds global events
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize auth flow (checks for existing session)
    VOS.Auth.init();

    // Bind auth form submission
    const authForm = document.getElementById('auth-form');
    authForm?.addEventListener('submit', (e) => VOS.Auth.handleSubmit(e));

    // Desktop icon double-click to open apps
    document.getElementById('desktop-icons')?.addEventListener('dblclick', (e) => {
        const icon = e.target.closest('.desktop-icon');
        if (icon) {
            VOS.WM.open(icon.dataset.app);
        }
    });

    // Desktop icon single-click selection
    document.getElementById('desktop-icons')?.addEventListener('click', (e) => {
        const icon = e.target.closest('.desktop-icon');
        // Deselect all
        document.querySelectorAll('.desktop-icon.selected').forEach(i => i.classList.remove('selected'));
        if (icon) {
            icon.classList.add('selected');
        }
    });

    // Click on desktop to deselect icons and close start menu
    document.getElementById('desktop-screen')?.addEventListener('click', (e) => {
        if (e.target.id === 'desktop-screen' || e.target.closest('.desktop-icons-grid')) {
            if (!e.target.closest('.desktop-icon')) {
                document.querySelectorAll('.desktop-icon.selected').forEach(i => i.classList.remove('selected'));
            }
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+N = New note
        if (e.ctrlKey && e.key === 'n' && VOS.State.isLoggedIn()) {
            e.preventDefault();
            VOS.WM.open('notes');
        }
        // Ctrl+Shift+T = Terminal
        if (e.ctrlKey && e.shiftKey && e.key === 'T' && VOS.State.isLoggedIn()) {
            e.preventDefault();
            VOS.WM.open('terminal');
        }
        // Ctrl+E = File Manager
        if (e.ctrlKey && e.key === 'e' && VOS.State.isLoggedIn()) {
            e.preventDefault();
            VOS.WM.open('filemanager');
        }
    });
});
