# VORTEX - By Brilliant Mere
Luxury social + AI + Games + Videos + Wallet
Built in BW for the world.

## Security and environment setup

This project must never commit secrets to Git. The repository should only include a `.env.example` template, never a real `.env` file.

If your `.env` was ever pushed, rotate these values immediately in your hosting provider and Supabase dashboard:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `JWT_SECRET`

Supabase-specific reminder:

1. Open your Supabase project.
2. Go to Project Settings → API.
3. Rotate the keys and update the deployed environment variables.
4. Update the local `.env` file after rotation.

Do not commit `.env` files. The project should keep a `.env.example` template instead.

## Local setup

```bash
npm install
cp .env.example .env
npm start
```

## Example environment

```env
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
JWT_SECRET=change_this_to_a_long_random_value
NODE_ENV=development
```

## Security notes

- Never commit `.env` or generated secrets.
- Always keep `JWT_SECRET` unique and long.
- Use server-side validation for all authenticated requests.
- Do not trust `user_id`, `sender_id`, or `receiver_id` sent by the client; read them from the verified JWT.
