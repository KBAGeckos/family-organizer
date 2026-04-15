# FamCal – Family Organizer
## Deploying to Cloudflare Pages

### Step 1: Get the files
Download the zip file Claude provided and unzip it. You'll see:
- index.html
- manifest.json
- css/ (main.css, weather.css)
- js/ (data.js, weather.js, calendar.js, app.js)
- pages/ (shopping.html, todos.html, meals.html)

### Step 2: Create a GitHub repo (free)
1. Go to https://github.com and sign in (or create account)
2. Click the "+" → "New repository"
3. Name it "famcal", set to Public, click Create
4. Upload ALL the files (drag and drop works)

### Step 3: Deploy on Cloudflare Pages
1. Go to https://dash.cloudflare.com
2. Click "Pages" in the left sidebar
3. Click "Create a project" → "Connect to Git"
4. Connect your GitHub account
5. Select your "famcal" repo
6. Leave all settings as default (no build command needed)
7. Click "Save and Deploy"

That's it! Cloudflare gives you a free URL like:
  https://famcal.pages.dev

### Step 4: Add to phone home screen
**iPhone:** Open in Safari → Share → "Add to Home Screen"
**Android:** Open in Chrome → Menu → "Add to Home Screen"

It will look and feel like a real app!

### Customizing Family Members
Open js/data.js and edit the FAMILY_MEMBERS array:
- Change name, initials, color for each person
- The 6 slots are: Mom, Dad, Child 1, Child 2, Child 3, Family

### Features
- 📅 Shared color-coded calendar
- 🌤️ Live weather with animated backgrounds for Moore, SC
- 🎬 Scrolling upcoming events ticker
- 🍽️ Weekly meal planner
- 🛒 Family shopping list
- ✅ To-do & chores by family member
- 📱 Works as an app on phone (Add to Home Screen)
- 💾 All data saves locally on each device

### Notes
- Weather updates every 15 minutes using Open-Meteo (free, no account needed)
- Data is stored in the browser — each device keeps its own copy
- For shared data across devices, a future upgrade would use Supabase
