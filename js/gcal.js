// ===== GOOGLE CALENDAR INTEGRATION =====
// Read-only pull from each family member's Google Calendar
// Client ID scoped to this app only — no write access

const GCAL_CLIENT_ID = '255919092848-9j28vgcocoqh6e3bbhf6l9b94ffcuf1d.apps.googleusercontent.com';
const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const GCAL_STORAGE_KEY = 'fc_gcal_tokens'; // { memberId: { token, expiry, email } }

// ===== TOKEN STORAGE =====
function getGCalTokens() {
  try { return JSON.parse(localStorage.getItem(GCAL_STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveGCalTokens(t) { localStorage.setItem(GCAL_STORAGE_KEY, JSON.stringify(t)); }

function getTokenForMember(memberId) {
  const tokens = getGCalTokens();
  const t = tokens[memberId];
  if (!t) return null;
  // Check if token is expired
  if (Date.now() > t.expiry) { disconnectGCal(memberId); return null; }
  return t.token;
}

function isGCalConnected(memberId) {
  return !!getTokenForMember(memberId);
}

function getGCalEmail(memberId) {
  const tokens = getGCalTokens();
  return tokens[memberId]?.email || null;
}

// ===== CONNECT =====
function connectGCal(memberId, onSuccess) {
  // Load Google Identity Services if not already loaded
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
      if (response.error) {
        console.warn('GCal auth error:', response.error);
        return;
      }
      // Get the user's email to display
      let email = '';
      try {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` }
        });
        const profile = await profileRes.json();
        email = profile.email || '';
      } catch(e) {}

      // Save token with expiry (tokens last 1 hour)
      const tokens = getGCalTokens();
      tokens[memberId] = {
        token: response.access_token,
        expiry: Date.now() + (response.expires_in * 1000),
        email,
        connectedAt: new Date().toISOString()
      };
      saveGCalTokens(tokens);
      console.log(`✅ Google Calendar connected for ${memberId} (${email})`);
      if (onSuccess) onSuccess(email);
    }
  });
  client.requestAccessToken();
}

// ===== DISCONNECT =====
function disconnectGCal(memberId) {
  const tokens = getGCalTokens();
  delete tokens[memberId];
  saveGCalTokens(tokens);
}

// ===== FETCH EVENTS =====
async function fetchGCalEvents(memberId, daysBack = 7, daysAhead = 60) {
  const token = getTokenForMember(memberId);
  if (!token) return [];

  const now = new Date();
  const start = new Date(now); start.setDate(start.getDate() - daysBack);
  const end = new Date(now); end.setDate(end.getDate() + daysAhead);

  const params = new URLSearchParams({
    calendarId: 'primary',
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      // Token expired
      disconnectGCal(memberId);
      return [];
    }

    const data = await res.json();
    if (!data.items) return [];

    // Convert to our event format
    return data.items
      .filter(item => item.status !== 'cancelled')
      .map(item => {
        const isAllDay = !!item.start.date;
        const dateStr = isAllDay
          ? item.start.date
          : item.start.dateTime.split('T')[0];
        const timeStr = isAllDay
          ? ''
          : item.start.dateTime.split('T')[1].substring(0, 5);

        return {
          id: 'gcal_' + item.id,
          title: item.summary || '(No title)',
          date: dateStr,
          time: timeStr,
          memberId: memberId,
          note: item.location || item.description || '',
          source: 'google', // mark as Google Calendar event
          gcalLink: item.htmlLink,
        };
      });
  } catch(e) {
    console.warn('fetchGCalEvents error:', e);
    return [];
  }
}

// ===== FETCH ALL CONNECTED MEMBERS =====
async function fetchAllGCalEvents() {
  const tokens = getGCalTokens();
  const connectedMembers = Object.keys(tokens);
  if (connectedMembers.length === 0) return [];

  const allEvents = await Promise.all(
    connectedMembers.map(memberId => fetchGCalEvents(memberId))
  );
  return allEvents.flat();
}

// Cache for Google Calendar events (refreshed every 15 min)
let _gcalCache = [];
let _gcalCacheTime = 0;

async function getGCalEvents(forceRefresh = false) {
  const CACHE_MS = 15 * 60 * 1000; // 15 minutes
  if (!forceRefresh && Date.now() - _gcalCacheTime < CACHE_MS) {
    return _gcalCache;
  }
  _gcalCache = await fetchAllGCalEvents();
  _gcalCacheTime = Date.now();
  console.log(`✅ Fetched ${_gcalCache.length} Google Calendar event(s)`);
  return _gcalCache;
}

// Refresh every 15 minutes automatically
setInterval(() => getGCalEvents(true), 15 * 60 * 1000);
