(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const mq = window.matchMedia('(max-width: 680px)');

  function init() {
    const sidebar = document.querySelector('.sidebar');
    const topbar = document.querySelector('.topbar');
    const viewport = document.querySelector('.viewport');
    const canvas = byId('canvas');
    const desktopZoom = byId('zoomRange');
    const desktopZoomLabel = byId('zoomLabel');
    if (!sidebar || !topbar || !viewport || !canvas || !desktopZoom) {
      console.error('[floorplan mobile] required editor elements not found');
      return;
    }

    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = brandSmall.textContent.replace(/v\d+/, 'v17');

    sidebar.id = sidebar.id || 'mobileSidebar';
    const backdrop = document.createElement('div');
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
    menuBtn.innerHTML = '<span aria-hidden="true">☰</span><span>도구</span>';
    topbar.insertBefore(menuBtn, topbar.firstChild);

    let drawerOpen = false;
    function setDrawer(open) {
      drawerOpen = Boolean(open && mq.matches);
      sidebar.classList.toggle('mobile-open', drawerOpen);
      backdrop.classList.toggle('open', drawerOpen);
      backdrop.setAttribute('aria-hidden', drawerOpen ? 'false' : 'true');
      menuBtn.setAttribute('aria-expanded', drawerOpen ? 'true' : 'false');
    }
    menuBtn.addEventListener('click', () => setDrawer(!drawerOpen));
    closeBtn.addEventListener('click', () => setDrawer(false));
    backdrop.addEventListener('click', () => setDrawer(false));

    const quick = document.createElement('div');
    quick.className = 'mobile-quick-tools';
    quick.innerHTML = `
      <h2>빠른 도구</h2>
      <div class="mobile-zoom-row">
        <button type="button" data-z="out" aria-label="축소">−</button>
        <input id="mobileZoomRange" type="range" min="10" max="400" value="${desktopZoom.value || 85}" aria-label="확대 축소">
        <button type="button" data-z="in" aria-label="확대">＋</button>
      </div>
      <div class="mobile-zoom-meta" id="mobileZoomLabel">${desktopZoomLabel?.textContent || '85%'}</div>
      <div class="mobile-quick-actions">
        <button type="button" data-action="fit">화면 맞춤</button>
        <button type="button" data-action="rect">＋ 사각형 가구</button>
        <button type="button" data-action="circle">＋ 원형 가구</button>
        <button type="button" data-action="measure">거리 재기</button>
      </div>`;
    const brand = document.querySelector('.brand');
    if (brand?.nextSibling) sidebar.insertBefore(quick, brand.nextSibling); else sidebar.appendChild(quick);

    const mobileZoomRange = quick.querySelector('#mobileZoomRange');
    const mobileZoomLabel = quick.querySelector('#mobileZoomLabel');
    function syncZoomProxy() {
      mobileZoomRange.value = desktopZoom.value;
      mobileZoomLabel.textContent = desktopZoomLabel?.textContent || `${desktopZoom.value}%`;
    }
    function setZoomPercent(percent) {
      desktopZoom.value = Math.max(10, Math.min(400, Math.round(percent)));
      desktopZoom.dispatchEvent(new Event('input', {bubbles: true}));
      syncZoomProxy();
    }
    quick.querySelector('[data-z="out"]').addEventListener('click', () => setZoomPercent(Number(desktopZoom.value) - 10));
    quick.querySelector('[data-z="in"]').addEventListener('click', () => setZoomPercent(Number(desktopZoom.value) + 10));
    mobileZoomRange.addEventListener('input', () => setZoomPercent(Number(mobileZoomRange.value)));
    quick.querySelector('[data-action="fit"]').addEventListener('click', () => { byId('fitBtn')?.click(); syncZoomProxy(); setDrawer(false); });
    quick.querySelector('[data-action="rect"]').addEventListener('click', () => { byId('addRect')?.click(); setDrawer(false); });
    quick.querySelector('[data-action="circle"]').addEventListener('click', () => { byId('addCircle')?.click(); setDrawer(false); });
    quick.querySelector('[data-action="measure"]').addEventListener('click', () => { byId('measureBtn')?.click(); setDrawer(false); });
    desktopZoom.addEventListener('input', syncZoomProxy);
    if (desktopZoomLabel) new MutationObserver(syncZoomProxy).observe(desktopZoomLabel, {childList:true,characterData:true,subtree:true});

    let pinch = null;
    const touchDistance = touches => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    viewport.addEventListener('touchstart', e => {
      if (!mq.matches || e.touches.length !== 2) return;
      pinch = {distance: touchDistance(e.touches), zoom: Number(desktopZoom.value) || 100};
      e.preventDefault();
      e.stopPropagation();
    }, {passive:false, capture:true});
    viewport.addEventListener('touchmove', e => {
      if (!pinch || e.touches.length !== 2) return;
      const d = touchDistance(e.touches);
      if (pinch.distance > 0) setZoomPercent(pinch.zoom * d / pinch.distance);
      e.preventDefault();
      e.stopPropagation();
    }, {passive:false, capture:true});
    const endPinch = e => { if (!e.touches || e.touches.length < 2) pinch = null; };
    viewport.addEventListener('touchend', endPinch, {passive:true,capture:true});
    viewport.addEventListener('touchcancel', () => { pinch = null; }, {passive:true,capture:true});

    const scaleScroller = byId('scalePreviewScroller');
    const scaleZoomRange = byId('scaleZoomRange');
    if (scaleScroller && scaleZoomRange) {
      let scalePinch = null;
      const setScaleZoom = percent => {
        scaleZoomRange.value = Math.max(25, Math.min(400, Math.round(percent)));
        scaleZoomRange.dispatchEvent(new Event('input', {bubbles:true}));
      };
      scaleScroller.addEventListener('touchstart', e => {
        if (e.touches.length !== 2) return;
        scalePinch = {distance:touchDistance(e.touches), zoom:Number(scaleZoomRange.value)||100};
        e.preventDefault(); e.stopPropagation();
      }, {passive:false,capture:true});
      scaleScroller.addEventListener('touchmove', e => {
        if (!scalePinch || e.touches.length !== 2) return;
        setScaleZoom(scalePinch.zoom * touchDistance(e.touches) / scalePinch.distance);
        e.preventDefault(); e.stopPropagation();
      }, {passive:false,capture:true});
      scaleScroller.addEventListener('touchend', e => { if (e.touches.length < 2) scalePinch = null; }, {passive:true,capture:true});
      scaleScroller.addEventListener('touchcancel', () => { scalePinch = null; }, {passive:true,capture:true});
    }

    mq.addEventListener?.('change', () => { if (!mq.matches) setDrawer(false); });
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && drawerOpen) { e.preventDefault(); setDrawer(false); } }, true);
    document.addEventListener('touchmove', e => {
      if (!mq.matches) return;
      if (e.target.closest('.sidebar,.viewport,.scale-preview-scroller,.scale-body')) return;
      e.preventDefault();
    }, {passive:false});

    requestAnimationFrame(() => {
      syncZoomProxy();
      if (mq.matches) byId('fitBtn')?.click();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
