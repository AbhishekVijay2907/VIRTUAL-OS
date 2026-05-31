/**
 * VirtualOS Terminal Application
 * Simulated shell with command history, OS-aware prompt theming
 */
VOS.TerminalApp = {
    _states: {},

    init(winId, container) {
        this._states[winId] = {
            history: [],
            historyIndex: -1,
            cwd: '~'
        };

        const osInfo = this._getOSInfo();

        container.innerHTML = `
            <div class="terminal-app" id="${winId}-terminal-root">
                <div class="terminal-output" id="${winId}-term-output">
                    <span class="terminal-line accent">${osInfo.banner[0]}</span>
                    <span class="terminal-line accent">${osInfo.banner[1]}</span>
                    <span class="terminal-line accent">${osInfo.banner[2]}</span>
                    <span class="terminal-line accent">${osInfo.banner[3]}</span>
                    <span class="terminal-line"></span>
                </div>
                <div class="terminal-input-row">
                    <span class="terminal-prompt" id="${winId}-term-prompt">${osInfo.prompt}</span>
                    <input class="terminal-input" id="${winId}-term-input" autocomplete="off" spellcheck="false" autofocus />
                </div>
            </div>
        `;

        const input = document.getElementById(`${winId}-term-input`);
        const output = document.getElementById(`${winId}-term-output`);

        input.addEventListener('keydown', (e) => {
            const state = this._states[winId];
            if (e.key === 'Enter') {
                const cmd = input.value.trim();
                if (cmd) {
                    state.history.push(cmd);
                    state.historyIndex = state.history.length;
                    this._execute(winId, cmd, output);
                }
                input.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (state.historyIndex > 0) {
                    state.historyIndex--;
                    input.value = state.history[state.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (state.historyIndex < state.history.length - 1) {
                    state.historyIndex++;
                    input.value = state.history[state.historyIndex];
                } else {
                    state.historyIndex = state.history.length;
                    input.value = '';
                }
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this._autocomplete(winId, input);
            }
        });

        container.addEventListener('click', () => input.focus());
    },

    /**
     * Get OS-specific terminal info
     */
    _getOSInfo() {
        const os = VOS.ThemeEngine?.currentOS || 'win11';
        const user = VOS.State.username || 'user';

        const configs = {
            win11: {
                prompt: `PS C:\\Users\\${user}>`,
                shell: 'PowerShell 7.4',
                osName: 'Windows 11 Pro',
                uname: 'VirtualOS 11.0.22621 (Windows_NT) AMD64',
                banner: [
                    '╔══════════════════════════════════════╗',
                    '║   Windows PowerShell 7.4             ║',
                    '║   VirtualOS X — Type \'help\'           ║',
                    '╚══════════════════════════════════════╝'
                ],
                terminalBg: 'rgba(12, 12, 30, 0.92)',
                textColor: '#cccccc'
            },
            macos: {
                prompt: `${user}@macbook ~ %`,
                shell: 'zsh 5.9',
                osName: 'macOS Sonoma 14.5',
                uname: 'Darwin macbook.local 23.5.0 VirtualOS RELEASE_X86_64',
                banner: [
                    '╭──────────────────────────────────────╮',
                    '│   macOS Terminal — zsh 5.9            │',
                    '│   VirtualOS X — Type \'help\'           │',
                    '╰──────────────────────────────────────╯'
                ],
                terminalBg: 'rgba(30, 30, 30, 0.92)',
                textColor: '#f0f0f0'
            },
            ubuntu: {
                prompt: `${user}@virtualos:~$`,
                shell: 'bash 5.2.15',
                osName: 'Ubuntu 24.04 LTS',
                uname: 'Linux virtualos 6.5.0-generic #1 SMP VirtualOS x86_64 GNU/Linux',
                banner: [
                    '┌──────────────────────────────────────┐',
                    '│   GNU/Linux Terminal — bash 5.2       │',
                    '│   VirtualOS X — Type \'help\'           │',
                    '└──────────────────────────────────────┘'
                ],
                terminalBg: 'rgba(48, 10, 36, 0.92)',
                textColor: '#a8ff78'
            }
        };

        return configs[os] || configs.win11;
    },

    /**
     * Called by ThemeEngine when OS changes to restyle open terminals
     */
    applyTerminalTheming(winId) {
        const osInfo = this._getOSInfo();
        const promptEl = document.getElementById(`${winId}-term-prompt`);
        const termRoot = document.getElementById(`${winId}-terminal-root`);
        if (promptEl) promptEl.textContent = osInfo.prompt;
        if (termRoot) {
            termRoot.style.background = osInfo.terminalBg;
        }
    },

    _execute(winId, cmdStr, output) {
        const parts = cmdStr.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        const osInfo = this._getOSInfo();

        // Echo command with OS-specific prompt
        this._print(output, `${osInfo.prompt} ${cmdStr}`, 'cmd');

        switch (cmd) {
            case 'help':
                this._print(output, 'Available commands:', 'accent');
                this._print(output, '  help        Show this help message');
                this._print(output, '  clear       Clear the terminal');
                this._print(output, '  date        Show current date and time');
                this._print(output, '  ls          List files in current directory');
                this._print(output, '  mkdir       Create a directory (usage: mkdir <name>)');
                this._print(output, '  echo        Print text (usage: echo <text>)');
                this._print(output, '  whoami      Show current user');
                this._print(output, '  uname       Show system info');
                this._print(output, '  neofetch    Show system summary');
                this._print(output, '  history     Show command history');
                this._print(output, '  cat         Show file contents (simulated)');
                this._print(output, '  pwd         Print working directory');
                this._print(output, '  hostname    Show hostname');
                this._print(output, '  uptime      Show system uptime');
                break;

            case 'clear':
                output.innerHTML = '';
                return;

            case 'date':
                this._print(output, new Date().toString(), 'info');
                break;

            case 'ls':
                this._ls(winId, output);
                return;

            case 'mkdir':
                if (args.length === 0) {
                    this._print(output, 'Usage: mkdir <directory_name>', 'error');
                } else {
                    this._mkdir(winId, args[0], output);
                    return;
                }
                break;

            case 'echo':
                this._print(output, args.join(' '), 'info');
                break;

            case 'whoami':
                this._print(output, VOS.State.username || 'unknown_user', 'info');
                break;

            case 'uname':
                this._print(output, osInfo.uname, 'info');
                break;

            case 'pwd':
                const os = VOS.ThemeEngine?.currentOS || 'win11';
                if (os === 'win11') {
                    this._print(output, `C:\\Users\\${VOS.State.username || 'user'}`, 'info');
                } else {
                    this._print(output, `/home/${VOS.State.username || 'user'}`, 'info');
                }
                break;

            case 'hostname':
                this._print(output, 'virtualos.local', 'info');
                break;

            case 'uptime':
                const uptimeSeconds = Math.floor(performance.now() / 1000);
                const hrs = Math.floor(uptimeSeconds / 3600);
                const mins = Math.floor((uptimeSeconds % 3600) / 60);
                const secs = uptimeSeconds % 60;
                this._print(output, `up ${hrs}h ${mins}m ${secs}s`, 'info');
                break;

            case 'cat':
                if (args.length === 0) {
                    this._print(output, 'Usage: cat <filename>', 'error');
                } else {
                    this._print(output, `cat: ${args[0]}: No such file or directory`, 'error');
                }
                break;

            case 'neofetch':
                this._neofetch(output, osInfo);
                break;

            case 'history':
                const hist = this._states[winId].history;
                hist.forEach((h, i) => this._print(output, `  ${i + 1}  ${h}`));
                break;

            default:
                this._print(output, `${osInfo.shell.split(' ')[0]}: command not found: ${cmd}`, 'error');
                this._print(output, `Type 'help' for available commands.`);
        }

        this._print(output, '');
        output.scrollTop = output.scrollHeight;
    },

    _neofetch(output, osInfo) {
        const os = VOS.ThemeEngine?.currentOS || 'win11';
        const logos = {
            win11: [
                '  ┌────────┐ ┌────────┐',
                '  │        │ │        │',
                '  │  Win   │ │  11    │',
                '  └────────┘ └────────┘',
                '  ┌────────┐ ┌────────┐',
                '  │        │ │        │',
                '  └────────┘ └────────┘'
            ],
            macos: [
                '         🍎',
                '        .oOOo.',
                '       oO    Oo',
                '      oO  mac Oo',
                '       oO    Oo',
                '        \'oOOo\'',
                ''
            ],
            ubuntu: [
                '         _',
                '     ---(_)',
                ' _/  ---  \\',
                '(_) |   |',
                ' \\  --- _/',
                '     ---(_)',
                ''
            ]
        };

        const logo = logos[os] || logos.win11;
        logo.forEach(line => this._print(output, line, 'accent'));
        this._print(output, '');
        this._print(output, `   OS: ${osInfo.osName}`, 'info');
        this._print(output, `   User: ${VOS.State.username}`, 'info');
        this._print(output, `   Host: VirtualOS X`, 'info');
        this._print(output, `   Shell: ${osInfo.shell}`, 'info');
        this._print(output, `   Theme: ${VOS.State.settings?.theme || 'dark'}`, 'info');
        this._print(output, `   Resolution: ${window.innerWidth}x${window.innerHeight}`, 'info');
        this._print(output, `   Uptime: ${Math.floor(performance.now() / 1000)}s`, 'info');
        this._print(output, `   Memory: ${(performance.memory?.usedJSHeapSize / 1024 / 1024)?.toFixed(1) || '~64'} MB`, 'info');
    },

    _autocomplete(winId, input) {
        const val = input.value.trim().toLowerCase();
        const commands = ['help', 'clear', 'date', 'ls', 'mkdir', 'echo', 'whoami', 'uname', 'neofetch', 'history', 'cat', 'pwd', 'hostname', 'uptime'];
        const match = commands.find(c => c.startsWith(val));
        if (match) input.value = match;
    },

    async _ls(winId, output) {
        try {
            const data = await VOS.API.get('/files');
            const folders = data.folders || [];
            const files = data.files || [];
            if (folders.length === 0 && files.length === 0) {
                this._print(output, '(empty directory)', 'info');
            } else {
                folders.forEach(f => this._print(output, `📁 ${f.name}/`, 'accent'));
                files.forEach(f => this._print(output, `📄 ${f.name}  (${this._formatSize(f.size)})`, 'info'));
            }
        } catch (err) {
            this._print(output, 'Error: Could not list files', 'error');
        }
        this._print(output, '');
        output.scrollTop = output.scrollHeight;
    },

    async _mkdir(winId, name, output) {
        try {
            await VOS.API.post('/files/folder', { name, parentId: null });
            this._print(output, `Directory created: ${name}`, 'info');
        } catch (err) {
            this._print(output, `Error: Could not create directory "${name}"`, 'error');
        }
        this._print(output, '');
        output.scrollTop = output.scrollHeight;
    },

    _print(output, text, className = '') {
        const span = document.createElement('span');
        span.className = `terminal-line${className ? ' ' + className : ''}`;
        span.textContent = text;
        output.appendChild(span);
    },

    _formatSize(bytes) {
        if (!bytes) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        let i = 0;
        let size = bytes;
        while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
        return `${size.toFixed(1)} ${units[i]}`;
    }
};
