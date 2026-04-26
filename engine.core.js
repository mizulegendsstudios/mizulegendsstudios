// engine.core.js
const MizuEngine = {
    AudioEngine: {
        ctx: null,
        init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
        tic(freq = 800) {
            if (!this.ctx) this.init();
            if (this.ctx.state === 'suspended') this.ctx.resume().catch(()=>{});
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = "sine";
                osc.frequency.value = freq;
                gain.gain.value = 0.04;
                gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.06);
            } catch(e) {}
        }
    },

    db: MizuData,
    historyStack: ['🏠 INICIO'],
    lastFocusedNode: null,
    currentThemeIndex: 0,
    themes: ['esports', 'neon', 'retro', 'oceanic', 'sunset'],

    updateURL() { window.location.hash = this.historyStack.map(encodeURIComponent).join('/'); },

    render(currentNode) {
        const stageEl = document.getElementById('stage');
        const oldNodes = document.querySelectorAll('.node');
        oldNodes.forEach(n => n.classList.add('zoom-forward'));
        setTimeout(() => {
            stageEl.innerHTML = '';
            let data = null;
            if (this.db[currentNode]) data = { items: this.db[currentNode].items, desc: this.db[currentNode].desc };
            else data = { items: [], desc: `📌 Nodo terminal.` };
            const hasItems = data.items && data.items.length > 0;
            if (!hasItems) {
                const leaf = document.createElement('div');
                leaf.className = 'node spawn-in';
                leaf.tabIndex = 0;
                leaf.innerHTML = `<div class="node-tag">🏁 DEAD END</div><h2>${this.escapeHtml(currentNode)}</h2><div class="node-detail">${this.escapeHtml(data.desc)}</div>`;
                stageEl.appendChild(leaf);
                this.attachNodeEvents(leaf);
            } else {
                data.items.forEach(childName => {
                    const div = document.createElement('div');
                    div.className = 'node spawn-in';
                    div.tabIndex = 0;
                    div.innerHTML = `<div class="node-tag">➡️ ${this.escapeHtml(currentNode)}</div><h2>${this.escapeHtml(childName)}</h2><div class="node-detail">${this.escapeHtml(this.getDynamicDesc(childName))}</div>`;
                    div.onclick = (e) => { e.stopPropagation(); this.navigateToChild(childName); };
                    this.attachNodeEvents(div);
                    stageEl.appendChild(div);
                });
            }
            this.updateHUD();
            const firstNode = stageEl.querySelector('.node');
            if (firstNode) {
                firstNode.focus();
                firstNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
                this.lastFocusedNode = firstNode;
            }
        }, 260);
    },

    navigateToChild(childName) {
        this.AudioEngine.tic(1100);
        this.historyStack.push(childName);
        this.updateURL();
        this.render(childName);
    },

    attachNodeEvents(node) {
        node.onkeydown = (e) => {
            if (e.key === 'Enter') { node.click(); return; }
            const nodes = Array.from(document.querySelectorAll('.node'));
            const idx = nodes.indexOf(node);
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (idx === nodes.length - 1) {
                    const themeBtn = document.getElementById('themeBtn');
                    if (themeBtn) themeBtn.focus();
                } else {
                    const next = nodes[idx + 1];
                    if (next) { next.focus(); next.scrollIntoView({ behavior: 'smooth', block: 'start' }); this.lastFocusedNode = next; }
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (idx === 0) {
                    const firstCrumb = document.querySelector('.crumb');
                    if (firstCrumb) firstCrumb.focus();
                } else {
                    const prev = nodes[idx - 1];
                    if (prev) { prev.focus(); prev.scrollIntoView({ behavior: 'smooth', block: 'start' }); this.lastFocusedNode = prev; }
                }
            }
        };
        node.addEventListener('focus', () => { this.lastFocusedNode = node; });
    },

    getDynamicDesc(name) {
        if (this.db[name] && this.db[name].desc) return this.db[name].desc;
        return `Explora "${name}".`;
    },
    escapeHtml(str) { return str.replace(/[&<>]/g, m => m==='&'?'&amp;':m==='<'?'&lt;':'&gt;'); },

    updateHUD() {
        const nav = document.getElementById('hud-nav');
        nav.innerHTML = '';
        this.historyStack.forEach((crumb, idx) => {
            const span = document.createElement('span');
            span.className = 'crumb';
            span.tabIndex = 0;
            let display = crumb.length > 24 ? crumb.slice(0,20)+'…' : crumb;
            span.innerText = display;
            span.title = crumb;
            span.onclick = () => {
                if (idx === this.historyStack.length-1) return;
                this.AudioEngine.tic(620);
                this.historyStack = this.historyStack.slice(0, idx+1);
                this.updateURL();
                this.render(this.historyStack[this.historyStack.length-1]);
            };
            span.onkeydown = (e) => {
                const crumbs = Array.from(document.querySelectorAll('.crumb'));
                const currentIdx = crumbs.indexOf(span);
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    if (currentIdx > 0) crumbs[currentIdx-1].focus();
                    else crumbs[crumbs.length-1].focus();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (currentIdx < crumbs.length-1) crumbs[currentIdx+1].focus();
                    else crumbs[0].focus();
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (this.lastFocusedNode && document.body.contains(this.lastFocusedNode)) {
                        this.lastFocusedNode.focus();
                        this.lastFocusedNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        const firstNode = document.querySelector('.node');
                        if (firstNode) { firstNode.focus(); firstNode.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
                    }
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    span.click();
                }
            };
            nav.appendChild(span);
        });
        if (nav.lastChild) nav.lastChild.scrollIntoView({ behavior: 'smooth', inline: 'end' });
    },

    setupFloatingButtonsFocus() {
        const themeBtn = document.getElementById('themeBtn');
        const supportBtn = document.getElementById('supportBtn');
        supportBtn.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const firstNode = document.querySelector('.node');
                if (firstNode) { firstNode.focus(); firstNode.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                themeBtn.focus();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                supportBtn.click();
            }
        });
        themeBtn.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                supportBtn.focus();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const nodes = document.querySelectorAll('.node');
                if (nodes.length > 0) {
                    nodes[nodes.length-1].focus();
                    nodes[nodes.length-1].scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                themeBtn.click();
            }
        });
    },

    setupGlobalFocusRecovery() {
        window.addEventListener('keydown', (e) => {
            if (e.key.startsWith('Arrow')) {
                const active = document.activeElement;
                const isBody = active === document.body || active === document.documentElement;
                const isModal = document.querySelector('.modal-overlay.active');
                if (isModal) return;
                if (isBody || (active && active.classList && active.classList.contains('node') === false && 
                    active.id !== 'themeBtn' && active.id !== 'supportBtn' && active.classList?.contains('crumb') === false)) {
                    e.preventDefault();
                    const firstNode = document.querySelector('.node');
                    if (firstNode) {
                        firstNode.focus();
                        firstNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        const firstCrumb = document.querySelector('.crumb');
                        if (firstCrumb) firstCrumb.focus();
                    }
                }
            }
        });
    },

    openModal(modalId, customContent = null) {
        const modal = document.getElementById(modalId);
        const modalText = document.getElementById('modalText');
        if (customContent) modalText.innerHTML = customContent;
        this.previousActiveElement = document.activeElement;
        modal.classList.add('active');
        const closeBtn = document.getElementById('closeModalBtn');
        if (closeBtn) closeBtn.focus();
        const trap = (e) => {
            const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };
        modal.addEventListener('keydown', trap);
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.closeModal(modalId);
            }
        }, { once: false });
        modal._trapHandler = trap;
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        if (modal._trapHandler) {
            modal.removeEventListener('keydown', modal._trapHandler);
            delete modal._trapHandler;
        }
        if (this.previousActiveElement && this.previousActiveElement.focus) this.previousActiveElement.focus();
        else {
            const firstNode = document.querySelector('.node');
            if (firstNode) firstNode.focus();
        }
    },

    initCookies() {
        const bar = document.getElementById('cookieBar');
        const acceptBtn = document.getElementById('acceptCookiesBtn');
        const moreBtn = document.getElementById('moreInfoBtn');
        const closeModalBtn = document.getElementById('closeModalBtn');
        if (!localStorage.getItem('mizu_cookie_consent')) {
            bar.style.display = 'flex';
            acceptBtn.focus();
            const buttons = [moreBtn, acceptBtn];
            const handleKey = (e) => {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    if (document.activeElement === acceptBtn) moreBtn.focus();
                    else if (document.activeElement === moreBtn) acceptBtn.focus();
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    if (document.activeElement === moreBtn) acceptBtn.focus();
                    else if (document.activeElement === acceptBtn) moreBtn.focus();
                }
            };
            bar.addEventListener('keydown', handleKey);
            acceptBtn.onclick = () => {
                localStorage.setItem('mizu_cookie_consent', 'true');
                bar.style.display = 'none';
                this.AudioEngine.tic(420);
                bar.removeEventListener('keydown', handleKey);
                const firstNode = document.querySelector('.node');
                if (firstNode) firstNode.focus();
            };
            moreBtn.onclick = () => {
                this.openModal('infoModal', '🍪 Cookies técnicas: almacenan tu preferencia de tema y consentimiento. No hay rastreo.');
                bar.removeEventListener('keydown', handleKey);
            };
        } else {
            bar.style.display = 'none';
            const firstNode = document.querySelector('.node');
            if (firstNode) firstNode.focus();
        }
        closeModalBtn.onclick = () => {
            this.closeModal('infoModal');
        };
    },

    setupSupportButton() {
        const supportBtn = document.getElementById('supportBtn');
        supportBtn.onclick = () => {
            this.AudioEngine.tic(900);
            window.open('https://www.paypal.com/donate/?hosted_button_id=CE4XEUSEYHQXL', '_blank', 'noopener,noreferrer');
        };
    },

    applyTheme(idx) { 
        document.body.setAttribute('data-theme', this.themes[idx]); 
        localStorage.setItem('mizu_theme', this.themes[idx]); 
    },
    cycleTheme() { 
        this.currentThemeIndex = (this.currentThemeIndex+1)%this.themes.length; 
        this.applyTheme(this.currentThemeIndex); 
        this.AudioEngine.tic(880); 
    },
    loadSavedTheme() {
        const saved = localStorage.getItem('mizu_theme');
        if(saved && this.themes.includes(saved)) { 
            this.currentThemeIndex = this.themes.indexOf(saved); 
            this.applyTheme(this.currentThemeIndex); 
        } else this.applyTheme(0);
    },

    loadFromURL() {
        let hash = window.location.hash.substring(1);
        if(hash) {
            const parts = hash.split('/').filter(p=>p.trim()!=='').map(decodeURIComponent);
            if(parts.length) { this.historyStack = parts; this.render(this.historyStack[this.historyStack.length-1]); return; }
        }
        this.historyStack = ['🏠 INICIO'];
        this.render('🏠 INICIO');
    },

    attachScrollFocusSync() {
        const stage = document.getElementById('stage');
        let ticking = false;
        stage.addEventListener('scroll', () => {
            if(!ticking) {
                requestAnimationFrame(() => {
                    const nodes = document.querySelectorAll('.node');
                    if(!nodes.length) return;
                    let best = null, bestDist = Infinity;
                    const viewMid = stage.scrollTop + stage.clientHeight/2;
                    nodes.forEach(node => {
                        const rect = node.getBoundingClientRect();
                        const mid = rect.top + rect.height/2;
                        const dist = Math.abs(mid - stage.clientHeight/2);
                        if(dist < bestDist) { bestDist = dist; best = node; }
                    });
                    if(best && document.activeElement !== best) best.focus();
                    if(best) this.lastFocusedNode = best;
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
};

window.MizuEngine = MizuEngine;
