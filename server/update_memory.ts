
import { initDatabase } from './src/config/database.ts';
import { saveContextHistory } from './src/models/message.model.ts';
import dotenv from 'dotenv';
dotenv.config();

const userId = 'b6a9d1c1-a419-427a-9697-301269df6f8a';

async function main() {
  await initDatabase();
  
  // Agregar apoyo médico
  await saveContextHistory(
    userId,
    'preference',
    'medical_support',
    'El paciente cuenta con apoyo médico profesional especializado en psiquiatría y adicciones.',
    undefined,
    8 // Alta importancia para que LÚA lo mencione o use
  );
  
  // Agregar medicamentos
  await saveContextHistory(
    userId,
    'preference',
    'medications',
    'El paciente se encuentra bajo tratamiento farmacológico supervisado por su psiquiatra.',
    undefined,
    8
  );
  
  console.log('✅ Memoria del agente actualizada con éxito');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
