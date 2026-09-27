// backend/server.js - VORTEX Backend
// By Brilliant Tumelo Mere
// Express + Supabase/Postgres + Vault + Notifications + Quality Filter + 90% earnings

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// SUPABASE - replace with your keys or set env
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'your-anon-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PORT = process.env.PORT || 3000;

// QUALITY FILTER - app improves post quality so not messy
function qualityFilter(text) {
  const banned = ['dirty','spam','scam','child','minor','underage','porn','xxx','nude'];
  const low = text.toLowerCase();
  if (banned.some(w => low.includes(w))) return { ok: false, reason: 'Quality filter: dirt post blocked' };
  if (text.length < 3) return { ok: false, reason: 'Too short' };
  if (text.length > 2000) return { ok: false, reason: 'Too long' };
  return { ok: true };
}

// SECURITY - Child safety RED + Anti-scam
function securityScan(text) {
  const child = ['child','minor','underage','kid','teen','young boy','young girl'];
  const scam = ['send money fast','gift card','lottery','verify link','urgent transfer','claiming to use someone account'];
  const t = text.toLowerCase();
  if (child.some(w => t.includes(w))) return { blocked: true, code: 'CHILD', msg: 'Child safety - RED and closed automatically' };
  if (scam.some(w => t.includes(w))) return { blocked: true, code: 'SCAM', msg: 'Scam detected - Awareness of people claiming to use someone account - RED and closed' };
  return { blocked: false };
}

// ROUTES

// Posts
app.post('/api/posts', async (req, res) => {
  const { user_id, text, media_url } = req.body;

  const q = qualityFilter(text || '');
  if (!q.ok) return res.status(400).json({ error: q.reason });

  const s = securityScan(text || '');
  if (s.blocked) return res.status(403).json({ error: s.msg, code: s.code });

  const { data, error } = await supabase.from('posts').insert({
    user_id, text, media_url, likes: 0,
    created_at: new Date().toISOString()
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, post: data });
});

app.get('/api/posts', async (req, res) => {
  const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(50);
  res.json(data || []);
});

// Rankings
app.get('/api/rankings', (req, res) => {
  res.json([
    { icon: '🔥', name: 'Top Post', user: '@nova.create', score: '12.4k likes', type: 'post' },
    { icon: '🎬', name: 'Top Video / Reels', user: '@kai_vortex', score: '89k views', type: 'reel' },
    { icon: '🎮', name: 'Top Game Rank', user: '@zed_gamer', score: 'Lv 99', type: 'game' },
    { icon: '💰', name: 'Top Buyer', user: '@luna_shop', score: '$4.2k spent', type: 'buyer' },
    { icon: '👥', name: 'Most Online', user: '@mira_live', score: '24h active', type: 'online' },
    { icon: '🏅', name: 'Best Video Maker', user: '@synth.arch', score: '1.2M earned', type: 'maker' }
  ]);
});

// Vault - private downloads + 3 passcode
app.post('/api/vault/check', async (req, res) => {
  const { user_id, passcode } = req.body;
  // check 3 passcode logic
  const { data } = await supabase.from('vault_keys').select('*').eq('user_id', user_id).single();
  if (!data) return res.json({ ok: true }); // no pin set
  const valid = data.codes.includes(passcode);
  res.json({ ok: valid });
});

app.get('/api/vault/items/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { data } = await supabase.from('vault_items').select('*').eq('user_id', user_id);
  res.json(data || []);
});

// Notifications - disappearing but keep sensitive, vault private
app.get('/api/notifications/:user_id', async (req, res) => {
  const { data } = await supabase.from('notifications').select('*').eq('user_id', req.params.user_id).order('created_at', { ascending: false });
  // disappearing logic: delete after read if not vault
  const visible = (data || []).filter(n => !n.is_vault || n.keep);
  res.json(visible);
});

app.post('/api/notifications/read', async (req, res) => {
  const { id } = req.body;
  await supabase.from('notifications').update({ read: true }).eq('id', id);
  // disappearing after 3 sec if not vault
  setTimeout(async () => {
    const { data } = await supabase.from('notifications').select('is_vault').eq('id', id).single();
    if (!data?.is_vault) await supabase.from('notifications').delete().eq('id', id);
  }, 3000);
  res.json({ ok: true });
});

// Monetization - 90% earnings
app.post('/api/buy', async (req, res) => {
  const { item_id, buyer_id } = req.body;
  const { data: item } = await supabase.from('marketplace').select('*').eq('id', item_id).single();
  if (!item) return res.status(404).json({ error: 'Item not found' });
  const creatorShare = item.price * 0.90;
  await supabase.from('earnings').insert({ user_id: item.seller_id, amount: creatorShare, item_id });
  res.json({ success: true, creator_gets: creatorShare, you_get_download: true });
});

app.listen(PORT, () => console.log(`[VORTEX] Backend running on ${PORT} - By Brilliant Tumelo Mere`));
