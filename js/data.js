// ===== FAMILY DATA =====
const FAMILY_MEMBERS = [
  { id: 'eric',    name: 'Eric',   initials: 'ER', color: '#16a34a' },
  { id: 'april',   name: 'April',  initials: 'AP', color: '#0d9488' },
  { id: 'keagen',  name: 'Keagen', initials: 'KE', color: '#2563eb' },
  { id: 'braylon', name: 'Braylon',initials: 'BR', color: '#7c3aed' },
  { id: 'kailee',  name: 'Kailee', initials: 'KA', color: '#374151' },
  { id: 'chloe',   name: 'Chloe',  initials: 'CH', color: '#ec4899' },
  { id: 'family',  name: 'Family', initials: 'FA', color: '#6366f1' },
];

// ===== DATA STORE =====
const Store = {
  // Events
  getEvents() {
    try { return JSON.parse(localStorage.getItem('fc_events') || '[]'); } catch { return []; }
  },
  saveEvents(events) {
    localStorage.setItem('fc_events', JSON.stringify(events));
  },
  addEvent(ev) {
    const events = this.getEvents();
    ev.id = Date.now().toString();
    events.push(ev);
    this.saveEvents(events);
    return ev;
  },
  deleteEvent(id) {
    const events = this.getEvents().filter(e => e.id !== id);
    this.saveEvents(events);
  },
  getEventsForDate(dateStr) {
    return this.getEvents().filter(e => e.date === dateStr);
  },
  getUpcomingEvents(days = 30) {
    const now = new Date();
    const end = new Date(now); end.setDate(end.getDate() + days);
    return this.getEvents()
      .filter(e => { const d = new Date(e.date + 'T00:00:00'); return d >= now && d <= end; })
      .sort((a,b) => a.date.localeCompare(b.date));
  },

  // Shopping
  getShoppingList() {
    try { return JSON.parse(localStorage.getItem('fc_shopping') || '[]'); } catch { return []; }
  },
  saveShoppingList(list) { localStorage.setItem('fc_shopping', JSON.stringify(list)); },
  addShoppingItem(text) {
    const list = this.getShoppingList();
    list.push({ id: Date.now().toString(), text, checked: false });
    this.saveShoppingList(list);
  },
  toggleShoppingItem(id) {
    const list = this.getShoppingList().map(i => i.id === id ? {...i, checked: !i.checked} : i);
    this.saveShoppingList(list);
  },
  deleteShoppingItem(id) {
    this.saveShoppingList(this.getShoppingList().filter(i => i.id !== id));
  },

  // Todos
  getTodos() {
    try { return JSON.parse(localStorage.getItem('fc_todos') || '[]'); } catch { return []; }
  },
  saveTodos(t) { localStorage.setItem('fc_todos', JSON.stringify(t)); },
  addTodo(text, memberId) {
    const todos = this.getTodos();
    todos.push({ id: Date.now().toString(), text, memberId, done: false, created: new Date().toISOString() });
    this.saveTodos(todos);
  },
  toggleTodo(id) {
    const todos = this.getTodos().map(t => t.id === id ? {...t, done: !t.done} : t);
    this.saveTodos(todos);
  },
  deleteTodo(id) { this.saveTodos(this.getTodos().filter(t => t.id !== id)); },

  // Meals
  getMeals() {
    try { return JSON.parse(localStorage.getItem('fc_meals') || '{}'); } catch { return {}; }
  },
  saveMeals(m) { localStorage.setItem('fc_meals', JSON.stringify(m)); },
  setMeal(dateStr, meal) {
    const meals = this.getMeals();
    meals[dateStr] = meal;
    this.saveMeals(meals);
  },
  getMeal(dateStr) { return this.getMeals()[dateStr] || ''; },

  // Member names (user-editable)
  getMemberNames() {
    try { return JSON.parse(localStorage.getItem('fc_members') || 'null'); } catch { return null; }
  },
  saveMemberNames(names) { localStorage.setItem('fc_members', JSON.stringify(names)); },
};

// Apply saved member names
const savedNames = Store.getMemberNames();
if (savedNames) {
  FAMILY_MEMBERS.forEach((m, i) => {
    if (savedNames[m.id]) { m.name = savedNames[m.id].name || m.name; m.initials = savedNames[m.id].initials || m.initials; }
  });
}

function getMember(id) {
  return FAMILY_MEMBERS.find(m => m.id === id) || { name: 'Family', initials: 'FA', color: '#6366f1' };
}

function todayStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function formatDateStr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ===== AVATAR / PHOTO STORAGE =====
// Photos are stored as base64 data URLs in localStorage
const AvatarStore = {
  getPhoto(memberId) {
    try { return localStorage.getItem('fc_photo_' + memberId) || null; } catch { return null; }
  },
  savePhoto(memberId, dataUrl) {
    try { localStorage.setItem('fc_photo_' + memberId, dataUrl); return true; }
    catch(e) {
      // localStorage can hit quota with large images — warn gracefully
      console.warn('Photo save failed (storage quota?):', e);
      return false;
    }
  },
  deletePhoto(memberId) {
    localStorage.removeItem('fc_photo_' + memberId);
  },
};

// Helper: render an avatar element (img if photo exists, initials circle otherwise)
function avatarHTML(memberId, size = 26, extraStyle = '') {
  const m = getMember(memberId);
  const photo = AvatarStore.getPhoto(memberId);
  if (photo) {
    return `<img src="${photo}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;${extraStyle}" alt="${m.name}">`;
  }
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${m.color};display:flex;align-items:center;justify-content:center;font-size:${Math.round(size*0.38)}px;font-weight:700;color:white;flex-shrink:0;${extraStyle}">${m.initials}</div>`;
}

// ===== TIME FORMATTING =====
// Converts 24hr "HH:MM" to 12hr "H:MM AM/PM"
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return hour + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}
