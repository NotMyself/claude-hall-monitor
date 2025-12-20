-- SQLite schema for metrics system
--
-- This schema implements the data layer for metric collection using SQLite.
-- Follows patterns from code/sql.md with proper indexing for performance.

-- Core metrics table stores all metric entries
CREATE TABLE IF NOT EXISTS metrics (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  session_id TEXT NOT NULL,
  project_path TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('hook', 'transcript', 'telemetry', 'custom')),
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL CHECK(event_category IN ('tool', 'api', 'session', 'user', 'custom')),
  model TEXT,
  tokens_json TEXT, -- JSON serialized TokenUsage
  cost_json TEXT, -- JSON serialized CostBreakdown
  tool_name TEXT,
  tool_duration_ms INTEGER,
  tool_success INTEGER, -- 0 = false, 1 = true, NULL = not applicable
  data_json TEXT NOT NULL, -- JSON serialized additional data
  tags_json TEXT NOT NULL, -- JSON serialized array of strings
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_metrics_session ON metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_event_type ON metrics(event_type);
CREATE INDEX IF NOT EXISTS idx_metrics_model ON metrics(model);
CREATE INDEX IF NOT EXISTS idx_metrics_session_timestamp ON metrics(session_id, timestamp);

-- Plan events table for orchestration tracking
CREATE TABLE IF NOT EXISTS plan_events (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  plan_path TEXT NOT NULL,
  feature_id TEXT,
  feature_description TEXT,
  status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')),
  pr_url TEXT,
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for plan events
CREATE INDEX IF NOT EXISTS idx_plan_events_plan_name ON plan_events(plan_name);
CREATE INDEX IF NOT EXISTS idx_plan_events_timestamp ON plan_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_plan_events_session ON plan_events(session_id);
CREATE INDEX IF NOT EXISTS idx_plan_events_feature ON plan_events(feature_id);

-- Aggregations table for time-window summaries
CREATE TABLE IF NOT EXISTS metric_aggregations (
  id TEXT PRIMARY KEY,
  period_type TEXT NOT NULL CHECK(period_type IN ('hour', 'day', 'week', 'month')),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK(metric_type IN ('count', 'cost', 'tokens')),
  group_by TEXT, -- 'model', 'event_type', 'session', or NULL for overall
  group_value TEXT, -- Value of the group_by field
  value REAL NOT NULL,
  data_json TEXT, -- Additional aggregation details
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(period_type, period_start, metric_type, group_by, group_value)
);

-- Indexes for aggregations
CREATE INDEX IF NOT EXISTS idx_agg_period ON metric_aggregations(period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_agg_metric_type ON metric_aggregations(metric_type);
CREATE INDEX IF NOT EXISTS idx_agg_group ON metric_aggregations(group_by, group_value);
