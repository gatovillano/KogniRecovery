/**
 * Entry Point - Servidor KogniRecovery
 * Sistema de Acompañamiento en Adicciones
 */

import { createApp } from './app.js';
import { initDatabase, closePool } from './config/database.js';
import { server } from './config/index.js';

// =====================================================
// INICIAR SERVIDOR
// =====================================================

const startServer = async (): Promise<void> => {
  try {
    // Inicializar base de datos
    console.log('🔄 Iniciando base de datos...');
    await initDatabase();
    console.log('✅ Base de datos conectada');

    // Crear aplicación Express
    const app = createApp();

    // Iniciar servidor escuchando en todas las interfaces (necesario para acceso externo)
    const httpServer = app.listen(server.port, '0.0.0.0', () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🧠 KogniRecovery API                               ║
║                                                       ║
║   🌐 Servidor corriendo en:                          ║
║      http://localhost:${server.port}                      ║
║                                                       ║
║   📚 Endpoints disponibles:                          ║
║      GET  /health           - Health check          ║
║      POST /api/v1/auth/register - Registro           ║
║      POST /api/v1/auth/login    - Login              ║
║      POST /api/v1/auth/refresh  - Refresh token      ║
║      POST /api/v1/auth/logout   - Logout             ║
║                                                       ║
║   🔧 Entorno: ${server.nodeEnv.padEnd(38)}║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });

    // Manejo de señal de cierre
    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`\n📡 Recibida señal ${signal}. Cerrando servidor...`);

      httpServer.close(async () => {
        console.log('🔌 Servidor HTTP cerrado');

        try {
          await closePool();
          console.log('🔌 Conexiones de base de datos cerradas');
        } catch (error) {
          console.error('❌ Error al cerrar conexiones:', error);
        }

        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('⚠️  Cierre forzado después de timeout');
        process.exit(1);
      }, 10000);
    };

    // Escuchar señales de terminación
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejo de errores no capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Error no capturado:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promise rechazada no manejada:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();
