-- Add attachment_paths to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachment_paths TEXT[] DEFAULT '{}';

-- Fix existing task content to be more explanatory
UPDATE public.tasks 
SET description = description || E'\n\n**Connection Info:**\nUse the in-browser terminal or connect via SSH if provided.'
WHERE room_id IN (SELECT id FROM public.rooms WHERE title ILIKE '%Terminal%');
