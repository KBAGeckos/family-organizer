<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<title>Meals – FamCal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Nunito+Sans:wght@300;400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/main.css">
<link rel="stylesheet" href="../css/weather.css">
<style>
  .meal-edit-input {
    flex: 1;
    background: rgba(255,255,255,0.08);
    border: 1px solid #6366f1;
    border-radius: 10px;
    padding: 6px 10px;
    color: white;
    font-family: inherit;
    font-size: 13px;
    outline: none;
  }
  .meal-save-btn {
    padding: 6px 14px;
    background: #6366f1;
    color: white;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    font-family: inherit;
  }
  .week-nav-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .week-title { font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 15px; }
  .week-btn {
    width: 30px; height: 30px;
    border-radius: 8px;
    background: rgba(255,255,255,0.1);
    color: white; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
  }
  .meal-notes-section { padding: 8px; border-top: 1px solid rgba(255,255,255,0.08); }
  .meal-notes-title { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.4); padding: 4px 4px 8px; }
</style>
</head>
<body class="weather-partly-cloudy">
<div id="weather-bg" class="weather-bg"><div class="weather-layer" id="weather-layer"></div><div class="weather-overlay"></div></div>

<header class="page-header">
  <a href="../index.html" class="back-btn">‹</a>
  <div class="page-title">🍽️ Meal Planner</div>
</header>

<div class="list-section" id="list-section"></div>

<div class="modal-overlay" id="modal-overlay" onclick="closeEdit()"></div>
<div class="modal" id="meal-modal">
  <div class="modal-header">
    <div class="modal-title" id="meal-modal-title">Edit Meal</div>
    <button class="modal-close" onclick="closeEdit()">✕</button>
  </div>
  <div class="modal-body">
    <input type="text" id="meal-input" class="form-input" placeholder="What's for dinner?">
    <div style="font-size:12px;color:rgba(255,255,255,0.4);padding:4px 0">Quick ideas:</div>
    <div id="quick-ideas" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
  </div>
  <div class="modal-footer">
    <button class="btn-cancel" onclick="closeEdit()">Cancel</button>
    <button class="btn-save" onclick="saveMeal()">Save</button>
  </div>
</div>

<script src="../js/data.js"></script>
<script src="../js/weather.js"></script>
<script>
setWeatherBg('partly-cloudy', true);

const MEAL_IDEAS = ['Tacos 🌮','Pizza 🍕','Grilled Chicken','Pasta','Burgers 🍔','Stir Fry','Soup','BBQ Ribs','Salmon','Spaghetti','Mac & Cheese','Steak','Salad','Sandwiches','Chili','Casserole','Fried Rice'];
const DAY_NAMES_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

let weekOffset = 0;
let editDate = null;

function getWeekDates(offset) {
  const today = new Date();
  const dow = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dow + offset * 7);
  return Array.from({length:7}, (_,i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function render() {
  const dates = getWeekDates(weekOffset);
  const today = todayStr();
  const startLabel = new Date(dates[0]+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
  const endLabel = new Date(dates[6]+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});

  let html = `<div class="list-card">
    <div class="week-nav-row">
      <button class="week-btn" onclick="weekOffset--;render()">‹</button>
      <div class="week-title">${weekOffset===0?'This Week':weekOffset===1?'Next Week':startLabel+' – '+endLabel}</div>
      <button class="week-btn" onclick="weekOffset++;render()">›</button>
    </div>
    <div class="meal-grid">`;

  dates.forEach(dateStr => {
    const meal = Store.getMeal(dateStr);
    const d = new Date(dateStr+'T12:00:00');
    const isToday = dateStr === today;
    const dayName = DAY_NAMES_FULL[d.getDay()];
    const dayNum = d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
    html += `<div class="meal-day-row ${isToday?'today-row':''}" onclick="openEdit('${dateStr}','${dayName}')">
      <div>
        <div class="meal-day-name">${dayName.slice(0,3)}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.35)">${dayNum}</div>
      </div>
      ${meal ? `<div class="meal-name">${meal}</div>` : `<div class="meal-empty">Tap to plan</div>`}
      <div class="meal-edit-btn">✏️</div>
    </div>`;
  });

  html += `</div></div>`;
  document.getElementById('list-section').innerHTML = html;
}

function openEdit(dateStr, dayName) {
  editDate = dateStr;
  document.getElementById('meal-modal-title').textContent = dayName + "'s Dinner";
  document.getElementById('meal-input').value = Store.getMeal(dateStr) || '';
  const ideas = document.getElementById('quick-ideas');
  ideas.innerHTML = MEAL_IDEAS.map(m => `<button onclick="document.getElementById('meal-input').value='${m}'" style="padding:5px 10px;background:rgba(255,255,255,0.08);border-radius:10px;font-size:12px;color:rgba(255,255,255,0.8);border:none;cursor:pointer;font-family:inherit">${m}</button>`).join('');
  document.getElementById('meal-modal').classList.add('open');
  document.getElementById('modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('meal-input').focus(), 100);
}

function saveMeal() {
  if (!editDate) return;
  Store.setMeal(editDate, document.getElementById('meal-input').value.trim());
  closeEdit();
  render();
}

function closeEdit() {
  document.getElementById('meal-modal').classList.remove('open');
  document.getElementById('modal-overlay').classList.remove('open');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('meal-modal').classList.contains('open')) saveMeal();
  if (e.key === 'Escape') closeEdit();
});

render();
</script>
</body>
</html>
