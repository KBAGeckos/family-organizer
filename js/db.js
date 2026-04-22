// ===== DATABASE LAYER =====
// Wraps Supabase calls. Falls back to localStorage if offline.
// All functions are async and return the same shape as the old Store.

let _supabase = null;
let _isOnline = false;

function getSupabase() {
  if (_supabase) return _supabase;
  if (typeof supabase === 'undefined') return null;
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') return null;
  try {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: { params: { eventsPerSecond: 10 } }
    });
    _isOnline = true;
  } catch(e) { console.warn('Supabase init failed:', e); }
  return _supabase;
}

// ===== FAMILY ID =====
// All data is scoped to this family so multiple families can use the same DB
const FAMILY_ID = 'scott-family';

// ===== REALTIME SUBSCRIPTIONS =====
// When any device changes data, all other devices update instantly
const _listeners = {};

function subscribeToTable(table, callback) {
  const db = getSupabase();
  if (!db) return;
  if (_listeners[table]) return; // already subscribed
  _listeners[table] = db
    .channel('db-' + table)
    .on('postgres_changes',
      { event: '*', schema: 'public', table, filter: `family_id=eq.${FAMILY_ID}` },
      () => callback()
    )
    .subscribe();
}

// ===== EVENTS =====
const DB = {
  // ---- EVENTS ----
  async getEvents() {
    const db = getSupabase();
    let localEvents = [];
    if (!db) {
      localEvents = Store.getEvents();
    } else {
      const { data, error } = await db.from('events').select('*').eq('family_id', FAMILY_ID).order('date');
      if (error) { console.warn('getEvents error:', error); localEvents = Store.getEvents(); }
      else {
        Store.saveEvents(data.map(r => ({ id: r.id, title: r.title, date: r.date, time: r.time, memberId: r.member_id, note: r.note || '' })));
        localEvents = data.map(r => ({ id: r.id, title: r.title, date: r.date, time: r.time, memberId: r.member_id, note: r.note || '' }));
      }
    }
    // Merge with Google Calendar events if any members are connected
    let gcalEvents = [];
    if (typeof getGCalEvents === 'function') {
      try { gcalEvents = await getGCalEvents(); } catch(e) {}
    }
    return [...localEvents, ...gcalEvents];
  },

  async addEvent(ev) {
    const db = getSupabase();
    const id = Date.now().toString();
    const row = {
      id, family_id: FAMILY_ID, title: ev.title, date: ev.date,
      time: ev.time || null, member_id: ev.memberId, note: ev.note || null
    };
    if (!db) { Store.addEvent(ev); return; }
    const { error } = await db.from('events').insert(row);
    if (error) { console.warn('addEvent error:', error); Store.addEvent(ev); }
  },

  async deleteEvent(id) {
    const db = getSupabase();
    if (!db) { Store.deleteEvent(id); return; }
    const { error } = await db.from('events').delete().eq('id', id).eq('family_id', FAMILY_ID);
    if (error) { console.warn('deleteEvent error:', error); Store.deleteEvent(id); }
  },

  async getEventsForDate(dateStr) {
    const events = await this.getEvents();
    return events.filter(e => e.date === dateStr);
  },

  async getUpcomingEvents(days = 60) {
    const events = await this.getEvents();
    const now = new Date();
    const end = new Date(now); end.setDate(end.getDate() + days);
    return events.filter(e => {
      const d = new Date(e.date + 'T00:00:00');
      return d >= now && d <= end;
    }).sort((a,b) => a.date.localeCompare(b.date));
  },

  // ---- SHOPPING ----
  async getShoppingList() {
    const db = getSupabase();
    if (!db) return Store.getShoppingList();
    const { data, error } = await db.from('shopping').select('*').eq('family_id', FAMILY_ID).order('created_at');
    if (error) { return Store.getShoppingList(); }
    return data.map(r => ({ id: r.id, text: r.text, checked: r.checked }));
  },

  async addShoppingItem(text) {
    const db = getSupabase();
    const id = Date.now().toString();
    if (!db) { Store.addShoppingItem(text); return; }
    await db.from('shopping').insert({ id, family_id: FAMILY_ID, text, checked: false });
  },

  async toggleShoppingItem(id) {
    const db = getSupabase();
    if (!db) { Store.toggleShoppingItem(id); return; }
    const list = await this.getShoppingList();
    const item = list.find(i => i.id === id);
    if (!item) return;
    await db.from('shopping').update({ checked: !item.checked }).eq('id', id).eq('family_id', FAMILY_ID);
  },

  async deleteShoppingItem(id) {
    const db = getSupabase();
    if (!db) { Store.deleteShoppingItem(id); return; }
    await db.from('shopping').delete().eq('id', id).eq('family_id', FAMILY_ID);
  },

  async clearCheckedShopping() {
    const db = getSupabase();
    if (!db) { const list = Store.getShoppingList().filter(i => !i.checked); Store.saveShoppingList(list); return; }
    await db.from('shopping').delete().eq('family_id', FAMILY_ID).eq('checked', true);
  },

  // ---- TODOS ----
  async getTodos() {
    const db = getSupabase();
    if (!db) return Store.getTodos();
    const { data, error } = await db.from('todos').select('*').eq('family_id', FAMILY_ID).order('created_at');
    if (error) { return Store.getTodos(); }
    return data.map(r => ({ id: r.id, text: r.text, memberId: r.member_id, done: r.done }));
  },

  async addTodo(text, memberId) {
    const db = getSupabase();
    const id = Date.now().toString();
    if (!db) { Store.addTodo(text, memberId); return; }
    await db.from('todos').insert({ id, family_id: FAMILY_ID, text, member_id: memberId, done: false });
  },

  async toggleTodo(id) {
    const db = getSupabase();
    if (!db) { Store.toggleTodo(id); return; }
    const todos = await this.getTodos();
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    await db.from('todos').update({ done: !todo.done }).eq('id', id).eq('family_id', FAMILY_ID);
  },

  async deleteTodo(id) {
    const db = getSupabase();
    if (!db) { Store.deleteTodo(id); return; }
    await db.from('todos').delete().eq('id', id).eq('family_id', FAMILY_ID);
  },

  // ---- MEALS ----
  async getMeals() {
    const db = getSupabase();
    if (!db) return Store.getMeals();
    const { data, error } = await db.from('meals').select('*').eq('family_id', FAMILY_ID);
    if (error) { return Store.getMeals(); }
    const meals = {};
    data.forEach(r => { meals[r.date] = r.meal; });
    return meals;
  },

  async getMeal(dateStr) {
    const meals = await this.getMeals();
    return meals[dateStr] || '';
  },

  async setMeal(dateStr, meal) {
    const db = getSupabase();
    if (!db) { Store.setMeal(dateStr, meal); return; }
    await db.from('meals').upsert(
      { family_id: FAMILY_ID, date: dateStr, meal },
      { onConflict: 'family_id,date' }
    );
  },

  // ---- PHOTOS ----
  async getPhoto(memberId) {
    const db = getSupabase();
    if (!db) return AvatarStore.getPhoto(memberId);
    const { data, error } = await db.from('photos')
      .select('photo_data')
      .eq('family_id', FAMILY_ID)
      .eq('member_id', memberId)
      .single();
    if (error || !data) return AvatarStore.getPhoto(memberId); // fallback to local
    // Cache locally for offline/speed
    AvatarStore.savePhoto(memberId, data.photo_data);
    return data.photo_data;
  },

  async savePhoto(memberId, dataUrl) {
    const db = getSupabase();
    // Always save locally first for instant display
    AvatarStore.savePhoto(memberId, dataUrl);
    if (!db) return true;
    const { error } = await db.from('photos').upsert(
      { family_id: FAMILY_ID, member_id: memberId, photo_data: dataUrl, updated_at: new Date().toISOString() },
      { onConflict: 'family_id,member_id' }
    );
    if (error) { console.warn('savePhoto error:', error); return false; }
    console.log('✅ Photo saved to Supabase for', memberId);
    return true;
  },

  async deletePhoto(memberId) {
    const db = getSupabase();
    AvatarStore.deletePhoto(memberId);
    if (!db) return;
    await db.from('photos').delete()
      .eq('family_id', FAMILY_ID)
      .eq('member_id', memberId);
  },

  // Load all photos at startup and cache them locally
  async syncAllPhotos() {
    const db = getSupabase();
    if (!db) return;
    const { data, error } = await db.from('photos')
      .select('member_id, photo_data')
      .eq('family_id', FAMILY_ID);
    if (error || !data) return;
    data.forEach(row => {
      AvatarStore.savePhoto(row.member_id, row.photo_data);
    });
    console.log(`✅ Synced ${data.length} profile photo(s)`);
  },
};

