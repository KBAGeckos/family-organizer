// ===== GOOGLE CALENDAR INTEGRATION =====
// When a family member connects their Google Calendar on their device,
// their events are saved to Supabase so ALL family devices can see them.

const GCAL_CLIENT_ID = '633199279003-gaugl7eo8cnuhj0563ge5332pbul5d0j.apps.googleusercontent.com';
const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email';
const GCAL_STORAGE_KEY = 'fc_gcal_tokens';
// FAMILY_ID is defined in db.js

// ===== TOKEN STORAGE (device-local, just for fetching) =====
function getGCalTokens() {
  try { return JSON.parse(localStorage.getItem(GCAL_STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveGCalTokens(t) { localStorage.setItem(GCAL_STORAGE_KEY, JSON.stringify(t)); }

function getTokenForMember(memberId) {
  const tokens = getGCalTokens();
  const t = tokens[memberId];
  if (!t) return null;
  if (Date.now() > t.expiry) { disconnectGCal(memberId); return null; }
  return t.token;
}

function isGCalConnected(memberId) { return !!getTokenForMember(memberId); }
function getGCalEmail(memberId) { return getGCalTokens()[memberId]?.email || null; }

// ===== CONNECT =====
function connectGCal(memberId, onSuccess) {
  if (!window.google?.accounts?.oauth2) {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => _doGCalAuth(memberId, onSuccess);
    document.head.appendChild(script);
  } else {
    _doGCalAuth(memberId, onSuccess);
  }
}

function _doGCalAuth(memberId, onSuccess) {
  const client = google.accounts.oauth2.initTokenClient({
    client_id: GCAL_CLIENT_ID,
    scope: GCAL_SCOPE,
    callback: async (response) => {
      console.log('GCal auth callback fired', response);
      if (response.error) { console.warn('GCal auth error:', response.error); return; }
      if (!response.access_token) { console.warn('GCal: no access token in response'); return; }

      let email = '';
      try {
        const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` }
        });
        const p = await r.json();
        email = p.email || '';
        console.log('GCal user email:', email);
      } catch(e) { console.warn('GCal profile fetch error:', e); }

      // Save token locally for this device to use for fetching
      const tokens = getGCalTokens();
      tokens[memberId] = {
        token: response.access_token,
        expiry: Date.now() + (response.expires_in * 1000),
        email,
        connectedAt: new Date().toISOString()
      };
      saveGCalTokens(tokens);
      console.log(`✅ Google Calendar connected for ${memberId} (${email})`);

      // Immediately fetch and push to Supabase so ALL devices see the events
      console.log('Starting syncGCalToSupabase for', memberId);
      await syncGCalToSupabase(memberId);
      console.log('syncGCalToSupabase complete for', memberId);

      if (onSuccess) onSuccess(email);
    }
  });
  client.requestAccessToken();
}

// ===== DISCONNECT =====
async function disconnectGCal(memberId) {
  const tokens = getGCalTokens();
  delete tokens[memberId];
  saveGCalTokens(tokens);
  // Remove this member's Google events from Supabase too
  const db = getSupabase();
  if (db) {
    await db.from('gcal_events').delete()
      .eq('family_id', FAMILY_ID)
      .eq('member_id', memberId);
  }
}

// ===== FETCH FROM GOOGLE AND SAVE TO SUPABASE =====
async function syncGCalToSupabase(memberId) {
  const token = getTokenForMember(memberId);
  if (!token) return;

  const db = getSupabase();
  if (!db) { console.warn('No Supabase connection — GCal events only stored locally'); return; }

  const now = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 30);
  const end = new Date(now); end.setDate(end.getDate() + 120); // 4 months ahead

  const params = new URLSearchParams({
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '500',
  });

  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.status === 401) { disconnectGCal(memberId); return; }

    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      console.log(`ℹ️ No Google Calendar events found for ${memberId}`);
      return;
    }

    console.log(`📅 Syncing ${data.items.length} Google Calendar events for ${memberId} to Supabase...`);

    // Convert to our format
    const events = data.items
      .filter(item => item.status !== 'cancelled' && item.start)
      .map(item => {
        const isAllDay = !!item.start.date;
        const dateStr = isAllDay
          ? item.start.date
          : (item.start.dateTime || '').split('T')[0];
        const timeStr = isAllDay
          ? ''
          : (item.start.dateTime || '').split('T')[1]?.substring(0, 5) || '';
        return {
          id: `gcal_${memberId}_${item.id}`,
          family_id: FAMILY_ID,
          member_id: memberId,
          title: item.summary || '(No title)',
          date: dateStr,
          time: timeStr || null,
          note: item.location || item.description || null,
          gcal_link: item.htmlLink || null,
          updated_at: new Date().toISOString(),
        };
      })
      .filter(e => e.date);

    // Delete old events for this member then insert fresh ones
    await db.from('gcal_events').delete()
      .eq('family_id', FAMILY_ID)
      .eq('member_id', memberId);

    // Insert in batches of 100
    for (let i = 0; i < events.length; i += 100) {
      const batch = events.slice(i, i + 100);
      const { error } = await db.from('gcal_events').insert(batch);
      if (error) console.warn('GCal insert error:', error);
    }

    console.log(`✅ Synced ${events.length} events for ${memberId} to Supabase — all devices will now see them!`);

    // Refresh the local cache
    _gcalCache = [];
    _gcalCacheTime = 0;
    await getGCalEvents(true);

  } catch(e) {
    console.warn('syncGCalToSupabase error:', e);
  }
}

// ===== READ FROM SUPABASE (used by all devices) =====
async function fetchGCalEventsFromSupabase() {
  const db = getSupabase();
  if (!db) return [];
  const { data, error } = await db.from('gcal_events')
    .select('*')
    .eq('family_id', FAMILY_ID);
  if (error) { console.warn('fetchGCalEventsFromSupabase error:', error); return []; }
  return (data || []).map(r => ({
    id: r.id,
    title: r.title,
    date: r.date,
    time: r.time || '',
    memberId: r.member_id,
    note: r.note || '',
    source: 'google',
    gcalLink: r.gcal_link || '',
  }));
}

// ===== CACHE =====
let _gcalCache = [];
let _gcalCacheTime = 0;

async function getGCalEvents(forceRefresh = false) {
  const CACHE_MS = 5 * 60 * 1000; // 5 min cache
  if (!forceRefresh && Date.now() - _gcalCacheTime < CACHE_MS && _gcalCache.length > 0) {
    return _gcalCache;
  }
  // All devices read from Supabase — no token needed!
  _gcalCache = await fetchGCalEventsFromSupabase();
  _gcalCacheTime = Date.now();
  console.log(`✅ GCal events from Supabase: ${_gcalCache.length} event(s)`);
  return _gcalCache;
}

// ===== AUTO-RESYNC =====
// If this device has a connected member, re-sync to Supabase every 15 min
// so work schedules stay current for everyone
async function autoResync() {
  const tokens = getGCalTokens();
  const connectedMembers = Object.keys(tokens);
  for (const memberId of connectedMembers) {
    await syncGCalToSupabase(memberId);
  }
}
setInterval(autoResync, 15 * 60 * 1000);
