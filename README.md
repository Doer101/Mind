## Leveling System

- Users earn XP (user_xp) by completing quests (XP is awarded based on quest xp_reward).
- The users table now has a user_xp column.
- The user_levels table defines the XP required for each level (1-50).
- The dashboard navbar displays the user's current level and XP progress.
- Level and XP are calculated dynamically based on user_xp and user_levels.

### Database Changes

- Added user_xp column to users table.
- Added user_levels table (level, xp_required) and prepopulated for levels 1-50.

### How it works

- When a quest is completed, the user's XP is incremented by the quest's xp_reward.
- The frontend fetches user_xp and user_levels to display the current level and XP progress.
