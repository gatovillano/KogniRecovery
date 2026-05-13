  private async memoryNode(
    state: typeof AgentState.State
  ): Promise<Partial<typeof AgentState.State>> {
    console.log('[MEMORY-NODE] >>> INICIO <<<', 'userId:', state.userId);
    const lastMessage = state.messages[state.messages.length - 1];
    console.log('[MEMORY-NODE] lastMessage role:', lastMessage?.role, 'isHuman:', lastMessage instanceof HumanMessage);

    // Leer preferencias previas para contexto
    console.log('[MEMORY-NODE] Recuperando memoria contextual...');
    const memoryContext = await memoryService.retrieveMemoryContext(state.userId);
    console.log('[MEMORY-NODE] Contexto recuperado, longitud:', memoryContext.length);

    // Extraer nueva memoria del usuario si es posible
    if (lastMessage && lastMessage instanceof HumanMessage) {
      try {
        const contentStr = lastMessage.content.toString();
        console.log('[MEMORY-NODE] Extrayendo memorias de mensaje:', contentStr.substring(0, 100) + '...');
        const memories = await memoryService.extractMemories(
          state.userId,
          contentStr
        );
        console.log('[MEMORY-NODE] Memories extraídas:', memories.length);
        
        if (memories.length > 0) {
          console.log('[MEMORY-NODE] Guardando en DB y Neo4j...');
          await memoryService.persistMemories(state.userId, memories);
          console.log(`[MEMORY-NODE] ✓ Persistidas ${memories.length} memorias`);
        } else {
          console.log('[MEMORY-NODE] No hay memorias nuevas');
        }
      } catch (err) {
        console.error('[MEMORY-NODE] ❌ Error:', err);
      }
    } else {
      console.log('[MEMORY-NODE] No es HumanMessage, saltando extracción');
    }

    const fullContext = {
      ...state.userContext,
      historicalMemory: memoryContext,
    };

    console.log('[MEMORY-NODE] >>> FIN <<<');
    return { userContext: fullContext };
  }
