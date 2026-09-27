// core/monetization.js - VORTEX Monetization
// By Brilliant Tumelo Mere
// Premium - Stars - Buy/Sell Marketplace - 90% earnings to creators
// Subscription $5.99 - Best video maker etc ranking = earn

export const Monetize = {
  PREMIUM_PRICE: 5.99,
  STAR_PRICE: 0.05, // 1 star = $0.05
  CREATOR_SHARE: 0.90, // 90% to creator

  init() {
    window.Monetize = this;
    this.loadWallet();
  },

  loadWallet() {
    const wallet = JSON.parse(localStorage.getItem('vortex_wallet') || '{"stars":0,"earnings":0,"premium":false}');
    this.wallet = wallet;
    return wallet;
  },

  saveWallet() {
    localStorage.setItem('vortex_wallet', JSON.stringify(this.wallet));
    this.renderPremium();
  },

  // PREMIUM
  buyPremium() {
    if (this.wallet.premium) return alert('Already Premium ✓');
    const ok = confirm(`Buy VORTEX Premium $ ${this.PREMIUM_PRICE}/month?\n- No ads\n- Vault unlimited\n- Best video maker tools\n- 90% earnings\n- Private downloads`);
    if (!ok) return;
    // Stripe / Paystack placeholder
    this.wallet.premium = true;
    this.wallet.stars += 100; // bonus
    this.saveWallet();
    alert('Premium activated — Thank you! You now earn 90% from content');
  },

  // STARS - Buy & Tip
  buyStars(amount) {
    const cost = amount * this.STAR_PRICE;
    const ok = confirm(`Buy ${amount} Stars for $${cost.toFixed(2)} ?`);
    if (!ok) return;
    this.wallet.stars += amount;
    this.saveWallet();
    alert(`${amount} Stars added`);
  },

  tipCreator(username, stars) {
    if (this.wallet.stars < stars) return alert('Not enough Stars — buy more');
    this.wallet.stars -= stars;
    const earnings = stars * this.STAR_PRICE * this.CREATOR_SHARE;
    this.wallet.earnings += earnings * 0.1; // platform fee back if you are creator tipping self demo
    this.saveWallet();
    alert(`Tipped ${stars} Stars to ${username} — Creator gets 90% $${(stars * this.STAR_PRICE * this.CREATOR_SHARE).toFixed(2)}`);
  },

  // MARKETPLACE - Buy / Sell
  marketplace: JSON.parse(localStorage.getItem('vortex_market') || '[]'),

  sellItem(title, price, type='video') {
    if (!this.wallet.premium && price > 10) return alert('Premium needed to sell over $10 — Buy Premium $5.99');
    const item = { id:Date.now(), title, price, type, seller:'@you', views:0, earnings:0 };
    this.marketplace.unshift(item);
    localStorage.setItem('vortex_market', JSON.stringify(this.marketplace));
    alert(`Listed: ${title} for $${price} — You earn 90%`);
    this.renderMarketplace();
  },

  buyItem(id) {
    const item = this.marketplace.find(i=>i.id===id);
    if (!item) return;
    const ok = confirm(`Buy ${item.title} for $${item.price}?\nSeller gets 90% $${(item.price*0.90).toFixed(2)}`);
    if (!ok) return;
    // Simulate purchase
    this.wallet.earnings += item.price * 0.1; // demo platform share
    localStorage.setItem('vortex_wallet', JSON.stringify(this.wallet));
    alert(`Purchased ${item.title} — saved to Downloads`);
    // Add to downloads
    const dl = JSON.parse(localStorage.getItem('vortex_dl') || '[]');
    dl.unshift(item);
    localStorage.setItem('vortex_dl', JSON.stringify(dl));
  },

  // DASHBOARD - Earnings
  getEarnings() {
    return this.wallet.earnings;
  },

  // RENDERS
  renderPremium() {
    const el = document.getElementById('premium-page');
    const wal = document.getElementById('wallet-stats');
    const html = `
      <div class="card">
        <b>💎 VORTEX Premium — $5.99 / month</b>
        <p class="small" style="margin:8px 0">Stars: ${this.wallet.stars} | Earnings: $${this.wallet.earnings.toFixed(2)} | Premium: ${this.wallet.premium?'YES ✓':'NO'}</p>
        <button class="v-btn" onclick="Monetize.buyPremium()">Buy Premium</button>
        <button class="v-btn g" onclick="Monetize.buyStars(50)">Buy 50 Stars $2.50</button>
        <button class="v-btn g" onclick="Monetize.buyStars(200)">Buy 200 Stars $10</button>
      </div>
    `;
    if (el) el.innerHTML = html;
    if (wal) wal.innerHTML = `<small>⭐ ${this.wallet.stars} Stars<br>💰 $${this.wallet.earnings.toFixed(2)} earned (90%)<br>💎 Premium: ${this.wallet.premium?'Active':'Not active'}</small>`;
  },

  renderMarketplace() {
    const el = document.getElementById('marketplace-list');
    if (!el) return;
    if (!this.marketplace.length) {
      el.innerHTML = `<div class="card small">No items — Sell your video / template / effect</div>`;
      return;
    }
    el.innerHTML = this.marketplace.map(i=>`
      <div class="card"><b>${i.title}</b><br><small class="small">${i.type} by ${i.seller}</small><br><b style="color:var(--cyan)">$${i.price}</b> <small style="color:var(--muted)">seller gets 90%</small><br><br><button class="v-btn" onclick="Monetize.buyItem(${i.id})">Buy</button><button class="v-btn g" onclick="Monetize.tipCreator('${i.seller}',10)">Tip 10 Stars</button></div>
    `).join('');
  },

  renderDownloads() {
    const el = document.getElementById('downloads-list');
    const dl = JSON.parse(localStorage.getItem('vortex_dl') || '[]');
    if (!el) return;
    if (!dl.length) {
      el.innerHTML = `<div class="card small">No downloads — private downloads go here + Vault</div>`;
      return;
    }
    el.innerHTML = dl.map(i=>`<div class="card"><b>${i.title}</b><br><small class="small">$${i.price} — private</small></div>`).join('');
  }
};
