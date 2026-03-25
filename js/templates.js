const TEMPLATES = {
  og: {
    w: 1200,
    h: 630,
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 20px; padding: 80px; position: relative;
  }
  body::before {
    content: ''; position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 15% 50%, rgba(120,80,255,0.35) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 20%, rgba(255,80,130,0.25) 0%, transparent 50%);
  }
  .emoji { font-size: 88px; z-index: 1; line-height: 1; }
  .title { font-size: 68px; font-weight: 800; color: #fff; text-align: center; z-index: 1; line-height: 1.1; letter-spacing: -0.03em; }
  .subtitle { font-size: 26px; color: rgba(255,255,255,0.55); text-align: center; z-index: 1; }
  .badge { font-family: monospace; font-size: 15px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.75); padding: 8px 22px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.15); z-index: 1; }
</style>
</head>
<body>
  <div class="emoji">🚀</div>
  <div class="title">Ship it faster</div>
  <div class="subtitle">Build products people actually love</div>
  <div class="badge">Kbach.io · v2.0</div>
</body>
</html>`
  },
  quote: {
    w: 800,
    h: 800,
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 800px; height: 800px; overflow: hidden; font-family: Georgia, 'Times New Roman', serif; background: #fdf6e3; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 90px; position: relative; }
  .quote-mark { position: absolute; top: 20px; left: 40px; font-size: 220px; color: rgba(0,0,0,0.06); line-height: 1; font-family: serif; user-select: none; }
  .emoji { font-size: 52px; margin-bottom: 32px; }
  .quote { font-size: 34px; line-height: 1.55; color: #2c2c2c; text-align: center; position: relative; z-index: 1; }
  .divider { width: 48px; height: 2px; background: #c8a96a; margin: 36px auto; }
  .author { font-size: 18px; color: #999; font-style: italic; text-align: center; }
</style>
</head>
<body>
  <div class="quote-mark">"</div>
  <div class="emoji">💡</div>
  <div class="quote">The best way to predict<br>the future is to invent it.</div>
  <div class="divider"></div>
  <div class="author">— Alan Kay</div>
</body>
</html>`
  },
  profile: {
    w: 600,
    h: 360,
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 600px; height: 360px; overflow: hidden; font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; display: flex; align-items: center; gap: 40px; padding: 50px; border: 2px solid #0e0e0e; position: relative; }
  .avatar { width: 110px; height: 110px; border-radius: 50%; background: #f4f0e8; display: flex; align-items: center; justify-content: center; font-size: 60px; flex-shrink: 0; border: 3px solid #0e0e0e; }
  .name { font-size: 30px; font-weight: 800; color: #0e0e0e; }
  .role { font-size: 15px; color: #777; margin-top: 6px; }
  .stats { display: flex; gap: 28px; margin-top: 24px; }
  .stat-val { font-size: 26px; font-weight: 800; color: #0e0e0e; }
  .stat-lbl { font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }
  .corner { position: absolute; top: 18px; right: 18px; background: #0e0e0e; color: #fff; font-size: 10px; padding: 4px 12px; border-radius: 3px; letter-spacing: 0.06em; }
  .accent-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #ff4500, #ff8c00, #ffd700); }
</style>
</head>
<body>
  <div class="avatar">🧑‍💻</div>
  <div>
    <div class="name">Alex Chen</div>
    <div class="role">Full-stack Engineer · Open Source</div>
    <div class="stats">
      <div><div class="stat-val">142</div><div class="stat-lbl">Projects</div></div>
      <div><div class="stat-val">8.4k</div><div class="stat-lbl">Stars</div></div>
      <div><div class="stat-val">3.1k</div><div class="stat-lbl">Followers</div></div>
    </div>
  </div>
  <div class="corner">Available ✓</div>
  <div class="accent-bar"></div>
</body>
</html>`
  },
  announce: {
    w: 1000,
    h: 500,
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1000px; height: 500px; overflow: hidden; font-family: 'Arial Black', 'Helvetica Neue', sans-serif; background: #0a0a0a; display: flex; }
  .stripe { width: 8px; background: repeating-linear-gradient(-45deg, #ffe600, #ffe600 10px, #0a0a0a 10px, #0a0a0a 20px); }
  .content { flex: 1; padding: 60px 70px; display: flex; flex-direction: column; justify-content: center; }
  .eyebrow { font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase; color: #ffe600; margin-bottom: 18px; font-weight: 700; }
  .headline { font-size: 56px; font-weight: 900; color: #fff; line-height: 1.05; margin-bottom: 22px; letter-spacing: -0.02em; }
  .headline em { color: #ffe600; font-style: normal; }
  .body { font-size: 17px; color: rgba(255,255,255,0.45); line-height: 1.6; font-family: Arial, sans-serif; font-weight: 400; }
  .right { width: 240px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 14px; background: rgba(255,230,0,0.04); border-left: 1px solid rgba(255,255,255,0.05); }
  .right-emoji { font-size: 86px; }
  .right-date { font-size: 11px; color: rgba(255,255,255,0.3); letter-spacing: 0.12em; text-transform: uppercase; }
</style>
</head>
<body>
  <div class="stripe"></div>
  <div class="content">
    <div class="eyebrow">🎙 Announcing</div>
    <div class="headline">Something <em>big</em><br>is coming.</div>
    <div class="body">We're launching our new platform on Monday. Thousands of teams are already on the waitlist.</div>
  </div>
  <div class="right">
    <div class="right-emoji">🚀</div>
    <div class="right-date">March 2026</div>
  </div>
</body>
</html>`
  },
  ticket: {
    w: 900,
    h: 380,
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 900px; height: 380px; overflow: hidden; font-family: 'Courier New', monospace; background: #f9f6f0; display: flex; align-items: stretch; position: relative; }
  body::after { content: ''; position: absolute; left: 640px; top: 0; bottom: 0; width: 1px; background: repeating-linear-gradient(to bottom, #d0c9bc, #d0c9bc 8px, transparent 8px, transparent 16px); }
  .main-side { width: 640px; padding: 44px 50px; display: flex; flex-direction: column; justify-content: space-between; background: #fff; border: 2px solid #0e0e0e; border-right: none; }
  .event-type { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #c8441a; }
  .event-name { font-size: 38px; font-weight: 700; color: #0e0e0e; margin-top: 8px; line-height: 1.1; font-family: Georgia, serif; }
  .event-sub { font-size: 15px; color: #888; margin-top: 8px; }
  .details { display: flex; gap: 36px; }
  .detail-label { font-size: 9px; color: #aaa; letter-spacing: 0.12em; text-transform: uppercase; }
  .detail-val { font-size: 16px; color: #0e0e0e; margin-top: 4px; font-weight: 600; }
  .stub { flex: 1; padding: 44px 30px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; background: #fff8f4; border: 2px solid #0e0e0e; border-left: none; }
  .stub-emoji { font-size: 52px; }
  .stub-num { font-size: 28px; font-weight: 700; color: #0e0e0e; letter-spacing: 0.04em; }
  .stub-seat { font-size: 10px; color: #aaa; letter-spacing: 0.12em; text-transform: uppercase; }
  .barcode { display: flex; gap: 2px; align-items: flex-end; height: 40px; }
  .barcode div { background: #0e0e0e; width: 2px; }
</style>
</head>
<body>
  <div class="main-side">
    <div>
      <div class="event-type">🎵 Live Concert · General Admission</div>
      <div class="event-name">The Night We<br>Remember</div>
      <div class="event-sub">feat. The Electric Owls</div>
    </div>
    <div class="details">
      <div><div class="detail-label">Date</div><div class="detail-val">Sat, Apr 5, 2026</div></div>
      <div><div class="detail-label">Doors open</div><div class="detail-val">7:30 PM</div></div>
      <div><div class="detail-label">Venue</div><div class="detail-val">Meridian Hall</div></div>
    </div>
  </div>
  <div class="stub">
    <div class="stub-emoji">🎟</div>
    <div><div class="stub-num">A · 14</div><div class="stub-seat">Row · Seat</div></div>
    <div class="barcode" id="bc"></div>
  </div>
  <script>
    var bc=document.getElementById('bc');
    [30,20,35,25,40,18,32,28,38,22,35,20,30,25,40,18,34,26,38,20,30].forEach(function(h){var d=document.createElement('div');d.style.height=h+'px';bc.appendChild(d);});
  </script>
</body>
</html>`
  },
  receipt: {
    w: 420,
    h: 680,
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 420px; height: 680px; overflow: hidden; font-family: 'Courier New', Courier, monospace; background: #fff; padding: 40px 36px; font-size: 13px; color: #222; }
  .store { text-align: center; font-size: 18px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .store-sub { text-align: center; font-size: 11px; color: #999; margin-top: 4px; }
  .dashed { border-top: 1px dashed #ccc; margin: 18px 0; }
  .row { display: flex; justify-content: space-between; align-items: baseline; margin: 6px 0; }
  .item-name { flex: 1; } .item-qty { color: #999; margin-right: 12px; } .item-price { font-weight: 600; }
  .label { color: #999; } .total-row { font-size: 16px; font-weight: 700; }
  .receipt-num { text-align: center; font-size: 10px; color: #bbb; letter-spacing: 0.1em; }
  .thank { text-align: center; font-size: 13px; margin-top: 4px; }
  .barcode-row { display: flex; justify-content: center; gap: 2px; align-items: flex-end; height: 36px; margin: 12px 0; }
  .barcode-row div { background: #222; width: 2px; }
</style>
</head>
<body>
  <div class="store">☕ Beancraft</div>
  <div class="store-sub">Specialty Coffee · Est. 2019</div>
  <div class="dashed"></div>
  <div class="row"><span class="label">Date:</span><span>Mar 25, 2026 09:14</span></div>
  <div class="row"><span class="label">Order #:</span><span>BCR-4821</span></div>
  <div class="row"><span class="label">Server:</span><span>Jamie T.</span></div>
  <div class="dashed"></div>
  <div class="row"><span class="item-name">Flat White</span><span class="item-qty">x1</span><span class="item-price">$6.00</span></div>
  <div class="row"><span class="item-name">Oat Milk</span><span class="item-qty">x1</span><span class="item-price">$0.80</span></div>
  <div class="row"><span class="item-name">Avocado Toast</span><span class="item-qty">x1</span><span class="item-price">$12.50</span></div>
  <div class="row"><span class="item-name">Matcha Latte</span><span class="item-qty">x2</span><span class="item-price">$13.00</span></div>
  <div class="row"><span class="item-name">Blueberry Muffin</span><span class="item-qty">x1</span><span class="item-price">$4.50</span></div>
  <div class="dashed"></div>
  <div class="row"><span class="label">Subtotal</span><span>$36.80</span></div>
  <div class="row"><span class="label">Tax (7%)</span><span>$2.58</span></div>
  <div class="row"><span class="label">Tip</span><span>$5.00</span></div>
  <div class="dashed"></div>
  <div class="row total-row"><span>TOTAL</span><span>$44.38</span></div>
  <div class="row"><span class="label">Paid (Visa ****4231)</span><span>$44.38</span></div>
  <div class="dashed"></div>
  <div class="barcode-row" id="bc2"></div>
  <div class="receipt-num">BCR-4821-20260325</div>
  <div class="dashed"></div>
  <div class="thank">Thanks for visiting! ☕</div>
  <script>
    var bc=document.getElementById('bc2');
    [28,18,34,22,38,16,30,24,36,20,318,28,26,36,18,32,24,36,18,28].forEach(function(h){var d=document.createElement('div');d.style.height=h+'px';bc.appendChild(d);});
  </script>
</body>
</html>`
  },
  emoji: {
    w: 800,
    h: 400,
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 800px; height: 400px; overflow: hidden; font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif; background: #1a1a2e; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: 40px; }
  h2 { font-family: system-ui, sans-serif; font-size: 14px; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(255,255,255,0.3); }
  .row { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
  .em { font-size: 44px; background: rgba(255,255,255,0.06); border-radius: 12px; width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,0.08); }
  .note { font-family: monospace; font-size: 11px; color: rgba(255,255,255,0.25); }
</style>
</head>
<body>
  <h2>Emoji Rendering Test</h2>
  <div class="row">
    <div class="em">😀</div><div class="em">🎉</div><div class="em">🚀</div>
    <div class="em">❤️</div><div class="em">🌍</div><div class="em">🦊</div>
    <div class="em">🍕</div><div class="em">⚡</div><div class="em">🎸</div>
  </div>
  <div class="row">
    <div class="em">🧑‍🚀</div><div class="em">👨‍🎨</div><div class="em">🏳️‍🌈</div>
    <div class="em">🤝🏽</div><div class="em">💅🏾</div><div class="em">🧑‍🚀</div>
  </div>
  <div class="note">ZWJ sequences · skin tones · flags · complex emoji</div>
</body>
</html>`
  }
};
