# Skill: document_skill (Documentos de la Base de Conocimientos)

## Description
This skill provides access to the clinical and educational documentation stored in the knowledge base. It allows for semantic search (RAG), listing all available files, and reading the complete content of specific documents.

## Capabilities

### 1. rag_search
- **Purpose**: Search for relevant snippets using semantic similarity.
- **When to use**: To answer specific clinical or supportive questions.
- **Input**: `query` (String)

### 2. list_documents
- **Purpose**: List all filenames in the knowledge base.
- **When to use**: To explore available documentation.
- **Input**: None.

### 3. get_document_content
- **Purpose**: Retrieve the full text of a specific file.
- **When to use**: When deep context or a specific document read is required.
- **Input**: `filename` (String)

---
**Note**: Always prefer `rag_search` for quick answers and `get_document_content` only when the full context of a known file is necessary.
