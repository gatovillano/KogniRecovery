/**
 * Script de Migración - KogniRecovery
 * Crea las tablas necesarias en la base de datos PostgreSQL
 */

import { initDatabase, query, closePool } from '../config/database.js';

const MIGRATIONS = [
    // 1. Usuarios e IDs de Sesión
    `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'patient' CHECK (role IN ('patient', 'family', 'professional', 'admin')),
        phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        onboarding_completed BOOLEAN DEFAULT FALSE,
        profile_type VARCHAR(50),
        risk_level VARCHAR(20) CHECK (risk_level IN ('bajo', 'medio', 'alto', 'critico')),
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        two_factor_secret VARCHAR(255),
        llm_provider VARCHAR(20) DEFAULT 'openai' CHECK (llm_provider IN ('openai', 'anthropic', 'azure', 'local', 'openrouter', 'google')),
        llm_model VARCHAR(100),
        llm_api_key VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // Extensiones para tabla users existente
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_type VARCHAR(50)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS llm_provider VARCHAR(20) DEFAULT 'openai'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS llm_model VARCHAR(100)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS llm_api_key VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`,

    `CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        device_id VARCHAR(255),
        device_name VARCHAR(255),
        device_type VARCHAR(50),
        ip_address VARCHAR(45),
        user_agent TEXT,
        is_revoked BOOLEAN DEFAULT FALSE,
        is_used BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        revoked_at TIMESTAMP WITH TIME ZONE,
        issued_from VARCHAR(20) DEFAULT 'api',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 2. Perfiles y Preferencias
    `CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        profile_type VARCHAR(50) NOT NULL DEFAULT 'estandar',
        display_name VARCHAR(100),
        avatar_url TEXT,
        bio TEXT,
        age_range VARCHAR(50),
        gender VARCHAR(50),
        education_level VARCHAR(100),
        employment_status VARCHAR(100),
        primary_substance VARCHAR(100),
        substance_years_use INTEGER,
        previous_treatments BOOLEAN DEFAULT FALSE,
        has_relapse_history BOOLEAN DEFAULT FALSE,
        current_status VARCHAR(50) DEFAULT 'activo',
        treatment_start_date DATE,
        motivation_level INTEGER CHECK (motivation_level >= 1 AND motivation_level <= 10),
        preferred_language VARCHAR(10) DEFAULT 'es',
        notification_preferences JSONB DEFAULT '{"checkin": true, "chatbot": true, "emergency": true}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS profile_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
        checkin_frequency VARCHAR(20) DEFAULT 'diaria',
        checkin_reminder_time TIME DEFAULT '09:00',
        checkin_reminder_enabled BOOLEAN DEFAULT TRUE,
        data_sharing_enabled BOOLEAN DEFAULT FALSE,
        share_with_family BOOLEAN DEFAULT FALSE,
        share_progress_weekly BOOLEAN DEFAULT TRUE,
        anonymous_analytics BOOLEAN DEFAULT TRUE,
        auto_detect_crisis BOOLEAN DEFAULT TRUE,
        emergency_contacts_notified BOOLEAN DEFAULT TRUE,
        location_sharing_emergency BOOLEAN DEFAULT FALSE,
        chatbot_personality VARCHAR(50) DEFAULT 'apoyo',
        response_detail_level VARCHAR(20) DEFAULT 'balanceado',
        memory_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS substance_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        substance_id UUID,
        substance_name VARCHAR(100) NOT NULL,
        current_status VARCHAR(30) DEFAULT 'activo',
        use_frequency VARCHAR(50),
        last_use_date DATE,
        target_cease_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 3. Check-ins y Rachas
    `CREATE TABLE IF NOT EXISTS checkins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        checkin_type VARCHAR(30) NOT NULL DEFAULT 'diario',
        mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
        anxiety_score INTEGER CHECK (anxiety_score >= 1 AND anxiety_score <= 10),
        energy_score INTEGER CHECK (energy_score >= 1 AND energy_score <= 10),
        emotional_tags TEXT[] DEFAULT '{}',
        consumed_substances JSONB DEFAULT '[]'::jsonb,
        risk_situation BOOLEAN DEFAULT FALSE,
        risk_description TEXT,
        coping_strategy_used VARCHAR(100),
        sleep_hours DECIMAL(4,1),
        sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
        exercised_today BOOLEAN DEFAULT FALSE,
        exercise_minutes INTEGER,
        exercise_type VARCHAR(100),
        activities JSONB DEFAULT '[]'::jsonb,
        social_interaction VARCHAR(50) DEFAULT 'ninguna',
        notes TEXT,
        location JSONB,
        checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
        checkin_time TIME NOT NULL DEFAULT CURRENT_TIME,
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_completed BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_checkin_date UNIQUE (user_id, checkin_date)
    )`,

    `CREATE TABLE IF NOT EXISTS mood_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mood_date DATE NOT NULL DEFAULT CURRENT_DATE,
        mood_score INTEGER,
        anxiety_score INTEGER,
        energy_score INTEGER,
        emotional_tags TEXT[] DEFAULT '{}',
        weekly_average_mood DECIMAL(3,2),
        weekly_average_anxiety DECIMAL(3,2),
        weekly_average_energy DECIMAL(3,2),
        mood_trend VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_mood_date UNIQUE (user_id, mood_date)
    )`,

    `CREATE TABLE IF NOT EXISTS checkin_streaks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        streak_type VARCHAR(50) NOT NULL,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        total_completions INTEGER DEFAULT 0,
        last_completion_date DATE,
        streak_start_date DATE,
        longest_streak_start_date DATE,
        longest_streak_end_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_streak_type UNIQUE (user_id, streak_type)
    )`,

    // 4. Cravings y Estrategias
    `CREATE TABLE IF NOT EXISTS cravings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        substance_id UUID,
        substance_name VARCHAR(100) NOT NULL,
        intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
        status VARCHAR(30) DEFAULT 'active',
        triggers JSONB DEFAULT '[]'::jsonb,
        coping_strategies JSONB DEFAULT '[]'::jsonb,
        outcome VARCHAR(50),
        consumed_quantity DECIMAL(10,2),
        consumed_unit VARCHAR(50),
        consequences TEXT,
        location JSONB,
        craving_start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        craving_end_time TIMESTAMP WITH TIME ZONE,
        duration_minutes INTEGER,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS craving_patterns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        substance_id UUID,
        pattern_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        frequency_per_week DECIMAL(5,2),
        avg_intensity DECIMAL(3,2),
        common_triggers TEXT[] DEFAULT '{}',
        effective_strategies TEXT[] DEFAULT '{}',
        status VARCHAR(30) DEFAULT 'identified',
        first_observed DATE,
        last_observed DATE,
        occurrence_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS coping_strategies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        effectiveness_rating DECIMAL(3,2),
        times_used INTEGER DEFAULT 0,
        times_successful INTEGER DEFAULT 0,
        success_rate DECIMAL(3,2),
        instructions TEXT,
        when_to_use TEXT,
        resources JSONB DEFAULT '[]'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS strategy_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        strategy_id UUID NOT NULL REFERENCES coping_strategies(id) ON DELETE CASCADE,
        craving_id UUID REFERENCES cravings(id) ON DELETE SET NULL,
        was_effective BOOLEAN NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS craving_triggers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trigger_type VARCHAR(50) NOT NULL,
        trigger_description VARCHAR(255) NOT NULL,
        frequency VARCHAR(50),
        avg_intensity_when_triggered DECIMAL(3,2),
        consumption_probability DECIMAL(3,2),
        status VARCHAR(30) DEFAULT 'active',
        context_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 5. Conversaciones y Mensajes
    `CREATE TABLE IF NOT EXISTS scenario_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scenario_type VARCHAR(50) UNIQUE NOT NULL,
        scenario_name VARCHAR(100) NOT NULL,
        description TEXT,
        system_prompt TEXT NOT NULL,
        temperature DECIMAL(3,2) DEFAULT 0.7,
        max_tokens INTEGER DEFAULT 1000,
        enabled_skills TEXT[] DEFAULT '{}',
        trigger_conditions JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT TRUE,
        version VARCHAR(20) DEFAULT '1.0.0',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) DEFAULT 'Nueva conversación',
        scenario_type VARCHAR(50) DEFAULT 'apoyo_emocional',
        status VARCHAR(30) DEFAULT 'active',
        context JSONB DEFAULT '{}'::jsonb,
        message_count INTEGER DEFAULT 0,
        duration_minutes INTEGER,
        user_satisfaction INTEGER,
        helpfulness_rating INTEGER,
        relevance_rating INTEGER,
        contains_crisk BOOLEAN DEFAULT FALSE,
        escalated_to_emergency BOOLEAN DEFAULT FALSE,
        required_human_intervention BOOLEAN DEFAULT FALSE,
        scenario_completed BOOLEAN DEFAULT FALSE,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS conversation_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_number INTEGER NOT NULL,
        session_type VARCHAR(50),
        context_summary TEXT,
        user_mood_before VARCHAR(50),
        user_mood_after VARCHAR(50),
        emotional_state JSONB DEFAULT '{}'::jsonb,
        topics_discussed TEXT[] DEFAULT '{}',
        strategies_shared TEXT[] DEFAULT '{}',
        resources_recommended JSONB DEFAULT '[]'::jsonb,
        duration_seconds INTEGER,
        messages_in_session INTEGER DEFAULT 0,
        session_outcome TEXT,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        tokens_used INTEGER,
        active_scenario VARCHAR(50),
        content_filter_passed BOOLEAN DEFAULT TRUE,
        inappropriate_content_flags TEXT[] DEFAULT '{}',
        resources_included JSONB DEFAULT '[]'::jsonb,
        recommended_actions JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS message_attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        attachment_type VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        description TEXT,
        url TEXT,
        content JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS message_intents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        intent VARCHAR(100) NOT NULL,
        confidence DECIMAL(3,2),
        entities JSONB DEFAULT '{}'::jsonb,
        emotion_detected VARCHAR(50),
        emotion_confidence DECIMAL(3,2),
        suggested_scenario VARCHAR(50),
        is_crisis_indicator BOOLEAN DEFAULT FALSE,
        is_relapse_risk BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS quick_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trigger_phrase VARCHAR(255) NOT NULL,
        response_text TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        applicable_scenarios TEXT[] DEFAULT '{}',
        priority INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        language VARCHAR(10) DEFAULT 'es',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS context_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        context_type VARCHAR(50) NOT NULL,
        key VARCHAR(100) NOT NULL,
        value JSONB NOT NULL,
        source_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
        importance INTEGER DEFAULT 5,
        times_referenced INTEGER DEFAULT 1,
        last_referenced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, context_type, key)
    )`,

    `CREATE TABLE IF NOT EXISTS llm_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
        model VARCHAR(100),
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        total_tokens INTEGER,
        response_text TEXT,
        finish_reason VARCHAR(50),
        latency_ms INTEGER,
        cost_usd DECIMAL(12,8),
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 7. Familia, Emergencias y Notificaciones
    `CREATE TABLE IF NOT EXISTS sharing_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        family_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'revoked')),
        invitation_code VARCHAR(10) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (patient_id, family_id)
    )`,

    `CREATE TABLE IF NOT EXISTS emergency_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        contact_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        relationship VARCHAR(50),
        phone VARCHAR(20) NOT NULL,
        is_notified_on_crisis BOOLEAN DEFAULT TRUE,
        priority INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB DEFAULT '{}'::jsonb,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS wall_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        family_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        emoji VARCHAR(10),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    // 6. Índices y Triggers adicionales
    `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)`,
    `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)`,
    
    // 8. Bitácora Modular (Journal)
    `CREATE TABLE IF NOT EXISTS daily_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        note_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS habit_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        protective_habits TEXT NOT NULL DEFAULT '',
        risk_habits TEXT NOT NULL DEFAULT '',
        entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS social_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        people_description TEXT NOT NULL DEFAULT '',
        impact_assessment TEXT NOT NULL DEFAULT '',
        entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS activity_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_name VARCHAR(255) NOT NULL DEFAULT '',
        feeling_before TEXT NOT NULL DEFAULT '',
        feeling_during TEXT NOT NULL DEFAULT '',
        feeling_after TEXT NOT NULL DEFAULT '',
        entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS consumption_analysis (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trigger_situation TEXT NOT NULL DEFAULT '',
        action_taken TEXT NOT NULL DEFAULT '',
        entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE INDEX IF NOT EXISTS idx_daily_notes_user_date ON daily_notes(user_id, note_date)`,
    `CREATE INDEX IF NOT EXISTS idx_habit_entries_user_date ON habit_entries(user_id, entry_date)`,
    `CREATE INDEX IF NOT EXISTS idx_social_entries_user_date ON social_entries(user_id, entry_date)`,
    `CREATE INDEX IF NOT EXISTS idx_activity_entries_user_date ON activity_entries(user_id, entry_date)`,
    `CREATE INDEX IF NOT EXISTS idx_consumption_analysis_user_date ON consumption_analysis(user_id, entry_date)`,

    `CREATE TABLE IF NOT EXISTS habits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        frequency VARCHAR(50) DEFAULT 'daily',
        habit_type VARCHAR(20) DEFAULT 'positive' CHECK (habit_type IN ('positive', 'negative')),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS habit_completions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (habit_id, user_id, completed_at)
    )`,

    `CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, completed_at)`,

    `ALTER TABLE habits ADD COLUMN IF NOT EXISTS habit_type VARCHAR(20) DEFAULT 'positive' CHECK (habit_type IN ('positive', 'negative'))`,

    `CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;`
];

const TRIGGERS = [
    `CREATE OR REPLACE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_profiles_timestamp BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_settings_timestamp BEFORE UPDATE ON profile_settings FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_substances_timestamp BEFORE UPDATE ON substance_preferences FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_checkins_timestamp BEFORE UPDATE ON checkins FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_mood_timestamp BEFORE UPDATE ON mood_history FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_streaks_timestamp BEFORE UPDATE ON checkin_streaks FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_cravings_timestamp BEFORE UPDATE ON cravings FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_patterns_timestamp BEFORE UPDATE ON craving_patterns FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_coping_timestamp BEFORE UPDATE ON coping_strategies FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_triggers_timestamp BEFORE UPDATE ON craving_triggers FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_scenarios_timestamp BEFORE UPDATE ON scenario_configs FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_conversations_timestamp BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_sessions_timestamp BEFORE UPDATE ON conversation_sessions FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_invitations_timestamp BEFORE UPDATE ON sharing_invitations FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_emergency_contacts_timestamp BEFORE UPDATE ON emergency_contacts FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_wall_messages_timestamp BEFORE UPDATE ON wall_messages FOR EACH ROW EXECUTE FUNCTION update_timestamp();`,
    `CREATE OR REPLACE TRIGGER update_habits_timestamp BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_timestamp();`
];

async function runMigrations() {
    try {
        console.log('🔄 Iniciando migraciones de base de datos...');
        await initDatabase();

        // Asegurar extensión uuid-ossp
        await query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

        for (const migration of MIGRATIONS) {
            console.log(`Executing migration step...`);
            await query(migration);
        }

        for (const trigger of TRIGGERS) {
            console.log(`Configuring trigger...`);
            await query(trigger);
        }

        console.log('✅ Migraciones completadas exitosamente');
    } catch (error) {
        console.error('❌ Error durante las migraciones:', error);
        process.exit(1);
    } finally {
        await closePool();
        process.exit(0);
    }
}

runMigrations();
