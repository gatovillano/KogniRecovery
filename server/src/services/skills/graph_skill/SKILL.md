# Skill: knowledge_graph_search

## Description
This skill allows the agent to query the User's Knowledge Graph (Neo4j) to retrieve specific context about the user, such as their profile, drugs they use, recent check-ins, cravings, and potential drug interactions.

## When to Use
- To understand the user's specific history and current state.
- To check for drugs or medications the user is taking.
- To retrieve recent emotional patterns (check-ins).
- To find out about recent cravings and their triggers.
- To verify if a user's current situation has a historical context in the graph.

## Inputs
- `userId`: (String) The unique identifier of the user. (Required)

## Output
A JSON object containing various context nodes and relationships from the graph.
