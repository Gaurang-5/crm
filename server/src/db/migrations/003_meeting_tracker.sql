CREATE TABLE meeting_links (
  id UUID PRIMARY KEY,
  destination_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','INACTIVE')),
  created_by VARCHAR(50) REFERENCES coaches(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deactivated_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX meeting_one_active ON meeting_links(status) WHERE status='ACTIVE';
CREATE TABLE meeting_visits (
  id UUID PRIMARY KEY,
  token_hash TEXT UNIQUE NOT NULL,
  visitor_hash TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX meeting_visit_date ON meeting_visits((data->>'first_seen_at'));
CREATE INDEX meeting_visit_status ON meeting_visits((data->>'status'));
CREATE INDEX meeting_visitor ON meeting_visits(visitor_hash);
CREATE TABLE public_submissions (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE meeting_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_submissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS lead_sources_person_created_idx ON lead_sources(person_id,created_at DESC);
