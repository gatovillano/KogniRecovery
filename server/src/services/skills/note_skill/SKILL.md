# Skill: note_skill (Notas)

## Description

This skill allows the agent (LÚA) to save, list, and delete personal notes for the user. Notes are stored in the `agent_notes` table with a `source` field indicating whether the note was created by the user or the agent.

## Capabilities

### 1. save_note

- **Purpose**: Save a personal note for the user.
- **When to use**: When the user asks to save something, when the agent identifies a valuable insight, or when the agent wants to remind the user of something important.
- **Input**: `userId` (String), `title` (String, optional), `content` (String, required), `category` (String, optional)

### 2. list_notes

- **Purpose**: List saved notes for the user.
- **When to use**: When the user asks about their notes or wants to see what's saved.
- **Input**: `userId` (String), `source` (String, optional: 'user' or 'agent')

### 3. delete_note

- **Purpose**: Delete a specific note.
- **When to use**: When the user asks to delete a specific note.
- **Input**: `userId` (String), `noteId` (String)

---

**Note**: Always use `source: 'agent'` when saving notes on behalf of the user. The `source: 'user'` is reserved for notes created directly by the user through the Notes screen.
