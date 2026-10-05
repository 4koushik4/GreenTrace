-- Measured waste inputs for transparent, user-scoped climate impact estimates.
CREATE TABLE IF NOT EXISTS public.waste_weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('biodegradable','recyclable','hazardous','organic','non-recyclable')),
  material_type TEXT NOT NULL CHECK (material_type IN ('plastic','paper','glass','metal','organic','e_waste','other')),
  weight_kg NUMERIC(10,3) NOT NULL CHECK (weight_kg > 0),
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  location TEXT NOT NULL,
  disposal_method TEXT NOT NULL CHECK (disposal_method IN ('Recycling','Composting','Landfill','Reuse','Safe collection')),
  recycled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS waste_weight_records_user_date_idx
  ON public.waste_weight_records(user_id, recorded_at DESC);

ALTER TABLE public.waste_weight_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own waste weight records" ON public.waste_weight_records;
CREATE POLICY "Users manage own waste weight records"
  ON public.waste_weight_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waste_weight_records TO authenticated;