// ===== REALTIME SETUP =====
// Call this once the app loads to listen for changes from other devices
function initRealtime(onUpdate) {
  const db = getSupabase();
  if (!db) return;
  ["events","shopping","todos","meals"].forEach(table => {
    subscribeToTable(table, onUpdate);
  });
  // When any device updates a photo, reload all photos and refresh avatars
  subscribeToTable("photos", async () => {
    await DB.syncAllPhotos();
    onUpdate();
  });
  console.log("✅ Realtime sync active");
}

// ===== CONNECTION STATUS =====
function showSyncStatus(connected) {
  let badge = document.getElementById('sync-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'sync-badge';
    badge.style.cssText = `
      position:fixed;bottom:52px;right:10px;z-index:99;
      padding:3px 9px;border-radius:10px;font-size:10px;font-weight:700;
      font-family:'Nunito Sans',sans-serif;
      transition:all .3s;pointer-events:none;
    `;
    document.body.appendChild(badge);
  }
  if (connected) {
    badge.textContent = '🟢 Synced';
    badge.style.background = 'rgba(16,185,129,0.2)';
    badge.style.color = '#10b981';
    badge.style.border = '1px solid rgba(16,185,129,0.3)';
    setTimeout(() => { if(badge) badge.style.opacity = '0'; }, 3000);
  } else {
    badge.style.opacity = '1';
    badge.textContent = '🔴 Offline';
    badge.style.background = 'rgba(244,63,94,0.2)';
    badge.style.color = '#f43f5e';
    badge.style.border = '1px solid rgba(244,63,94,0.3)';
  }
}
