# Quest System Setup Guide

## Issue: Penalty Quests Not Showing After Midnight

The penalty quest system is designed to show penalty quests when a user hasn't completed yesterday's quests after 12:00 AM. Here's what needs to be set up:

## 1. Database Tables Setup

The quest system requires two database tables that may not exist yet. You need to run the SQL script in your Supabase dashboard:

### Option A: Use the SQL Script

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `setup-quest-tables.sql`
4. Run the script

### Option B: Use the Migration File

If you have Supabase CLI set up:

```bash
npx supabase db push
```

## 2. How Penalty Quests Work

The penalty quest system works as follows:

1. **Daily Quest Generation**: Regular quests are generated with a 24-hour deadline
2. **Midnight Check**: After 12:00 AM, the system checks for:
   - Quests with expired deadlines (deadline < current time)
   - Quests created yesterday or earlier that weren't completed
3. **Penalty Generation**: For each incomplete quest from yesterday, a penalty quest is created
4. **Display**: Penalty quests appear in a separate "Penalty Quests" section below regular quests

## 3. Debugging

The system now includes extensive logging to help debug issues:

### API Logs

- Check the browser console for API response logs
- Look for "Current time", "Yesterday midnight", and quest analysis logs
- The API will log when penalty quests are created

### UI Debug Section

- A debug section at the bottom shows quest counts
- This helps verify if penalty quests are being received by the frontend

### Test Endpoint

- Use `/api/quests/test-penalty` to manually test penalty quest generation
- This creates a test quest from yesterday and triggers penalty generation

## 4. Common Issues

### Tables Don't Exist

**Error**: "relation 'quests' does not exist"
**Solution**: Run the database setup script

### No Penalty Quests Showing

**Possible Causes**:

1. All quests were completed yesterday
2. No quests were created yesterday
3. Database tables don't exist
4. RLS policies blocking access

### Check These:

1. Verify tables exist: `SELECT * FROM quests LIMIT 1;`
2. Check for incomplete quests: `SELECT * FROM quests WHERE status != 'completed';`
3. Look at browser console for API response logs
4. Check the debug section in the UI

## 5. Testing the System

1. **Create a test quest**: Use the test endpoint to create a quest from yesterday
2. **Check penalty generation**: The system should automatically create a penalty quest
3. **Verify display**: Penalty quests should appear in the red "Penalty Quests" section

## 6. Manual Database Check

Run these queries in Supabase SQL Editor to check the current state:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('quests', 'user_quest_progress');

-- Check for incomplete quests
SELECT * FROM quests WHERE status != 'completed' ORDER BY created_at DESC;

-- Check for penalty quests
SELECT * FROM quests WHERE type = 'penalty' ORDER BY created_at DESC;
```

## 7. Next Steps

1. Run the database setup script
2. Refresh the quests page
3. Check browser console for logs
4. If still no penalty quests, use the test endpoint to verify the system works
5. Check if there are actually incomplete quests from yesterday
