-- =====================================================
-- GreenTrace Smart Waste Management Database Schema
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- User Profiles Table
-- =====================================================
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    points INTEGER DEFAULT 0,
    level TEXT DEFAULT 'Beginner',
    eco_score INTEGER DEFAULT 0,
    waste_classified INTEGER DEFAULT 0,
    joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location JSONB,
    preferences JSONB DEFAULT '{"notifications": true, "dark_mode": false, "language": "en"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Waste Classifications Table
-- =====================================================
CREATE TABLE public.waste_classifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    image_url TEXT,
    classification TEXT CHECK (classification IN ('biodegradable', 'recyclable', 'hazardous')),
    confidence DECIMAL(5,2),
    points_earned INTEGER DEFAULT 0,
    location JSONB,
    details JSONB,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Rewards and Achievements
-- =====================================================
CREATE TABLE public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    points_required INTEGER,
    badge_type TEXT DEFAULT 'bronze',
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User achievements junction table
CREATE TABLE public.user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- Rewards System
-- =====================================================
CREATE TABLE public.rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('discount', 'product', 'service', 'donation')),
    cost_in_points INTEGER,
    category TEXT,
    provider TEXT,
    image_url TEXT,
    available BOOLEAN DEFAULT TRUE,
    stock INTEGER,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User reward redemptions
CREATE TABLE public.reward_redemptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE,
    points_used INTEGER,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    redemption_code TEXT,
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Recycling Centers
-- =====================================================
CREATE TABLE public.recycling_centers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    location POINT,
    accepted_types TEXT[],
    hours TEXT,
    contact TEXT,
    website TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- User Activity and Analytics
-- =====================================================
CREATE TABLE public.user_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    activity_type TEXT,
    description TEXT,
    points_earned INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Leaderboards
-- =====================================================
CREATE TABLE public.leaderboard_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    timeframe TEXT CHECK (timeframe IN ('daily', 'weekly', 'monthly', 'all_time')),
    category TEXT CHECK (category IN ('global', 'local', 'friends')),
    points INTEGER DEFAULT 0,
    rank INTEGER,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, timeframe, category)
);

-- =====================================================
-- Storage Buckets (for file uploads)
-- =====================================================
-- These will be created through Supabase Storage interface
-- user-avatars (public bucket)
-- waste-images (public bucket) 
-- classification-data (private bucket)

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Waste classifications policies
CREATE POLICY "Users can view own classifications" ON public.waste_classifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own classifications" ON public.waste_classifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User achievements policies
CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Reward redemptions policies
CREATE POLICY "Users can view own redemptions" ON public.reward_redemptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions" ON public.reward_redemptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User activities policies
CREATE POLICY "Users can view own activities" ON public.user_activities
    FOR SELECT USING (auth.uid() = user_id);

-- Public read access for certain tables
CREATE POLICY "Anyone can view achievements" ON public.achievements
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view rewards" ON public.rewards
    FOR SELECT USING (available = true);

CREATE POLICY "Anyone can view recycling centers" ON public.recycling_centers
    FOR SELECT USING (verified = true);

-- Enable RLS for new tables
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_qr_codes ENABLE ROW LEVEL SECURITY;

-- User locations policies
CREATE POLICY "Users can view own location" ON public.user_locations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own location" ON public.user_locations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location" ON public.user_locations
    FOR UPDATE USING (auth.uid() = user_id);

-- User QR codes policies
CREATE POLICY "Users can view own QR code" ON public.user_qr_codes
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update user points and level
CREATE OR REPLACE FUNCTION public.update_user_points(user_uuid UUID, points_to_add INTEGER)
RETURNS VOID AS $$
DECLARE
    current_points INTEGER;
    new_level TEXT;
BEGIN
    -- Update points
    UPDATE public.user_profiles 
    SET points = points + points_to_add,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Get updated points
    SELECT points INTO current_points 
    FROM public.user_profiles 
    WHERE id = user_uuid;
    
    -- Calculate new level
    new_level := CASE 
        WHEN current_points >= 10000 THEN 'Environmental Champion'
        WHEN current_points >= 5000 THEN 'Eco Expert'
        WHEN current_points >= 2000 THEN 'Green Warrior'
        WHEN current_points >= 1000 THEN 'Eco Enthusiast'
        WHEN current_points >= 500 THEN 'Green Starter'
        ELSE 'Beginner'
    END;
    
    -- Update level if changed
    UPDATE public.user_profiles 
    SET level = new_level 
    WHERE id = user_uuid AND level != new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate leaderboard rankings
CREATE OR REPLACE FUNCTION public.update_leaderboards()
RETURNS VOID AS $$
BEGIN
    -- Update weekly leaderboard
    DELETE FROM public.leaderboard_entries WHERE timeframe = 'weekly';
    
    INSERT INTO public.leaderboard_entries (user_id, timeframe, category, points, rank)
    SELECT 
        up.id,
        'weekly',
        'global',
        COALESCE(SUM(ua.points_earned), 0) as total_points,
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ua.points_earned), 0) DESC)
    FROM public.user_profiles up
    LEFT JOIN public.user_activities ua ON up.id = ua.user_id 
        AND ua.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY up.id;
    
    -- Update monthly leaderboard
    DELETE FROM public.leaderboard_entries WHERE timeframe = 'monthly';
    
    INSERT INTO public.leaderboard_entries (user_id, timeframe, category, points, rank)
    SELECT 
        up.id,
        'monthly',
        'global',
        COALESCE(SUM(ua.points_earned), 0) as total_points,
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(ua.points_earned), 0) DESC)
    FROM public.user_profiles up
    LEFT JOIN public.user_activities ua ON up.id = ua.user_id 
        AND ua.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY up.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Initial Data
-- =====================================================

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, points_required, badge_type, category) VALUES
('First Sort', 'Classified your first waste item', '🥇', 0, 'bronze', 'classification'),
('Eco Warrior', 'Classified 50 waste items', '🌱', 500, 'silver', 'classification'),
('Plastic Saver', 'Classified 25 plastic items', '♻️', 250, 'bronze', 'plastic'),
('Green Champion', 'Earned 1000 points', '🏆', 1000, 'gold', 'points'),
('Streak Master', 'Maintained 7-day streak', '🔥', 100, 'silver', 'streak'),
('Community Helper', 'Helped verify 10 classifications', '🤝', 200, 'silver', 'community'),
('Accuracy Expert', 'Achieved 95% accuracy', '🎯', 300, 'gold', 'accuracy');

-- Insert sample rewards
INSERT INTO public.rewards (name, description, type, cost_in_points, category, provider, available) VALUES
('10% Off Eco Products', 'Get 10% discount on sustainable products', 'discount', 100, 'sustainable_products', 'EcoStore', true),
('Plant a Tree', 'Fund planting one tree through our partner', 'donation', 250, 'environment', 'TreeFund', true),
('Reusable Water Bottle', 'Premium stainless steel water bottle', 'product', 500, 'sustainable_products', 'EcoGoods', true),
('Eco Workshop Access', 'Free access to sustainability workshop', 'service', 300, 'education', 'GreenLearn', true),
('Carbon Offset Credits', 'Offset 1 ton of CO2 emissions', 'donation', 1000, 'environment', 'CarbonNeutral', true);

-- =====================================================
-- User Locations Table
-- =====================================================
CREATE TABLE public.user_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    zone TEXT,
    region TEXT NOT NULL,
    ward_number TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- One location per user
);

-- =====================================================
-- User QR Codes Table
-- =====================================================
CREATE TABLE public.user_qr_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    qr_code TEXT NOT NULL UNIQUE,
    qr_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- One QR code per user
);
