// VORTEX Auth - Harden VORTEX security: bcrypt + JWT - Your commit message
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from './supabase-client.js';

const JWT_SECRET = process.env.JWT_SECRET || 'VORTEX_800_SECRET_BY_BRILLIANT';

export async function register(username, password) {
  const hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase.from('users').insert([{ username, password_hash: hash }]).select();
  if (error) throw error;
  return data;
}

export async function login(username, password) {
  const { data: user } = await supabase.from('users').select('*').eq('username', username).single();
  if (!user) throw new Error('User not found');
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error('Invalid password');
  const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '30d' });
  return { token, user };
}

export function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}
