ALTER TABLE module_quest_templates
ADD COLUMN IF NOT EXISTS sub_module_id uuid REFERENCES sub_modules(id) ON DELETE CASCADE;
