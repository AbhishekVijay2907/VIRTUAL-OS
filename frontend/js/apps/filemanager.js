/**
 * VirtualOS File Manager Application
 * Navigate folders, upload files, create/rename/delete items
 */
VOS.FileManagerApp = {
    _states: {},

    init(winId, container) {
        // Per-window file manager state
        this._states[winId] = {
            currentParentId: null,
            breadcrumbs: [{ id: null, name: 'Root' }]
        };

        container.innerHTML = `
            <div class="filemanager-app">
                <div class="filemanager-toolbar">
                    <button class="fm-toolbar-btn" id="${winId}-fm-back" title="Back">⬅ Back</button>
                    <div class="fm-breadcrumbs" id="${winId}-fm-breadcrumbs"></div>
                    <button class="fm-toolbar-btn" id="${winId}-fm-newfolder">📁 New Folder</button>
                    <button class="fm-toolbar-btn primary" id="${winId}-fm-upload">⬆ Upload</button>
                    <input type="file" id="${winId}-fm-file-input" style="display:none" />
                </div>
                <div class="filemanager-body">
                    <div class="fm-grid" id="${winId}-fm-grid"></div>
                </div>
            </div>
        `;

        // Bind toolbar buttons
        document.getElementById(`${winId}-fm-back`).addEventListener('click', () => this.goBack(winId));
        document.getElementById(`${winId}-fm-newfolder`).addEventListener('click', () => this.createFolder(winId));
        document.getElementById(`${winId}-fm-upload`).addEventListener('click', () => {
            document.getElementById(`${winId}-fm-file-input`).click();
        });
        document.getElementById(`${winId}-fm-file-input`).addEventListener('change', (e) => this.handleUpload(winId, e));

        this.loadContents(winId);
    },

    async loadContents(winId) {
        const state = this._states[winId];
        if (!state) return;
        const grid = document.getElementById(`${winId}-fm-grid`);
        if (!grid) return;

        grid.innerHTML = '<div class="fm-empty">Loading...</div>';

        try {
            const parentParam = state.currentParentId ? `?parentId=${state.currentParentId}` : '';
            const data = await VOS.API.get(`/files${parentParam}`);
            grid.innerHTML = '';

            const folders = data.folders || [];
            const files = data.files || [];

            if (folders.length === 0 && files.length === 0) {
                grid.innerHTML = '<div class="fm-empty">📂 This folder is empty</div>';
            }

            // Render folders
            folders.forEach(folder => {
                const el = document.createElement('div');
                el.className = 'fm-item';
                el.innerHTML = `
                    <span class="fm-icon">📁</span>
                    <span class="fm-name">${this._esc(folder.name)}</span>
                    <span class="fm-item-context-btn" title="More">⋮</span>
                `;
                el.addEventListener('dblclick', () => this.navigateToFolder(winId, folder));
                el.querySelector('.fm-item-context-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._showItemMenu(winId, 'folder', folder, e);
                });
                grid.appendChild(el);
            });

            // Render files
            files.forEach(file => {
                const el = document.createElement('div');
                el.className = 'fm-item';
                el.innerHTML = `
                    <span class="fm-icon">${this._fileIcon(file.mimeType)}</span>
                    <span class="fm-name">${this._esc(file.name)}</span>
                    <span class="fm-item-context-btn" title="More">⋮</span>
                `;
                el.querySelector('.fm-item-context-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._showItemMenu(winId, 'file', file, e);
                });
                grid.appendChild(el);
            });
        } catch (err) {
            grid.innerHTML = '<div class="fm-empty">Failed to load files</div>';
        }

        this._renderBreadcrumbs(winId);
    },

    navigateToFolder(winId, folder) {
        const state = this._states[winId];
        state.currentParentId = folder.id;
        state.breadcrumbs.push({ id: folder.id, name: folder.name });
        this.loadContents(winId);
    },

    goBack(winId) {
        const state = this._states[winId];
        if (state.breadcrumbs.length <= 1) return;
        state.breadcrumbs.pop();
        state.currentParentId = state.breadcrumbs[state.breadcrumbs.length - 1].id;
        this.loadContents(winId);
    },

    _renderBreadcrumbs(winId) {
        const state = this._states[winId];
        const el = document.getElementById(`${winId}-fm-breadcrumbs`);
        if (!el) return;
        el.innerHTML = '';

        state.breadcrumbs.forEach((crumb, i) => {
            if (i > 0) {
                const sep = document.createElement('span');
                sep.className = 'fm-breadcrumb-sep';
                sep.textContent = '›';
                el.appendChild(sep);
            }
            const item = document.createElement('span');
            item.className = 'fm-breadcrumb-item';
            item.textContent = crumb.name;
            item.addEventListener('click', () => {
                state.breadcrumbs = state.breadcrumbs.slice(0, i + 1);
                state.currentParentId = crumb.id;
                this.loadContents(winId);
            });
            el.appendChild(item);
        });
    },

    async createFolder(winId) {
        const name = prompt('Enter folder name:');
        if (!name || !name.trim()) return;
        const state = this._states[winId];
        try {
            await VOS.API.post('/files/folder', {
                name: name.trim(),
                parentId: state.currentParentId
            });
            await this.loadContents(winId);
            VOS.Notify.show('Files', 'Folder created', '📁');
        } catch (err) {
            VOS.Notify.show('Error', 'Could not create folder', '❌');
        }
    },

    async handleUpload(winId, e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            VOS.Notify.show('Error', 'File exceeds 5MB limit', '❌');
            return;
        }

        const state = this._states[winId];
        const reader = new FileReader();

        reader.onload = async () => {
            try {
                await VOS.API.post('/files/upload', {
                    name: file.name,
                    parentId: state.currentParentId,
                    mimeType: file.type || 'application/octet-stream',
                    size: file.size,
                    content: reader.result
                });
                await this.loadContents(winId);
                VOS.Notify.show('Files', `"${file.name}" uploaded`, '✅');
            } catch (err) {
                VOS.Notify.show('Error', 'Upload failed', '❌');
            }
        };
        reader.readAsDataURL(file);
        // Reset file input
        e.target.value = '';
    },

    _showItemMenu(winId, type, item, event) {
        const actions = [
            {
                label: '✏️ Rename', action: async () => {
                    const newName = prompt('Rename to:', item.name);
                    if (!newName || !newName.trim()) return;
                    try {
                        const endpoint = type === 'folder'
                            ? `/files/folder/${item.id}/rename`
                            : `/files/file/${item.id}/rename`;
                        await VOS.API.put(endpoint, { name: newName.trim() });
                        await this.loadContents(winId);
                    } catch (err) {
                        VOS.Notify.show('Error', 'Rename failed', '❌');
                    }
                }
            },
            {
                label: '🗑️ Delete', action: async () => {
                    if (!confirm(`Delete "${item.name}"?`)) return;
                    try {
                        const endpoint = type === 'folder'
                            ? `/files/folder/${item.id}`
                            : `/files/${item.id}`;
                        await VOS.API.delete(endpoint);
                        await this.loadContents(winId);
                        VOS.Notify.show('Files', `"${item.name}" deleted`, '🗑️');
                    } catch (err) {
                        VOS.Notify.show('Error', 'Delete failed', '❌');
                    }
                }
            }
        ];
        VOS.ContextMenu.showCustom(event.clientX, event.clientY, actions);
    },

    _fileIcon(mimeType) {
        if (!mimeType) return '📄';
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎬';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📕';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
        if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('javascript')) return '📃';
        return '📄';
    },

    _esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }
};
