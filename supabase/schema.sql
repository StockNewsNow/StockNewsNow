-- ============================================================
--  stock-buzz schema
--  Run this in the Supabase SQL editor (one time).
-- ============================================================

create table if not exists mentions (
  id          bigserial primary key,
  ticker      text        not null,
  source      text        not null,        -- e.g. 'reddit:wallstreetbets'
  sentiment   real        not null,        -- -1 (bearish) .. 1 (bullish)
  title       text,
  url         text,
  post_id     text        not null,
  score       int         default 0,       -- reddit upvotes, a rough weight
  created_at  timestamptz default now()
);

-- Prevent the same post counting twice for the same ticker across re-scans.
create unique index if not exists mentions_post_ticker
  on mentions (post_id, ticker);

create index if not exists mentions_created_at on mentions (created_at desc);
create index if not exists mentions_ticker      on mentions (ticker);

-- ------------------------------------------------------------
--  Trending leaderboard.
--  Compares the current window to the previous one of equal length
--  so we can show velocity (is chatter accelerating or fading?).
-- ------------------------------------------------------------
-- source_prefix filters by source kind: '' = all, 'reddit' = social only,
-- 'news' = news only. Matches the prefix before the colon in `source`.
create or replace function trending_tickers(window_minutes int, source_prefix text default '')
returns table (
  ticker          text,
  mentions        bigint,
  avg_sentiment   double precision,
  weighted_score  double precision,   -- mentions x upvote weight
  prev_mentions   bigint,
  velocity        double precision    -- % change vs previous window
)
language sql
stable
as $$
  with cur as (
    select
      ticker,
      count(*)                       as mentions,
      avg(sentiment)                 as avg_sentiment,
      sum(1 + ln(greatest(score,1))) as weighted_score
    from mentions
    where created_at > now() - make_interval(mins => window_minutes)
      and (source_prefix = '' or source like source_prefix || '%')
    group by ticker
  ),
  prev as (
    select ticker, count(*) as mentions
    from mentions
    where created_at <= now() - make_interval(mins => window_minutes)
      and created_at >  now() - make_interval(mins => window_minutes * 2)
      and (source_prefix = '' or source like source_prefix || '%')
    group by ticker
  )
  select
    cur.ticker,
    cur.mentions,
    round(cur.avg_sentiment::numeric, 3)::double precision,
    round(cur.weighted_score::numeric, 1)::double precision,
    coalesce(prev.mentions, 0),
    case
      when coalesce(prev.mentions, 0) = 0 then null
      else round(((cur.mentions - prev.mentions)::numeric / prev.mentions) * 100, 0)::double precision
    end
  from cur
  left join prev on cur.ticker = prev.ticker
  order by cur.mentions desc, cur.weighted_score desc
  limit 50;
$$;

-- ------------------------------------------------------------
--  Optional housekeeping: drop mentions older than 7 days so the
--  free Supabase database stays small. Schedule with pg_cron if you like.
-- ------------------------------------------------------------
-- delete from mentions where created_at < now() - interval '7 days';

-- ============================================================
--  Accounts & subscription status
--  Run this alongside the mentions schema above.
-- ============================================================

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  is_pro      boolean     not null default false,   -- flipped true by the Stripe webhook
  stripe_customer_id text,
  created_at  timestamptz default now()
);

alter table profiles enable row level security;

-- A user may read ONLY their own profile row. They cannot change is_pro
-- themselves — that flag is set server-side by the Stripe webhook (service key,
-- which bypasses RLS). This prevents users self-upgrading for free.
drop policy if exists "read own profile" on profiles;
create policy "read own profile" on profiles
  for select using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
