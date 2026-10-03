/* Shared presentation helpers. No account, payment or member data mutations. */
function cbEscape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}
function cbArg(value) { return cbEscape(JSON.stringify(String(value == null ? '' : value))); }
const cbDialogs = [];
let cbBodyOverflow = '', cbAppInert = false;
function cbPresentDialog(overlay) {
    const panel = overlay.firstElementChild;
    if (!panel || !panel.querySelector('button,input,a,select,textarea')) {
        document.body.appendChild(overlay);
        return;
    }
    const previousFocus = document.activeElement;
    if (!cbDialogs.length) {
        cbBodyOverflow = document.body.style.overflow;
        cbAppInert = document.getElementById('app').inert;
        document.body.style.overflow = 'hidden';
        document.getElementById('app').inert = true;
    }
    cbDialogs.forEach(d => d.inert = true);
    overlay.classList.add('cb-dialog-overlay');
    panel.classList.add('cb-dialog-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    const title = panel.querySelector('h2,h3');
    panel.setAttribute('aria-label', title ? title.textContent : 'Chibwenzi');
    panel.tabIndex = -1;
    cbDialogs.push(overlay);
    document.body.appendChild(overlay);
    panel.focus({ preventScroll:true });
    const observer = new MutationObserver(() => {
        if (overlay.isConnected) return;
        observer.disconnect();
        const index = cbDialogs.indexOf(overlay);
        if (index >= 0) cbDialogs.splice(index,1);
        const top = cbDialogs[cbDialogs.length-1];
        if (top) { top.inert = false; top.firstElementChild.focus({ preventScroll:true }); }
        else {
            document.body.style.overflow = cbBodyOverflow;
            document.getElementById('app').inert = cbAppInert;
            if (previousFocus && previousFocus.isConnected) previousFocus.focus({ preventScroll:true });
        }
    });
    observer.observe(document.body,{childList:true});
}
document.addEventListener('keydown', event => {
    const top = cbDialogs[cbDialogs.length-1];
    if (!top) return;
    if (event.key === 'Escape') {
        const pending = top.querySelector('#payS2');
        if (pending && !pending.classList.contains('hidden')) return;
        event.preventDefault();top.remove();return;
    }
    if (event.key !== 'Tab') return;
    const controls = Array.from(top.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select,textarea,[tabindex="0"]')).filter(el => el.getClientRects().length);
    if (!controls.length) { event.preventDefault();top.firstElementChild.focus();return; }
    const first = controls[0],last = controls[controls.length-1],active = document.activeElement;
    if (event.shiftKey && (active===first || !controls.includes(active))) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && (active===last || !controls.includes(active))) {event.preventDefault();first.focus();}
});
function cbProfileImage(button) {
    const sheet = button.closest('.cb-profile-sheet');
    const image = sheet.querySelector('.cb-profile-main-image');
    image.src = button.dataset.photo;
    sheet.querySelectorAll('.cb-photo-choice').forEach(el => el.setAttribute('aria-pressed',String(el===button)));
}

/* Presentation-only brand refresh; does not read or write member data. */
function cbRefreshBrand() {
    const root = document.getElementById('app');
    if (!root) return;
    root.querySelectorAll('img[src="assets/chibwenzi-mark.png"]').forEach(image => {
        image.src = 'assets/chibwenzi-mark-v2.svg';
    });
    root.querySelectorAll('.cb-logo>span').forEach(wordmark => {
        if (wordmark.firstChild?.nodeType === Node.TEXT_NODE && wordmark.firstChild.textContent !== 'chibwenzi') {
            wordmark.firstChild.textContent = 'chibwenzi';
        }
        const tagline = wordmark.querySelector('small');
        if (tagline && tagline.textContent !== 'REAL PEOPLE. REAL CONNECTIONS.') {
            tagline.textContent = 'REAL PEOPLE. REAL CONNECTIONS.';
        }
    });
    const lead = root.querySelector('.cb-hero-lead');
    const copy = 'Meet genuine people across Zambia looking for a relationship. Start with a hello and see where it takes you.';
    if (lead && lead.textContent !== copy) lead.textContent = copy;
    const agePanel = root.querySelector('.cb-age-panel');
    if (agePanel && !root.querySelector('.cb-free-signup')) {
        const offer = document.createElement('p');
        offer.className = 'cb-free-signup';
        offer.append('Join for free ');
        const age = document.createElement('span');
        age.textContent = '· Adults 18+';
        offer.append(age);
        agePanel.before(offer);
    }
}
const cbBrandRoot = document.getElementById('app');
if (cbBrandRoot) {
    cbRefreshBrand();
    const cbBrandObserver = new MutationObserver(() => {
        cbBrandObserver.disconnect();
        cbRefreshBrand();
        cbBrandObserver.observe(cbBrandRoot, { childList: true, subtree: true });
    });
    cbBrandObserver.observe(cbBrandRoot, { childList: true, subtree: true });
}

// Load administration integration after the member application has initialized.
window.addEventListener("load", () => { const s=document.createElement("script"); s.src="admin-bridge.js?v=2"; document.body.append(s); });
