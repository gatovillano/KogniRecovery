/**
 * Script de Ingesta de Conocimientos (RAG)
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 * 
 * Este script lee todos los documentos en /knowledge_base
 * los divide en chunks, genera sus embeddings usando OpenAI
 * y los guarda en Neo4j.
 */

import fs from 'fs';
import path from 'path';
import { embeddingsService, chunkingService } from '../services/embedding.service.js';
import { neo4jService } from '../services/neo4j.service.js';

// Base directory for knowledge files
const KNOWLEDGE_BASE_DIR = path.resolve(process.cwd(), 'knowledge_base');

async function processFile(filePath: string, source: string, category: string) {
    const ext = path.extname(filePath).toLowerCase();
    let text = '';

    try {
        if (ext === '.txt' || ext === '.md') {
            text = fs.readFileSync(filePath, 'utf-8');
        } else if (ext === '.pdf') {
            try {
                const pdfParse = (await import('pdf-parse')).default;
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdfParse(dataBuffer);
                text = data.text;
            } catch (err) {
                console.error(`❌ Para leer PDFs, necesitas instalar pdf-parse: npm install pdf-parse`);
                return;
            }
        } else {
            console.log(`⏭️ Omitiendo archivo no soportado: ${source}`);
            return;
        }

        if (!text.trim()) {
            console.log(`⚠️ Archivo vacío: ${source}`);
            return;
        }

        console.log(`📚 Procesando [${category}] ${source}...`);

        // 1. Chiapear el documento
        const chunks = chunkingService.chunkDocument(text, source, { category });

        // 2. Generar Embeddings
        console.log(`   Generando embeddings para ${chunks.length} fragmentos...`);
        const embeddedChunks = await embeddingsService.embedChunks(chunks);

        // 3. Guardar en Neo4j con el índice vectorial
        console.log(`   Guardando en Knowledge Graph (Neo4j)...`);
        for (const chunk of embeddedChunks) {
            await neo4jService.executeWrite(`
        MERGE (c:Chunk {id: $id})
        SET c.content = $content,
            c.source = $source,
            c.sourceType = $sourceType,
            c.metadata = $metadata,
            c.vector = $embedding
        RETURN c
      `, {
                id: chunk.id,
                content: chunk.content,
                source: chunk.source,
                sourceType: chunk.sourceType,
                metadata: JSON.stringify(chunk.metadata),
                embedding: chunk.embedding,
            });
        }

        console.log(`✅ ¡Éxito! ${chunks.length} fragmentos indexados de ${source}\n`);
    } catch (error) {
        console.error(`❌ Error procesando ${source}:`, error);
    }
}

async function scanAndIngest(dir: string, category: string) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            // Usar el nombre de la subcarpeta como parte de la categoría (ej: recursos_locales/cl)
            await scanAndIngest(fullPath, `${category}/${entry.name}`);
        } else {
            await processFile(fullPath, entry.name, category);
        }
    }
}

async function crearIndiceVectorial() {
    try {
        console.log('⚙️ Verificando/Creando índice vectorial en Neo4j (Dim: 384)...');

        // Intentar borrar el anterior si tiene dimensiones distintas (opcional, pero seguro)
        try {
            await neo4jService.executeWrite('DROP INDEX chunk_vector_index IF EXISTS');
        } catch (e) { }

        await neo4jService.executeWrite(`
      CREATE VECTOR INDEX chunk_vector_index IF NOT EXISTS 
      FOR (c:Chunk) ON (c.vector) 
      OPTIONS { indexConfig: {
        \`vector.dimensions\`: 384,
        \`vector.similarity_function\`: 'cosine'
      }}
    `);
        console.log('✅ Índice vectorial local listo.');
    } catch (error: any) {
        console.error('⚠️ Nota: Es posible que el índice ya exista o haya un error (ignorar si Neo4j Aura)', error.message);
    }
}

async function main() {
    console.log('\n🧠 INICIANDO INGESTA DE CONOCIMIENTOS PARA LÚA 🌙\n');

    await crearIndiceVectorial();

    const categories = fs.readdirSync(KNOWLEDGE_BASE_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    // Procesar cada categoría (tecnicas, psicoeducacion, etc.)
    for (const category of categories) {
        const dirPath = path.join(KNOWLEDGE_BASE_DIR, category);
        await scanAndIngest(dirPath, category);
    }

    console.log('\n🎉 ¡INGESTA FINALIZADA! LÚA AHORA ES MÁS INTELIGENTE 🧠✨');
    process.exit(0);
}

main().catch(console.error);
