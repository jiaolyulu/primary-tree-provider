-- Run once in the Neon SQL Editor on the database used by DATABASE_URL.
CREATE TABLE IF NOT EXISTS participation_sessions (
  slug text PRIMARY KEY,
  title text NOT NULL,
  is_open boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS tree_responses (
  id uuid NOT NULL,
  session_slug text NOT NULL REFERENCES participation_sessions(slug),
  tree text NOT NULL CHECK (length(tree) BETWEEN 1 AND 100),
  city text NOT NULL CHECK (length(city) BETWEEN 1 AND 100),
  place text NOT NULL DEFAULT '' CHECK (length(place) <= 160),
  story text NOT NULL CHECK (length(story) <= 500),
  name text NOT NULL DEFAULT '' CHECK (length(name) <= 80),
  consent boolean NOT NULL CHECK (consent = true),
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_slug, id)
);
CREATE INDEX IF NOT EXISTS tree_responses_session_created ON tree_responses (session_slug, created_at DESC, id DESC);
-- One rolling bucket per session: bounded storage, shared across serverless workers.
CREATE TABLE IF NOT EXISTS participation_rate_limits (
  session_slug text PRIMARY KEY REFERENCES participation_sessions(slug),
  bucket timestamptz NOT NULL,
  count integer NOT NULL
);
INSERT INTO participation_sessions (slug, title) VALUES
  ('tree-talk', 'Trees we know'), ('rehearsal', 'Rehearsal · Trees we know')
ON CONFLICT DO NOTHING;

-- Also upgrade an existing questionnaire that previously required a story.
ALTER TABLE tree_responses DROP CONSTRAINT IF EXISTS tree_responses_story_check;
ALTER TABLE tree_responses ADD CONSTRAINT tree_responses_story_check CHECK (length(story) <= 500);
