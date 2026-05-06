import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';
import { API_VERSION } from '../constants';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Clinisalud API',
      version: API_VERSION,
      description: 'API REST para Sistema de Gestión Hospitalaria Clinisalud\n\n## Autenticación\nTodos los endpoints (excepto login) requieren token JWT en el header:\n`Authorization: Bearer <token>`',
      contact: {
        name: 'Soporte Clinisalud',
        email: 'soporte@clinisalud.com',
      },
    },
    servers: [
      {
        url: `http://localhost:3000/api/${API_VERSION}`,
        description: 'Servidor desarrollo local',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Endpoints de autenticación' },
      { name: 'Users', description: 'Gestión de usuarios' },
      { name: 'Patients', description: 'Gestión de pacientes' },
      { name: 'Billing', description: 'Facturación y cobros' },
      { name: 'Catalogs', description: 'Catálogos del sistema' },
    ],
    paths: {
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Iniciar sesión',
          description: 'Autentica un usuario y retorna token JWT\n\nEjemplo:\n```json\n{\n  "email": "admin@clinisalud.com",\n  "password": "Admin2026!"\n}\n```',
          operationId: 'login',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'admin@clinisalud.com' },
                    password: { type: 'string', format: 'password', example: 'Admin2026!' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login exitoso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 1 },
                          firstName: { type: 'string', example: 'Admin' },
                          lastName: { type: 'string', example: 'General' },
                          email: { type: 'string', example: 'admin@clinisalud.com' },
                          role: { type: 'string', example: 'ADMIN' },
                        },
                      },
                      menu: { type: 'array', example: [] },
                    },
                  },
                },
              },
            },
            401: { description: 'Credenciales inválidas' },
          },
        },
      },
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'Listar usuarios',
          description: 'Retorna todos los usuarios gestionables. Requiere JWT.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Lista de usuarios',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                },
              },
            },
            401: { description: 'No autorizado' },
          },
        },
        post: {
          tags: ['Users'],
          summary: 'Crear usuario',
          description: 'Crea un nuevo usuario con contraseña temporal',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'dni', 'firstName', 'lastName', 'idTipoDocumento', 'roleId', 'permissions'],
                  properties: {
                    email: { type: 'string', example: 'doctor@clinisalud.com' },
                    dni: { type: 'string', example: '12345679' },
                    firstName: { type: 'string', example: 'Doctor' },
                    lastName: { type: 'string', example: 'Test' },
                    idTipoDocumento: { type: 'integer', example: 1 },
                    roleId: { type: 'integer', example: 2 },
                    permissions: { type: 'array', items: { type: 'integer' }, example: [1, 2] },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Usuario creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            409: { description: 'Email o DNI ya existe' },
          },
        },
      },
      '/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Obtener usuario por ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Usuario encontrado' },
            404: { description: 'Usuario no encontrado' },
          },
        },
      },
      '/users/{id}/permissions': {
        put: {
          tags: ['Users'],
          summary: 'Actualizar permisos de usuario',
          description: 'Actualiza los permisos de menú de un usuario',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    permissions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          menuOptionId: { type: 'integer' },
                          hasAccess: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Permisos actualizados' },
            403: { description: 'No se puede modificar admin' },
            404: { description: 'Usuario no encontrado' },
          },
        },
      },
      '/users/{id}/toggle': {
        put: {
          tags: ['Users'],
          summary: 'Cambiar estado de usuario',
          description: 'Activa o desactiva un usuario',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Estado cambiado', content: { 'application/json': { example: { id: 2, isActive: false, message: 'Usuario desactivado correctamente.' } } } },
            403: { description: 'No se puede modificar admin' },
            404: { description: 'Usuario no encontrado' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del endpoint /auth/login',
        },
      },
      schemas: {
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            firstName: { type: 'string', example: 'Admin' },
            lastName: { type: 'string', example: 'General' },
            email: { type: 'string', example: 'admin@clinisalud.com' },
            roleId: { type: 'integer', example: 1 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        PatientRegister: {
          type: 'object',
          required: [
            'idTipoDocumento',
            'numDocumento',
            'primerNombre',
            'primerApellido',
            'fechaNacimiento',
            'genero',
            'idMunicipio',
            'idDepartamento',
            'idTipoUsuario',
            'idConvenio',
          ],
          properties: {
            idTipoDocumento: { type: 'integer', example: 1 },
            numDocumento: { type: 'string', example: '12345678' },
            primerNombre: { type: 'string', example: 'Juan' },
            segundoNombre: { type: 'string' },
            primerApellido: { type: 'string', example: 'Pérez' },
            segundoApellido: { type: 'string' },
            fechaNacimiento: { type: 'string', format: 'date', example: '1990-01-01' },
            genero: { type: 'string', enum: ['M', 'F'], example: 'M' },
            direccion: { type: 'string' },
            telefono: { type: 'string' },
            idMunicipio: { type: 'integer', example: 1 },
            idDepartamento: { type: 'integer', example: 1 },
            idTipoUsuario: { type: 'integer', example: 1 },
            idConvenio: { type: 'string', example: 'CONV001' },
          },
        },
        Patient: {
          allOf: [
            { $ref: '#/components/schemas/PatientRegister' },
            {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                departamento: { type: 'object' },
                municipio: { type: 'object' },
                tipoUsuario: { type: 'object' },
                tipoDocumento: { type: 'object' },
                contrato: { type: 'object' },
              },
            },
          ],
        },
        BillingCreate: {
          type: 'object',
          required: [
            'numAdmision',
            'idOrigenCta',
            'idTarifario',
            'idTipoServicio',
            'idPaciente',
            'fechaAdmision',
            'valorTotal',
          ],
          properties: {
            numAdmision: { type: 'string', example: 'ADM2026-001' },
            idOrigenCta: { type: 'integer', example: 1 },
            idTarifario: { type: 'integer', example: 1 },
            idTipoServicio: { type: 'integer', example: 1 },
            idPaciente: { type: 'integer', example: 1 },
            idContrato: { type: 'string' },
            codDiagnostico: { type: 'string' },
            codProcedimiento: { type: 'string' },
            idCama: { type: 'integer' },
            idEspecialidad: { type: 'integer' },
            fechaAdmision: { type: 'string', format: 'date', example: '2026-01-01' },
            fechaEgreso: { type: 'string', format: 'date' },
            valorTotal: { type: 'number', example: 150000 },
            estado: { type: 'string', enum: ['pendiente', 'pagado', 'cancelado'], default: 'pendiente' },
          },
        },
        Billing: {
          allOf: [
            { $ref: '#/components/schemas/BillingCreate' },
            {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                valorPaciente: { type: 'number' },
                valorCopago: { type: 'number' },
                paciente: { type: 'object' },
                contrato: { type: 'object' },
              },
            },
          ],
        },
        CatalogItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nombre: { type: 'string' },
            codigo: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
export const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Clinisalud API Docs',
};

export default swaggerUiExpress;