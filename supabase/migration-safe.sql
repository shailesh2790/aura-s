-- ============================================================================
-- AURA OS Memory System - Safe Migration/Update Script
-- Run this if you get "relation already exists" errors
-- ============================================================================

-- This script will:
-- 1. Drop existing tables if they exist (CASCADE to handle dependencies)
-- 2. Recreate everything fresh
-- 3. Safe to run multiple times

-- ============================================================================
-- STEP 1: Clean up existing objects
-- ============================================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS memory_stats CASCADE;
DROP VIEW IF EXISTS experience_stats CASCADE;
DROP VIEW IF EXISTS proactive_summary CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_factual_memory_updated_at ON factual_memory;
DROP TRIGGER IF EXISTS update_experiential_memory_updated_at ON experiential_memory;
DROP TRIGGER IF EXISTS update_proactive_actions_updated_at ON proactive_actions;
DROP TRIGGER IF EXISTS update_capabilities_updated_at ON capabilities;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_success_rate(capabilities);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables (CASCADE will drop RLS policies automatically)
DROP TABLE IF EXISTS factual_memory CASCADE;
DROP TABLE IF EXISTS experiential_memory CASCADE;
DROP TABLE IF EXISTS proactive_actions CASCADE;
DROP TABLE IF EXISTS reflections CASCADE;
DROP TABLE IF EXISTS capabilities CASCADE;

-- ============================================================================
-- STEP 2: Enable required extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For pgvector (semantic search)

-- ============================================================================
-- STEP 3: Create tables fresh
-- ============================================================================

-- FACTUAL MEMORY TABLE
CREATE TABLE factual_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fact', 'rule', 'entity', 'relation', 'preference')),
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  confidence FLOAT NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  tags TEXT[] DEFAULT '{}',
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EXPERIENTIAL MEMORY TABLE
CREATE TABLE experiential_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('success', 'failure', 'pattern', 'lesson', 'optimization')),
  context TEXT NOT NULL,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL,
  reflection TEXT NOT NULL,
  learned_skills TEXT[] DEFAULT '{}',
  related_memories UUID[] DEFAULT '{}',
  importance FLOAT NOT NULL DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PROACTIVE ACTIONS TABLE
CREATE TABLE proactive_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('suggestion', 'reminder', 'optimization', 'learning', 'automation')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_impact FLOAT NOT NULL DEFAULT 0.5 CHECK (estimated_impact >= 0 AND estimated_impact <= 1),
  required_approval BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'suggested' CHECK (status IN ('suggested', 'approved', 'executing', 'completed', 'rejected')),
  scheduled_for TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  outcome TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REFLECTIONS TABLE
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_runs INTEGER NOT NULL DEFAULT 0,
  success_rate FLOAT NOT NULL DEFAULT 0,
  top_patterns TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  challenges TEXT[] DEFAULT '{}',
  insights TEXT[] DEFAULT '{}',
  actions_proposed JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CAPABILITIES TABLE
CREATE TABLE capabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tool', 'pattern', 'workflow', 'knowledge')),
  learned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  proficiency FLOAT NOT NULL DEFAULT 0.5 CHECK (proficiency >= 0 AND proficiency <= 1),
  usage_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  related_memories UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: Create indexes
-- ============================================================================

-- Factual memory indexes
CREATE INDEX idx_factual_memory_user_id ON factual_memory(user_id);
CREATE INDEX idx_factual_memory_type ON factual_memory(type);
CREATE INDEX idx_factual_memory_created_at ON factual_memory(created_at DESC);
CREATE INDEX idx_factual_memory_tags ON factual_memory USING GIN(tags);
CREATE INDEX idx_factual_memory_embedding ON factual_memory USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- Experiential memory indexes
CREATE INDEX idx_experiential_memory_user_id ON experiential_memory(user_id);
CREATE INDEX idx_experiential_memory_type ON experiential_memory(type);
CREATE INDEX idx_experiential_memory_importance ON experiential_memory(importance DESC);
CREATE INDEX idx_experiential_memory_created_at ON experiential_memory(created_at DESC);
CREATE INDEX idx_experiential_memory_skills ON experiential_memory USING GIN(learned_skills);

-- Proactive actions indexes
CREATE INDEX idx_proactive_actions_user_id ON proactive_actions(user_id);
CREATE INDEX idx_proactive_actions_status ON proactive_actions(status);
CREATE INDEX idx_proactive_actions_priority ON proactive_actions(priority);
CREATE INDEX idx_proactive_actions_scheduled ON proactive_actions(scheduled_for);

