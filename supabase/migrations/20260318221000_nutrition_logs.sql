-- Migration for Advanced Nutrition Module (Level 4)
-- Creates the nutrition_logs table to track daily water intake and manual macro overrides

CREATE TABLE IF NOT EXISTS "public"."nutrition_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "water_ml" INTEGER NOT NULL DEFAULT 0,
    "manual_macros" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    UNIQUE ("user_id", "date")
);

-- Enable RLS
ALTER TABLE "public"."nutrition_logs" ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own nutrition logs" 
    ON "public"."nutrition_logs" 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition logs" 
    ON "public"."nutrition_logs" 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition logs" 
    ON "public"."nutrition_logs" 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition logs" 
    ON "public"."nutrition_logs" 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Trigger for updated_at (assuming update_updated_at_column function exists from previous migration)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_nutrition_logs_modtime'
    ) THEN
        CREATE TRIGGER update_nutrition_logs_modtime
        BEFORE UPDATE ON "public"."nutrition_logs"
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;
