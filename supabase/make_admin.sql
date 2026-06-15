-- ============================================================
--  Grant admin access to your account.
--  Run this in Supabase → SQL Editor after you have signed up
--  at /auth so your profile row exists.
--
--  Replace the email below with the email you signed up with.
-- ============================================================

update profiles
set is_admin = true, is_pro = true
where email = 'your@email.com';

-- Verify it worked — should return your row with both columns true:
select id, email, is_pro, is_admin from profiles where email = 'your@email.com';
