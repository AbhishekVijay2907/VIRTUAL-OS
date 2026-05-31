/**
 * VirtualOS System Monitor & Task Manager
 * Real-time system metrics with animated SVG ring gauges
 * and a live process/task table of running VOS windows
 */
VOS.SysMonitorApp = {
    _states: {},

    init(winId, container) {
        // ── Accent colors per metric ──
        const METRICS = [
            {
                key: 'cpu', label: 'CPU', icon: '🧠',
                color: '#3b82f6', colorRgb: '59, 130, 246',
                genPercent: () => Math.min(99, Math.max(2, 25 + Math.round((Math.random() - 0.4) * 50))),
                stats: (p) => [
                    { label: 'Usage', value: `${p}%` },
                    { label: 'Cores', value: '8 (16 threads)' },
                    { label: 'Speed', value: `${(2.8 + Math.random() * 1.6).toFixed(1)} GHz` },
                    { label: 'Processes', value: `${120 + Math.floor(Math.random() * 60)}` }
                ]
            },
            {
                key: 'memory', label: 'Memory', icon: '💾',
                color: '#8b5cf6', colorRgb: '139, 92, 246',
                genPercent: () => Math.min(95, Math.max(15, 45 + Math.round((Math.random() - 0.5) * 30))),
                stats: (p) => {
                    const total = 16;
                    const used = (total * p / 100).toFixed(1);
                    const free = (total - used).toFixed(1);
                    return [
                        { label: 'Used', value: `${used} GB` },
                        { label: 'Free', value: `${free} GB` },
                        { label: 'Total', value: `${total} GB` },
                        { label: 'Cached', value: `${(1 + Math.random() * 3).toFixed(1)} GB` }
                    ];
                }
            },
            {
                key: 'disk', label: 'Disk', icon: '💿',
                color: '#14b8a6', colorRgb: '20, 184, 166',
                genPercent: () => Math.min(92, Math.max(30, 58 + Math.round((Math.random() - 0.5) * 20))),
                stats: (p) => {
                    const total = 512;
                    const used = Math.round(total * p / 100);
                    return [
                        { label: 'Used', value: `${used} GB` },
                        { label: 'Free', value: `${total - used} GB` },
                        { label: 'Total', value: `${total} GB` },
                        { label: 'Read', value: `${(50 + Math.random() * 200).toFixed(0)} MB/s` }
                    ];
                }
            },
            {
                key: 'network', label: 'Network', icon: '📡',
                color: '#f97316', colorRgb: '249, 115, 22',
                genPercent: () => Math.min(85, Math.max(3, 20 + Math.round((Math.random() - 0.3) * 55))),
                stats: (p) => [
                    { label: 'Download', value: `${(5 + Math.random() * 90).toFixed(1)} Mbps` },
                    { label: 'Upload', value: `${(1 + Math.random() * 30).toFixed(1)} Mbps` },
                    { label: 'Latency', value: `${Math.floor(4 + Math.random() * 40)} ms` },
                    { label: 'Packets', value: `${(1000 + Math.floor(Math.random() * 9000)).toLocaleString()}` }
                ]
            }
        ];

        const CIRCUMFERENCE = 2 * Math.PI * 36; // ≈ 226.19

        // ── Build metric card HTML ──
        const buildCard = (m) => `
            <div class="sysmonitor-card" data-metric="${m.key}">
                <div class="sysmonitor-card-header">
                    <span>${m.icon} ${m.label}</span>
                    <span id="${winId}-${m.key}-pct-header" style="color:${m.color};">0%</span>
                </div>
                <div class="sysmonitor-chart-row">
                    <div class="sysmonitor-ring-container">
                        <svg class="sysmonitor-svg-ring" width="80" height="80" viewBox="0 0 80 80">
                            <circle class="sysmonitor-circle-bg" cx="40" cy="40" r="36"/>
                            <circle class="sysmonitor-circle-value"
                                id="${winId}-${m.key}-ring"
                                cx="40" cy="40" r="36"
                                style="stroke: ${m.color}; stroke-dashoffset: ${CIRCUMFERENCE};"
                            />
                        </svg>
                        <div class="sysmonitor-ring-text" id="${winId}-${m.key}-ring-text" style="color:${m.color};">0%</div>
                    </div>
                    <div class="sysmonitor-stats-col" id="${winId}-${m.key}-stats"></div>
                </div>
            </div>
        `;

        // ── Build process table HTML ──
        const processTableHTML = `
            <div class="sysmonitor-processes">
                <div class="sysmonitor-card-header">
                    <span>🗂️ Running Processes</span>
                    <span id="${winId}-proc-count" style="color: var(--text-muted);">0 tasks</span>
                </div>
                <table class="process-table">
                    <thead>
                        <tr>
                            <th>PID</th>
                            <th>Name</th>
                            <th>CPU %</th>
                            <th>Mem %</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="${winId}-proc-tbody"></tbody>
                </table>
            </div>
        `;

        // ── Inject full layout ──
        container.innerHTML = `
            <div class="sysmonitor-app">
                <div class="sysmonitor-grid">
                    ${METRICS.map(m => buildCard(m)).join('')}
                </div>
                ${processTableHTML}
            </div>
        `;

        // ── Generate stable fake PIDs per window ──
        const pidMap = {};
        const getPid = (windowId) => {
            if (!pidMap[windowId]) {
                pidMap[windowId] = 1000 + Math.floor(Math.random() * 8999);
            }
            return pidMap[windowId];
        };

        // ── Update metric rings ──
        const updateMetrics = () => {
            METRICS.forEach(m => {
                const percent = m.genPercent();
                const offset = CIRCUMFERENCE - (percent / 100 * CIRCUMFERENCE);
                const stats = m.stats(percent);

                // Ring animation
                const ring = document.getElementById(`${winId}-${m.key}-ring`);
                if (ring) ring.style.strokeDashoffset = offset;

                // Ring center text
                const ringText = document.getElementById(`${winId}-${m.key}-ring-text`);
                if (ringText) ringText.textContent = `${percent}%`;

                // Header percentage
                const pctHeader = document.getElementById(`${winId}-${m.key}-pct-header`);
                if (pctHeader) pctHeader.textContent = `${percent}%`;

                // Stats column
                const statsCol = document.getElementById(`${winId}-${m.key}-stats`);
                if (statsCol) {
                    statsCol.innerHTML = stats.map(s => `
                        <div class="sysmonitor-stat-item">
                            <span class="sysmonitor-stat-label">${s.label}</span>
                            <span class="sysmonitor-stat-value">${s.value}</span>
                        </div>
                    `).join('');
                }
            });
        };

        // ── Update process table ──
        const updateProcesses = () => {
            const tbody = document.getElementById(`${winId}-proc-tbody`);
            const procCount = document.getElementById(`${winId}-proc-count`);
            if (!tbody) return;

            const windows = VOS.State.windows || [];
            const apps = VOS.Config.APPS || [];

            if (windows.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align:center; padding:20px; color:var(--text-muted);">
                            No running processes
                        </td>
                    </tr>
                `;
                if (procCount) procCount.textContent = '0 tasks';
                return;
            }

            if (procCount) procCount.textContent = `${windows.length} task${windows.length !== 1 ? 's' : ''}`;

            tbody.innerHTML = windows.map(w => {
                const appDef = apps.find(a => a.id === w.appId);
                const name = appDef ? `${appDef.icon} ${appDef.name}` : w.appId;
                const pid = getPid(w.id);
                const cpu = (Math.random() * 18).toFixed(1);
                const mem = (Math.random() * 12).toFixed(1);
                const status = w.minimized ? '💤 Suspended' : '🟢 Running';
                const isSelf = w.id === winId;

                return `
                    <tr class="process-row">
                        <td style="font-family: monospace; opacity: 0.7;">${pid}</td>
                        <td>${name}</td>
                        <td>${cpu}%</td>
                        <td>${mem}%</td>
                        <td style="font-size:0.75rem;">${status}</td>
                        <td>
                            ${isSelf
                                ? '<span style="font-size:0.7rem; opacity:0.4;">self</span>'
                                : `<button class="process-kill-btn" data-kill-win="${w.id}">End</button>`
                            }
                        </td>
                    </tr>
                `;
            }).join('');

            // Bind kill buttons
            tbody.querySelectorAll('.process-kill-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetWinId = btn.dataset.killWin;
                    if (targetWinId && VOS.WM && VOS.WM.close) {
                        VOS.WM.close(targetWinId);
                        // Refresh immediately after kill
                        setTimeout(updateProcesses, 250);
                    }
                });
            });
        };

        // ── Run initial update ──
        updateMetrics();
        updateProcesses();

        // ── Set intervals ──
        const metricsInterval = setInterval(updateMetrics, 2000);
        const processInterval = setInterval(updateProcesses, 2000);

        // ── Store state for cleanup ──
        this._states[winId] = {
            intervals: [metricsInterval, processInterval]
        };

        // ── Cleanup on window removal ──
        const observer = new MutationObserver(() => {
            if (!document.getElementById(winId)) {
                this._cleanup(winId);
                observer.disconnect();
            }
        });
        observer.observe(document.getElementById('windows-container'), { childList: true });
    },

    /**
     * Clean up all intervals for a specific window
     */
    _cleanup(winId) {
        const state = this._states[winId];
        if (state) {
            (state.intervals || []).forEach(id => clearInterval(id));
            delete this._states[winId];
        }
    }
};
