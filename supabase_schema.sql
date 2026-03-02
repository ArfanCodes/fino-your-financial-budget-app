-- ============================================================
-- FinTrack — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── Enable UUID extension ──────────────────────────────────
create extension if not exists "uuid-ossp";


-- ─── CATEGORIES TABLE ───────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#6C63FF',
  created_at  timestamptz not null default now()
);

-- RLS: users can only see/modify their own categories
alter table public.categories enable row level security;

create policy "Users can view their own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on public.categories for delete
  using (auth.uid() = user_id);


-- ─── EXPENSES TABLE ─────────────────────────────────────────
create table if not exists public.expenses (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  category_id     uuid references public.categories(id) on delete set null,
  amount          numeric(12, 2) not null check (amount > 0),
  date            date not null default current_date,
  note            text,
  payment_method  text not null default 'cash'
                    check (payment_method in ('cash','card','upi','bank_transfer','other')),
  created_at      timestamptz not null default now()
);

-- RLS: users can only see/modify their own expenses
alter table public.expenses enable row level security;

create policy "Users can view their own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own expenses"
  on public.expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);


-- ─── BUDGETS TABLE ──────────────────────────────────────────
create table if not exists public.budgets (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  category_id     uuid references public.categories(id) on delete cascade,
  monthly_limit   numeric(12, 2) not null check (monthly_limit > 0),
  created_at      timestamptz not null default now(),
  -- one budget per user per category (null = overall budget)
  unique (user_id, category_id)
);

-- RLS
alter table public.budgets enable row level security;

create policy "Users can view their own budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own budgets"
  on public.budgets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);


-- ─── INDEXES ────────────────────────────────────────────────
create index if not exists idx_expenses_user_id    on public.expenses(user_id);
create index if not exists idx_expenses_date       on public.expenses(date desc);
create index if not exists idx_expenses_category   on public.expenses(category_id);
create index if not exists idx_categories_user_id  on public.categories(user_id);
create index if not exists idx_budgets_user_id     on public.budgets(user_id);
