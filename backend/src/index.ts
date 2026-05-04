import app from './app';
import sequelize from './config/database';
import { runSeeder } from './seed';

// Importamos TODOS los modelos para establecer las relaciones y crear las tablas
import './models/Role';
import './models/User';
import './models/MenuOption';
import './models/RoleMenuPermission';
import './models/UserMenuOverride';

const PORT = process.env['PORT'] || 3000;

async function main() {
  try {
    await sequelize.sync({ force: true });
    console.log('✅ Base de datos conectada y sincronizada.');

    await runSeeder();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Error crítico al iniciar el servidor:', error);
    process.exit(1); // Cerramos el proceso si hay un error fatal
  }
}

main();