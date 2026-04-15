// ===== CALENDAR =====
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let activeFilter = 'all';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

async function renderCalendar() {
  const today = new Date();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startDow = firstDay.getDay();
  const events = await DB.getEvents();

  document.getElementById('cal-title').textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

  const container = document.getElementById('cal-days');
  container.innerHTML = '';

  const prevMonthLast = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    container.appendChild(makeCell(prevMonthLast - i, true, null));
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayEvents = events.filter(e => e.date === dateStr && (activeFilter === 'all' || e.memberId === activeFilter));
    const isToday = (today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === d);
    container.appendChild(makeCell(d, false, dateStr, dayEvents, isToday));
  }

  const totalCells = startDow + lastDay.getDate();
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    container.appendChild(makeCell(i, true, null));
  }
}

function makeCell(num, otherMonth, dateStr, events, isToday) {
  const cell = document.createElement('div');
  cell.className = 'cal-cell' + (otherMonth ? ' other-month' : '') + (isToday ? ' today' : '');
  if (events && events.length > 0) cell.classList.add('has-events');

  const numDiv = document.createElement('div');
  numDiv.className = 'cal-num';
  numDiv.textContent = num;
  cell.appendChild(numDiv);

  if (events && events.length > 0) {
    const dots = document.createElement('div');
    dots.className = 'cal-dots';
    events.slice(0, 4).forEach(ev => {
      const m = getMember(ev.memberId);
      const dot = document.createElement('div');
      dot.className = 'cal-dot';
      dot.style.background = m.color;
      dots.appendChild(dot);
    });
    cell.appendChild(dots);
  }

  if (dateStr) {
    cell.onclick = () => openDayModal(dateStr);
  }
  return cell;
}

async function changeMonth(dir) {
  currentMonth += dir;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  await renderCalendar();
}

async function filterMember(btn, memberId) {
  activeFilter = memberId;
  document.querySelectorAll('.member-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  await renderCalendar();
  await renderTodayAgenda();
}

async function openDayModal(dateStr) {
  const events = (await DB.getEventsForDate(dateStr)).filter(e => activeFilter === 'all' || e.memberId === activeFilter);
  document.getElementById('day-modal-title').textContent = formatDateStr(dateStr);
  document.getElementById('day-modal').dataset.date = dateStr;
  const body = document.getElementById('day-modal-body');
  if (events.length === 0) {
    body.innerHTML = '<div class="no-events">No events this day.</div>';
  } else {
    body.innerHTML = events.map(ev => {
      const m = getMember(ev.memberId);
      return `<div class="agenda-item">
        <div class="agenda-color-bar" style="background:${m.color}"></div>
        <div class="agenda-item-info">
          <div class="agenda-item-title">${ev.title}</div>
          <div class="agenda-item-meta">${ev.time ? ev.time + ' · ' : ''}${m.name}${ev.note ? ' · ' + ev.note : ''}</div>
        </div>
        ${avatarHTML(ev.memberId, 28)}
        <button onclick="deleteEventAndRefresh('${ev.id}')" style="font-size:16px;color:rgba(255,255,255,0.3);padding:4px 8px;">✕</button>
      </div>`;
    }).join('');
  }
  document.getElementById('day-modal').classList.add('open');
  document.getElementById('modal-overlay').classList.add('open');
}

function closeDayModal() {
  document.getElementById('day-modal').classList.remove('open');
  document.getElementById('modal-overlay').classList.remove('open');
}

async function deleteEventAndRefresh(id) {
  await DB.deleteEvent(id);
  await renderCalendar();
  await renderTodayAgenda();
  await buildTicker();
  closeDayModal();
}
