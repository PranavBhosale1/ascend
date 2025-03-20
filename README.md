# Ascend Flow

A personal growth companion application built with Next.js, Supabase, and Framer Motion.

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ascend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a Supabase project**
   - Go to [Supabase](https://supabase.com) and create a new project
   - Get your project URL and anon key from the project settings (Settings > API)

4. **Set up environment variables**
   - Create a `.env.local` file in the root directory
   - Add the following environment variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

5. **Set up the database schema**
   - Go to the SQL Editor in your Supabase dashboard
   - Create a new query
   - Copy the contents of `supabase-schema.sql` and paste them into the query editor
   - Run the query to create the necessary tables, functions, and triggers

6. **Configure Google OAuth (optional)**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project and set up OAuth credentials
   - Configure the redirect URI as `https://your-project-ref.supabase.co/auth/v1/callback`
   - Add your Google client ID and secret to Supabase (Authentication > Providers > Google)

7. **Run the development server**
   ```bash
   npm run dev
   ```

8. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- Authentication with email/password and Google OAuth
- Responsive design with animations
- Protected routes
- User profiles

## Technologies Used

- Next.js 15
- Supabase (Authentication, Database)
- Framer Motion
- Tailwind CSS
- TypeScript 