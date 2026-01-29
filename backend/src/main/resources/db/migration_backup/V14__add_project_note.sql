-- V14: Add note field to projects table
-- Allows users to add notes when editing a project.

ALTER TABLE projects ADD COLUMN note TEXT;

COMMENT ON COLUMN projects.note IS 'Optional note for project, can be added/edited after project creation';
