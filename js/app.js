// ===== APP INIT =====

async function init() {
  const now = new Date();
  document.getElementById('header-date').textContent = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  // Build member filter buttons
  const filter = document.getElementById('member-filter');
  filter.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = 'member-btn active';
  allBtn.dataset.member = 'all';
  allBtn.onclick = function() { filterMember(this, 'all'); };
  allBtn.innerHTML = `<span class="mbtn-avatar" style="background:#6366f1;font-size:10px">All</span>Everyone`;
  filter.appendChild(allBtn);

  FAMILY_MEMBERS.filter(m => m.id !== 'family').forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'member-btn';
    btn.dataset.member = m.id;
    btn.onclick = function() { filterMember(this, m.id); };
    btn.innerHTML = `${avatarHTML(m.id, 24)}<span style="margin-left:4px">${m.name}</span>`;
    filter.appendChild(btn);
  });

  // Populate event modal member dropdown
  const sel = document.getElementById('ev-member');
  sel.innerHTML = '<option value="family">Whole Family</option>';
  FAMILY_MEMBERS.filter(m => m.id !== 'family').forEach(m => {
    sel.innerHTML += `<option value="${m.id}">${m.name}</option>`;
  });

  document.getElementById('ev-date').value = todayStr();

  // Sync all profile photos from Supabase on startup
  await DB.syncAllPhotos();

  // Start realtime — any change on any device triggers a full refresh
  initRealtime(async () => {
    await renderCalendar();
    await renderTodayAgenda();
    await buildTicker();
    await updateQuickStats();
    showSyncStatus(true);
  });

  // Check connection
  const db = getSupabase();
  showSyncStatus(!!db);

  await renderCalendar();
  await renderTodayAgenda();
  await buildTicker();
  await updateQuickStats();
}

// ===== AGENDA =====
async function renderTodayAgenda() {
  const today = todayStr();
  const events = (await DB.getEventsForDate(today)).filter(e => activeFilter === 'all' || e.memberId === activeFilter);
  const list = document.getElementById('agenda-list');
  if (events.length === 0) {
    list.innerHTML = '<div class="no-events">No events today — enjoy the day! 🎉</div>';
    return;
  }
  list.innerHTML = events
    .sort((a,b) => (a.time||'').localeCompare(b.time||''))
    .map(ev => {
      const m = getMember(ev.memberId);
      return `<div class="agenda-item ${ev.source==='google'?'gcal-event':''}" onclick="openDayModal('${ev.date}')">
        <div class="agenda-color-bar" style="background:${m.color}"></div>
        <div class="agenda-item-info">
          <div class="agenda-item-title">${ev.title}${ev.source==='google'?'<span class="gcal-badge">GCAL</span>':''}</div>
          <div class="agenda-item-meta">${ev.time ? formatTime(ev.time) : 'All day'} · ${m.name}</div>
        </div>
        ${avatarHTML(ev.memberId, 28)}
      </div>`;
    }).join('');
}

// ===== SCROLLING TICKER =====
async function buildTicker() {
  const upcoming = await DB.getUpcomingEvents(60);
  const inner = document.getElementById('ticker-inner');
  if (!inner) return;
  if (upcoming.length === 0) {
    inner.innerHTML = '<div class="ticker-item">No upcoming events — add some! 📅</div>';
    inner.style.animation = 'none';
    return;
  }
  inner.style.animation = '';
  const items = upcoming.slice(0, 20).map(ev => {
    const m = getMember(ev.memberId);
    const label = isToday(ev.date) ? 'Today' : isTomorrow(ev.date) ? 'Tomorrow' : formatDateStr(ev.date);
    return `<div class="ticker-item">
      <div class="ticker-dot" style="background:${m.color}"></div>
      <strong>${ev.title}</strong> — ${label}${ev.time ? ' at ' + formatTime(ev.time) : ''} · ${m.name}
    </div><span class="ticker-sep">·</span>`;
  }).join('');
  inner.innerHTML = items + items;
  const speed = Math.max(20, upcoming.length * 4);
  inner.style.animationDuration = speed + 's';
}

function isToday(dateStr) { return dateStr === todayStr(); }
function isTomorrow(dateStr) {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  return dateStr === tomorrow.toISOString().split('T')[0];
}

// ===== QUICK STATS =====
async function updateQuickStats() {
  const meal = await DB.getMeal(todayStr());
  document.getElementById('tonight-meal').textContent = meal ? 'Tonight: ' + meal : 'Tap to plan';
  const shopping = (await DB.getShoppingList()).filter(i => !i.checked).length;
  document.getElementById('shopping-count').textContent = shopping + ' item' + (shopping !== 1 ? 's' : '');
  const todos = (await DB.getTodos()).filter(t => !t.done).length;
  document.getElementById('todo-count').textContent = todos + ' open';
}

// ===== ADD EVENT MODAL =====
function openAddEvent(prefillDate) {
  const dateField = document.getElementById('ev-date');
  dateField.value = prefillDate || todayStr();
  document.getElementById('ev-title').value = '';
  document.getElementById('ev-time').value = '';
  document.getElementById('ev-note').value = '';
  document.getElementById('add-modal').classList.add('open');
  document.getElementById('modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('ev-title').focus(), 60);
}

function closeModal() {
  document.getElementById('add-modal').classList.remove('open');
  document.getElementById('day-modal').classList.remove('open');
  document.getElementById('modal-overlay').classList.remove('open');
}

async function saveEvent() {
  const title = document.getElementById('ev-title').value.trim();
  if (!title) { document.getElementById('ev-title').focus(); return; }
  await DB.addEvent({
    title,
    date: document.getElementById('ev-date').value,
    time: document.getElementById('ev-time').value,
    memberId: document.getElementById('ev-member').value,
    note: document.getElementById('ev-note').value.trim(),
  });
  document.getElementById('ev-title').value = '';
  document.getElementById('ev-time').value = '';
  document.getElementById('ev-note').value = '';
  closeModal();
  await renderCalendar();
  await renderTodayAgenda();
  await buildTicker();
  await updateQuickStats();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('add-modal').classList.contains('open')) saveEvent();
  if (e.key === 'Escape') closeModal();
});

init();

// ===== DESKTOP DRAG SCROLL FOR MEMBER FILTER =====
(function() {
  const slider = document.getElementById('member-filter');
  if (!slider) return;
  let isDown = false, startX, scrollLeft;
  slider.addEventListener('mousedown', e => {
    isDown = true;
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
  });
  window.addEventListener('mouseup', () => { isDown = false; });
  slider.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    slider.scrollLeft = scrollLeft - (x - startX);
  });
  // Mouse wheel horizontal scroll
  slider.addEventListener('wheel', e => {
    e.preventDefault();
    slider.scrollLeft += e.deltaY;
  }, { passive: false });
})();
