/* ===== WEATHER BACKGROUNDS ===== */

/* SUNNY */
body.weather-sunny .weather-bg {
  background: linear-gradient(170deg, #1a6b9a 0%, #2196c4 40%, #f4a830 100%);
}
.sun {
  position: absolute;
  top: 60px; right: 60px;
  width: 80px; height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, #ffe566 30%, #ffb300 70%, transparent 100%);
  box-shadow: 0 0 60px 20px rgba(255,200,50,0.4);
  animation: sun-pulse 4s ease-in-out infinite;
}
@keyframes sun-pulse {
  0%,100% { transform: scale(1); box-shadow: 0 0 60px 20px rgba(255,200,50,0.4); }
  50% { transform: scale(1.08); box-shadow: 0 0 80px 30px rgba(255,200,50,0.6); }
}
.sun-ray {
  position: absolute;
  top: 50%; left: 50%;
  width: 100px; height: 3px;
  background: linear-gradient(to right, rgba(255,220,80,0.6), transparent);
  transform-origin: 0 50%;
  border-radius: 2px;
  animation: ray-spin 12s linear infinite;
}
@keyframes ray-spin { from { transform: translateY(-50%) rotate(0deg); } to { transform: translateY(-50%) rotate(360deg); } }

/* CLOUDY */
body.weather-cloudy .weather-bg {
  background: linear-gradient(170deg, #3a4a6b 0%, #546080 60%, #7a8a9a 100%);
}
.cloud {
  position: absolute;
  border-radius: 50px;
  background: rgba(255,255,255,0.18);
  animation: cloud-drift linear infinite;
}
@keyframes cloud-drift {
  from { transform: translateX(-200px); }
  to { transform: translateX(110vw); }
}

/* RAINY */
body.weather-rainy .weather-bg {
  background: linear-gradient(170deg, #1a2340 0%, #2a3555 50%, #3a4570 100%);
}
.raindrop {
  position: absolute;
  width: 1.5px;
  background: linear-gradient(to bottom, transparent, rgba(150,200,255,0.7));
  border-radius: 1px;
  animation: rain-fall linear infinite;
  top: -60px;
}
@keyframes rain-fall {
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(110vh) translateX(-30px); opacity: 0; }
}

/* STORMY */
body.weather-stormy .weather-bg {
  background: linear-gradient(170deg, #0a0f1a 0%, #151d30 60%, #1a2540 100%);
}
.lightning {
  position: absolute;
  top: 0; left: 50%;
  width: 4px;
  background: rgba(255,255,200,0.9);
  clip-path: polygon(40% 0%, 100% 45%, 60% 45%, 100% 100%, 0% 55%, 40% 55%);
  animation: lightning-flash 6s ease-in-out infinite;
  opacity: 0;
}
@keyframes lightning-flash {
  0%,89%,95%,100% { opacity: 0; }
  90%,94% { opacity: 1; }
}

/* SNOWY */
body.weather-snowy .weather-bg {
  background: linear-gradient(170deg, #2a3f6f 0%, #4a5f8f 50%, #8a9abf 100%);
}
.snowflake {
  position: absolute;
  color: rgba(255,255,255,0.8);
  font-size: 14px;
  animation: snow-fall linear infinite;
  top: -30px;
  user-select: none;
}
@keyframes snow-fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 0.8; }
  100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
}
.snowflake.large { font-size: 20px; }
.snowflake.small { font-size: 9px; }

/* FOGGY */
body.weather-foggy .weather-bg {
  background: linear-gradient(170deg, #5a6070 0%, #8a9090 60%, #aab0b0 100%);
}
.fog-layer {
  position: absolute;
  left: -20%;
  height: 80px;
  background: rgba(200,210,210,0.18);
  border-radius: 50%;
  animation: fog-drift ease-in-out infinite alternate;
  filter: blur(20px);
}
@keyframes fog-drift {
  from { transform: translateX(0); opacity: 0.5; }
  to { transform: translateX(40px); opacity: 1; }
}

/* PARTLY CLOUDY */
body.weather-partly-cloudy .weather-bg {
  background: linear-gradient(170deg, #1a4a7a 0%, #2a6aa0 40%, #5a8ab0 100%);
}

/* NIGHT */
body.weather-night .weather-bg {
  background: linear-gradient(170deg, #04060f 0%, #080d1f 50%, #0f1530 100%);
}
.star {
  position: absolute;
  width: 2px; height: 2px;
  border-radius: 50%;
  background: white;
  animation: star-twinkle ease-in-out infinite alternate;
}
@keyframes star-twinkle {
  from { opacity: 0.2; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1.2); }
}
.moon {
  position: absolute;
  top: 50px; right: 50px;
  width: 60px; height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #fffde0, #f0d060);
  box-shadow: 0 0 30px 10px rgba(240,200,80,0.2);
}
