-- Run this once in Supabase SQL Editor to enable realtime notifications.
-- backend/sql/notifications.sql

CREATE TABLE IF NOT EXISTS public.notifications (
  id          TEXT        PRIMARY KEY,
  "userId"    TEXT        NOT NULL,
  entity      TEXT        NOT NULL, -- income | expense | wallet | saving | wishlist | budget
  action      TEXT        NOT NULL, -- create | update | delete | transfer | topup | fund
  "entityId"  TEXT,
  meta        JSONB       NOT NULL DEFAULT '{}',
  read        BOOLEAN     NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_date_idx
  ON public.notifications ("userId", "createdAt" DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- auth.jwt()->>'sub' = Better Auth userId (text, not uuid)
CREATE POLICY "read own notifs" ON public.notifications
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'sub') = "userId");

-- Allow realtime subscription to this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
