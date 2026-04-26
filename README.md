# Supabase & Vercel Migration Complete!

I have restructured the project into a Vercel-ready monorepo (frontend and backend combined) inside a new folder called `guildboard-v2`. This structure allows Vercel to automatically build the React frontend and deploy the Express backend as Serverless Functions (`/api/*`).

## What Changed?
1. **Unified Structure**: Merged `frontend` and `backend` into a single root directory.
2. **Vercel Serverless Functions**: Moved the Express backend into an `api/` directory. Vercel automatically treats `api/index.js` as a serverless function.
3. **Dynamic API Routing**: The frontend now automatically calls `/api/*` endpoints relative to its own origin, which means Vercel handles routing it to the serverless functions seamlessly.

## Supabase Setup Instructions

To transition to Supabase (which provides a free PostgreSQL database), follow these steps:

1. **Create a Supabase Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2. **Get your Connection String**: In your Supabase dashboard, go to Settings -> Database -> Connection String (URI). It will look something like this:
   `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`
3. **Run the Database Schema**: Go to the SQL Editor in your Supabase dashboard, paste the contents of `guildboard-v2/schema.sql`, and hit Run. This will set up your tables.

> The `pg` library we are using natively supports connecting to Supabase! No code changes are required for the database connection; you only need to provide the connection string.

## Local Development

To run the unified project locally:
1. `cd guildboard-v2`
2. `npm install`
3. Create a `.env` file with:
   ```env
   PORT=5001
   JWT_SECRET=your_super_secret_jwt_key
   DATABASE_URL=your_supabase_connection_string
   OPENAI_API_KEY=your_openai_api_key
   ```
4. Run the frontend: `npm run dev`
5. Run the backend locally (if not using Vercel Dev): `node api/index.js` (you will need to uncomment `app.listen()` inside `api/index.js` for local development if not using Vercel CLI). Or better, use `npx vercel dev`.

## Deploying to Vercel

1. Push `guildboard-v2` to a new GitHub repository.
2. Import the repository in Vercel.
3. Vercel will automatically detect Vite. 
4. In the Vercel dashboard, add the Environment Variables (`JWT_SECRET`, `DATABASE_URL`, `OPENAI_API_KEY`).
5. Click **Deploy**. Vercel will automatically serve your frontend and route `/api` to your backend serverless functions!
