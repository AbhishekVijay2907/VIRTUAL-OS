/**
 * VirtualOS Notes Application
 * Create, edit, delete, and auto-save notes backed by MongoDB
 * Supports Note Categories and safe Regex-based Markdown Rendering
 */
VOS.NotesApp = {
    _debounceTimers: {},

    async init(winId, container) {
        container.innerHTML = `
            <div class="notes-app">
                <div class="notes-sidebar">
                    <div class="notes-sidebar-header">
                        <span class="notes-sidebar-title">My Notes</span>
                        <select class="notes-category-filter" id="${winId}-category-filter" style="background:transparent;border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:var(--text-color);font-size:0.75rem;outline:none;padding:2px;cursor:pointer;width:80px;">
                            <option value="ALL">All</option>
                            <option value="General">General</option>
                            <option value="Work">Work</option>
                            <option value="Personal">Personal</option>
                            <option value="Ideas">Ideas</option>
                        </select>
                        <button class="notes-new-btn" id="${winId}-new-note" title="New Note">+</button>
                    </div>
                    <div class="notes-list" id="${winId}-notes-list"></div>
                </div>
                <div class="notes-editor" id="${winId}-editor">
                    <div class="notes-empty-state">
                        <span class="empty-icon">📝</span>
                        <span>Select a note or create a new one</span>
                    </div>
                </div>
            </div>
        `;

        // Bind events
        document.getElementById(`${winId}-new-note`).addEventListener('click', () => this.createNote(winId));
        document.getElementById(`${winId}-category-filter`).addEventListener('change', () => this.loadNotes(winId));

        // Load notes
        await this.loadNotes(winId);
    },

    async loadNotes(winId) {
        const listEl = document.getElementById(`${winId}-notes-list`);
        if (!listEl) return;

        const filterEl = document.getElementById(`${winId}-category-filter`);
        const filterVal = filterEl ? filterEl.value : 'ALL';

        try {
            let notes = await VOS.API.get('/notes');
            listEl.innerHTML = '';

            if (!notes || notes.length === 0) {
                listEl.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:0.8rem;text-align:center;">No notes yet</div>';
                return;
            }

            notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

            if (filterVal !== 'ALL') {
                notes = notes.filter(n => n.category === filterVal);
            }

            if (notes.length === 0) {
                listEl.innerHTML = '<div style="padding:16px;color:var(--text-muted);font-size:0.8rem;text-align:center;">No notes in this category</div>';
                return;
            }

            notes.forEach(note => {
                const item = document.createElement('div');
                item.className = 'note-list-item';
                item.dataset.noteId = note.id;
                
                // Light category prefix pill if not General
                const catBadge = note.category && note.category !== 'General' 
                    ? `<span style="font-size:0.65rem;background:rgba(var(--accent-color-rgb), 0.2);border:1px solid var(--accent-color);color:var(--text-color);padding:1px 4px;border-radius:3px;margin-right:6px;font-weight:600;">${note.category}</span>` 
                    : '';
                
                item.innerHTML = `
                    <div class="note-list-item-title" style="display:flex;align-items:center;">${catBadge}<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">${this._escapeHtml(note.title)}</span></div>
                    <div class="note-list-item-date">${this._formatDate(note.updatedAt)}</div>
                `;
                item.addEventListener('click', () => this.selectNote(winId, note));
                listEl.appendChild(item);
            });

            // Re-highlight active note in list if selected
            const editor = document.getElementById(`${winId}-editor`);
            if (editor && editor.dataset.noteId) {
                const activeItem = listEl.querySelector(`.note-list-item[data-note-id="${editor.dataset.noteId}"]`);
                if (activeItem) activeItem.classList.add('active');
            }
        } catch (err) {
            listEl.innerHTML = '<div style="padding:16px;color:#ef4444;font-size:0.8rem;">Failed to load notes</div>';
        }
    },

    selectNote(winId, note) {
        const editor = document.getElementById(`${winId}-editor`);
        if (!editor) return;

        // Highlight active note in sidebar
        document.querySelectorAll(`#${winId}-notes-list .note-list-item`).forEach(el => el.classList.remove('active'));
        const activeItem = document.querySelector(`#${winId}-notes-list .note-list-item[data-note-id="${note.id}"]`);
        if (activeItem) activeItem.classList.add('active');

        editor.dataset.noteId = note.id;
        editor.innerHTML = `
            <div style="display:flex;padding:6px 16px;gap:12px;align-items:center;border-bottom:1px solid rgba(255,255,255,0.05);flex-shrink:0;height:45px;">
                <input class="notes-editor-title" id="${winId}-note-title" value="${this._escapeAttr(note.title)}" placeholder="Untitled Note" style="border:none;flex:1;background:transparent;outline:none;font-weight:700;color:var(--text-color);font-size:1.05rem;" />
                
                <select class="notes-note-category" id="${winId}-note-category" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:var(--text-color);font-size:0.75rem;padding:4px 8px;outline:none;cursor:pointer;">
                    <option value="General">General</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Ideas">Ideas</option>
                </select>
                
                <button id="${winId}-toggle-preview" class="fm-toolbar-btn" style="height:26px;font-size:0.75rem;padding:0 8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:inherit;cursor:pointer;">👀 Preview</button>
            </div>
            
            <div style="flex:1;position:relative;display:flex;flex-direction:column;overflow:hidden;">
                <textarea class="notes-editor-content" id="${winId}-note-content" placeholder="Start writing (Markdown supported)..." style="width:100%;height:100%;resize:none;border:none;background:transparent;color:var(--text-color);padding:16px;outline:none;font-size:0.9rem;line-height:1.6;font-family:var(--font-family);overflow-y:auto;box-sizing:border-box;"></textarea>
                
                <div class="notes-preview-container" id="${winId}-note-preview" style="display:none;position:absolute;inset:0;background:var(--window-bg);backdrop-filter:var(--glass-blur);padding:16px;overflow-y:auto;color:var(--text-color);font-size:0.9rem;line-height:1.6;font-family:var(--font-family);z-index:5;box-sizing:border-box;"></div>
            </div>
            
            <div class="notes-save-indicator" id="${winId}-save-status">Saved</div>
        `;

        const titleInput = document.getElementById(`${winId}-note-title`);
        const contentInput = document.getElementById(`${winId}-note-content`);
        const catSelect = document.getElementById(`${winId}-note-category`);
        const toggleBtn = document.getElementById(`${winId}-toggle-preview`);
        const previewDiv = document.getElementById(`${winId}-note-preview`);

        // Set initial values
        catSelect.value = note.category || 'General';
        contentInput.value = note.content || '';

        let isPreviewMode = false;

        // Toggle Markdown Preview
        toggleBtn?.addEventListener('click', () => {
            isPreviewMode = !isPreviewMode;
            if (isPreviewMode) {
                toggleBtn.textContent = '✏️ Edit';
                contentInput.style.display = 'none';
                previewDiv.style.display = 'block';
                previewDiv.innerHTML = this._renderMarkdown(contentInput.value);
            } else {
                toggleBtn.textContent = '👀 Preview';
                contentInput.style.display = 'block';
                previewDiv.style.display = 'none';
            }
        });

        // Trigger auto-save
        const autoSave = () => {
            const statusEl = document.getElementById(`${winId}-save-status`);
            if (statusEl) statusEl.textContent = 'Saving...';

            clearTimeout(this._debounceTimers[winId]);
            this._debounceTimers[winId] = setTimeout(async () => {
                try {
                    await VOS.API.put(`/notes/${note.id}`, {
                        title: titleInput.value,
                        content: contentInput.value,
                        category: catSelect.value
                    });
                    if (statusEl) statusEl.textContent = 'Saved';
                    this.loadNotes(winId);
                } catch (err) {
                    if (statusEl) statusEl.textContent = 'Save failed';
                }
            }, 800);
        };

        titleInput.addEventListener('input', autoSave);
        contentInput.addEventListener('input', autoSave);
        catSelect.addEventListener('change', autoSave);

        // Delete note via context menu trigger on wrapper
        editor.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const actions = [
                {
                    label: '🗑️ Delete Note',
                    action: () => {
                        if (confirm('Delete this note?')) {
                            this.deleteNote(winId, note.id);
                        }
                    }
                }
            ];
            VOS.ContextMenu.showCustom(e.clientX, e.clientY, actions);
        });
    },

    async createNote(winId) {
        try {
            const filterEl = document.getElementById(`${winId}-category-filter`);
            const defaultCat = (filterEl && filterEl.value !== 'ALL') ? filterEl.value : 'General';
            
            const note = await VOS.API.post('/notes', { 
                title: 'Untitled Note', 
                content: '', 
                category: defaultCat 
            });
            if (note) {
                await this.loadNotes(winId);
                this.selectNote(winId, note);
                VOS.Notify.show('Notes', 'New note created', '📝');
            }
        } catch (err) {
            VOS.Notify.show('Error', 'Could not create note', '❌');
        }
    },

    async deleteNote(winId, noteId) {
        try {
            await VOS.API.delete(`/notes/${noteId}`);
            await this.loadNotes(winId);
            const editor = document.getElementById(`${winId}-editor`);
            if (editor) {
                editor.removeAttribute('data-note-id');
                editor.innerHTML = `
                    <div class="notes-empty-state">
                        <span class="empty-icon">📝</span>
                        <span>Select a note or create a new one</span>
                    </div>
                `;
            }
            VOS.Notify.show('Notes', 'Note deleted', '🗑️');
        } catch (err) {
            VOS.Notify.show('Error', 'Could not delete note', '❌');
        }
    },

    _renderMarkdown(text) {
        if (!text) return '<i>No content to preview. Write something first!</i>';
        
        let html = this._escapeHtml(text);

        // Headers
        html = html.replace(/^### (.*?)$/gm, '<h3 style="margin-top:12px;margin-bottom:6px;font-weight:600;font-size:1rem;color:var(--accent-color);">$1</h3>');
        html = html.replace(/^## (.*?)$/gm, '<h2 style="margin-top:16px;margin-bottom:8px;font-weight:600;font-size:1.15rem;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:2px;">$1</h2>');
        html = html.replace(/^# (.*?)$/gm, '<h1 style="margin-top:20px;margin-bottom:10px;font-weight:700;font-size:1.35rem;border-bottom:1px solid rgba(255,255,255,0.15);padding-bottom:4px;">$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--accent-color);font-weight:600;">$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em style="opacity:0.9;">$1</em>');

        // Bullets
        html = html.replace(/^[-\*] (.*?)$/gm, '<li style="margin-left:16px;margin-bottom:4px;list-style-type:disc;">$1</li>');

        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.06);padding:10px;border-radius:6px;font-family:monospace;font-size:0.8rem;margin:10px 0;overflow-x:auto;line-height:1.4;">$1</pre>');

        // Inline code
        html = html.replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.05);padding:2px 4px;border-radius:4px;font-family:monospace;font-size:0.8rem;color:var(--accent-color);">$1</code>');

        // Paragraph newlines (excluding headers, list items and pre blocks)
        html = html.split('\n').map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('<li') || trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('</pre') || trimmed === '') {
                return line;
            }
            return line + '<br>';
        }).join('\n');

        return html;
    },

    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    _escapeAttr(str) {
        if (!str) return '';
        return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    _formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    }
};
