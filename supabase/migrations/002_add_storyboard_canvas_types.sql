-- Add 'canvas' and 'storyboard' to allowed asset types
-- Drop the existing check constraint and recreate with new values
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_type_check;
ALTER TABLE assets ADD CONSTRAINT assets_type_check
  CHECK (type IN ('image', 'video', 'script', 'character', 'scene', 'canvas', 'storyboard'));
