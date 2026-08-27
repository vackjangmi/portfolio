(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const mq = window.matchMedia('(max-width: 680px)');
  const sidebar = document.querySelector('.sidebar');
  const topbar = document.querySelector('.topbar');
  if (!sidebar || !topbar) return;

  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = brandSmall.textContent.replace(/v\d+/, 'v16');

  sidebar.id = sidebar.id || 'mobileSidebar';

  const backdrop = document.createElement('div');
  backdrop.id = 'mobileBackdrop';
  backdrop.className = 'mobile-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.appendChild(backdrop);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'mobile-drawer-close';
  closeBtn.setAttribute('aria-label', '도구 메뉴 닫기');
  closeBtn.textContent = '✕';
  document.querySelector('.brand')?.appendChild(closeBtn);

  const menuBtn = document.createElement('button');
  menuBtn.type = 'button';
  menuBtn.className = 'mobile-only mobile-menu-btn';
  menuBtn.setAttribute('aria-label', '도구 메뉴 열기');
  menuBtn.textContent = '☰';
  topbar.insertBefore(menuBtn, topbar.firstChild);

  let drawerOpen = false;
  function setDrawer(open) {
    drawerOpen = Boolean(open && mq.matches);
    sidebar.classList.toggle('mobile-open', drawerOpen);
    backdrop.classList.toggle('open', drawerOpen);
    backdrop.setAttribute('aria-hidden', drawerOpen ? 'false' : 'true');
  }
  menuBtn.addEventListener('click', () => setDrawer(true));
  closeBtn.addEventListener('click', () => setDrawer(false));
  backdrop.addEventListener('click', () => setDrawer(false));

  const viewSection = [...sidebar.querySelectorAll('.section')].find(sec => sec.querySelector('h2')?.textContent.trim() === '보기');
  const desktopZoom = $('zoomRange');
  const desktopZoomLabel = $('zoomLabel');
  const zoomOut = $('zoomOut');
  const zoomIn = $('zoomIn');
  const fitBtn = $('fitBtn');

  if (viewSection && desktopZoom) {
    const panel = document.createElement('div');
    panel.className = 'mobile-zoom-panel';
    panel.innerHTML = `
      <div class="field">
        <label>확대 / 축소</label>
        <div class="mobile-zoom-row">
          <button type="button" data-mobile-zoom="out" aria-label="축소">−</button>
          <input id="mobileZoomRange" type="range" min="10" max="400" value="${desktopZoom.value || 85}">
          <button type="button" data-mobile-zoom="in" aria-label="확대">＋</button>
        </div>
        <div class="mobile-zoom-meta" id="mobileZoomLabel">${desktopZoomLabel?.textContent || '85%'}</div>
        <div class="toolbar" style="margin-top:8px"><button type="button" id="mobileFitBtn">화면 맞춤</button></div>
      </div>`;
    viewSection.insertBefore(panel, viewSection.children[1] || null);
    const mobileZoomRange = panel.querySelector('#mobileZoomRange');
    const mobileZoomLabel = panel.querySelector('#mobileZoomLabel');

    function syncZoomProxy() {
      mobileZoomRange.value = desktopZoom.value;
      mobileZoomLabel.textContent = desktopZoomLabel?.textContent || `${desktopZoom.value}%`;
    }
    panel.querySelector('[data-mobile-zoom="out"]').addEventListener('click', () => zoomOut?.click());
    panel.querySelector('[data-mobile-zoom="in"]').addEventListener('click', () => zoomIn?.click());
    panel.querySelector('#mobileFitBtn').addEventListener('click', () => {
      fitBtn?.click();
      setDrawer(false);
    });
    mobileZoomRange.addEventListener('input', () => {
      desktopZoom.value = mobileZoomRange.value;
      desktopZoom.dispatchEvent(new Event('input', {bubbles:true}));
      syncZoomProxy();
    });
    desktopZoom.addEventListener('input', syncZoomProxy);
    zoomOut?.addEventListener('click', () => setTimeout(syncZoomProxy, 0));
    zoomIn?.addEventListener('click', () => setTimeout(syncZoomProxy, 0));
    fitBtn?.addEventListener('click', () => setTimeout(syncZoomProxy, 0));
    if (desktopZoomLabel) new MutationObserver(syncZoomProxy).observe(desktopZoomLabel, {childList:true, characterData:true, subtree:true});
  }

  $('addRect')?.addEventListener('click', () => { if (mq.matches) setTimeout(() => setDrawer(false), 0); });
  $('addCircle')?.addEventListener('click', () => { if (mq.matches) setTimeout(() => setDrawer(false), 0); });

  function layoutChanged() {
    if (!mq.matches) setDrawer(false);
  }
  mq.addEventListener?.('change', layoutChanged);
  window.addEventListener('resize', layoutChanged);

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawerOpen) {
      e.preventDefault();
      setDrawer(false);
    }
  }, true);

  document.addEventListener('touchmove', e => {
    if (!mq.matches) return;
    if (e.target.closest('.sidebar, .viewport, .scale-preview-scroller, .scale-body')) return;
    e.preventDefault();
  }, {passive:false});
})();