-- Reflections indexes
CREATE INDEX idx_reflections_user_id ON reflections(user_id);
CREATE INDEX idx_reflections_period ON reflections(period_start, period_end);
CREATE INDEX idx_reflections_created_at ON reflections(created_at DESC);

-- Capabilities indexes
CREATE INDEX idx_capabilities_user_id ON capabilities(user_id);
CREATE INDEX idx_capabilities_type ON capabilities(type);
CREATE INDEX idx_capabilities_proficiency ON capabilities(proficiency DESC);
CREATE INDEX idx_capabilities_usage ON capabilities(usage_count DESC);

-- ============================================================================
-- STEP 5: Enable RLS and create policies
-- ============================================================================

-- Factual memory RLS
ALTER TABLE factual_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own factual memories"
  ON factual_memory FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own factual memories"
  ON factual_memory FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own factual memories"
  ON factual_memory FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own factual memories"
  ON factual_memory FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Experiential memory RLS
ALTER TABLE experiential_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own experiential memories"
  ON experiential_memory FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experiential memories"
  ON experiential_memory FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experiential memories"
  ON experiential_memory FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experiential memories"
  ON experiential_memory FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Proactive actions RLS
ALTER TABLE proactive_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own proactive actions"
  ON proactive_actions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proactive actions"
  ON proactive_actions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proactive actions"
  ON proactive_actions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proactive actions"
  ON proactive_actions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Reflections RLS
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reflections"
  ON reflections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reflections"
  ON reflections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Capabilities RLS
ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own capabilities"
  ON capabilities FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own capabilities"
  ON capabilities FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own capabilities"
  ON capabilities FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own capabilities"
  ON capabilities FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 6: Create helper functions
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_success_rate(cap capabilities)
RETURNS FLOAT AS $$
BEGIN
  IF cap.usage_count = 0 THEN
    RETURN 0;
  END IF;
  RETURN cap.success_count::FLOAT / cap.usage_count::FLOAT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: Create triggers
-- ============================================================================

CREATE TRIGGER update_factual_memory_updated_at
  BEFORE UPDATE ON factual_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiential_memory_updated_at
  BEFORE UPDATE ON experiential_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proactive_actions_updated_at
  BEFORE UPDATE ON proactive_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_capabilities_updated_at
  BEFORE UPDATE ON capabilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 8: Create views
-- ============================================================================

CREATE VIEW memory_stats AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE type = 'fact') as fact_count,
  COUNT(*) FILTER (WHERE type = 'rule') as rule_count,
  COUNT(*) FILTER (WHERE type = 'preference') as preference_count,
  AVG(confidence) as avg_confidence,
  MIN(created_at) as oldest_memory,
  MAX(created_at) as newest_memory
FROM factual_memory
GROUP BY user_id;

CREATE VIEW experience_stats AS
SELECT
  em.user_id,
  COUNT(*) FILTER (WHERE em.type = 'success') as success_count,
  COUNT(*) FILTER (WHERE em.type = 'failure') as failure_count,
  COUNT(*) FILTER (WHERE em.type = 'pattern') as pattern_count,
  AVG(em.importance) as avg_importance,
  COALESCE(skills.unique_skills_learned, 0) as unique_skills_learned
FROM experiential_memory em
LEFT JOIN (
  SELECT
    user_id,
    COUNT(DISTINCT skill) as unique_skills_learned
  FROM experiential_memory,
  LATERAL unnest(learned_skills) AS skill
  GROUP BY user_id
) skills ON em.user_id = skills.user_id
GROUP BY em.user_id, skills.unique_skills_learned;

CREATE VIEW proactive_summary AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE status = 'suggested') as pending_suggestions,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_actions,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_actions,
  AVG(estimated_impact) FILTER (WHERE status = 'completed') as avg_impact
FROM proactive_actions
GROUP BY user_id;

-- ============================================================================
-- Done!
-- ============================================================================

-- Verify tables were created
SELECT
  'factual_memory' as table_name,
  COUNT(*) as row_count
FROM factual_memory
UNION ALL
SELECT
  'experiential_memory',
  COUNT(*)
FROM experiential_memory
UNION ALL
SELECT
  'proactive_actions',
  COUNT(*)
FROM proactive_actions
UNION ALL
SELECT
  'reflections',
  COUNT(*)
FROM reflections
UNION ALL
SELECT
  'capabilities',
  COUNT(*)
FROM capabilities;
