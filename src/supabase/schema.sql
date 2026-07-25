-- =========================================================================
-- ApplyOne Phase 1 Database Schema Guide
-- Execute this script in your Supabase SQL Editor to set up profiles
-- =========================================================================

-- 1. Create Profile Table linking to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  account_type TEXT NOT NULL CHECK (account_type IN ('Student', 'Fresher', 'Professional')),
  role TEXT NOT NULL DEFAULT 'Student' CHECK (role IN ('Student', 'Recruiter', 'Admin', 'Super Admin')),
  resume_url TEXT,
  has_experience BOOLEAN DEFAULT FALSE,
  company_name TEXT,
  role_details TEXT,
  employment_types TEXT[],
  last_monthly_package NUMERIC,
  expected_packages JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row-Level Security on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Configure RLS Policies for safe data authorization

-- Delete existing policies if they exist (to avoid collisions)
DROP POLICY IF EXISTS "Allow users read/write access to their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profiles to be created" ON public.profiles;

-- Policy: Users can only read, update, or delete their own profile record
CREATE POLICY "Allow users read/write access to their own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Allow internal trigger to insert profile rows during registration
CREATE POLICY "Allow profiles to be created"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- 3. Create synchronization trigger to insert a profile record when a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    phone, 
    account_type, 
    role,
    resume_url,
    has_experience,
    company_name,
    role_details,
    employment_types,
    last_monthly_package,
    expected_packages
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'account_type', 'Student'),
    COALESCE(new.raw_user_meta_data->>'role', 'Student'),
    new.raw_user_meta_data->>'resume_url',
    COALESCE((new.raw_user_meta_data->>'has_experience')::BOOLEAN, FALSE),
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'role_details',
    ARRAY(SELECT jsonb_array_elements_text(COALESCE(new.raw_user_meta_data->'employment_types', '[]'::jsonb))),
    (new.raw_user_meta_data->>'last_monthly_package')::NUMERIC,
    new.raw_user_meta_data->'expected_packages'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger function to the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create automatic timestamp trigger to update the updated_at column

CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind the timestamp trigger to the profiles table
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
