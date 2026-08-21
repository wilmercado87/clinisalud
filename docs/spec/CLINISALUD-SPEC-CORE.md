# ESPECIFICACIÓN TÉCNICA Y REGLAS DE NEGOCIO (SDD MAESTRO)
> **Proyecto:** CLINISALUD - Sistema Integral de Gestión Hospitalaria (Desarrollos WikarSoft)
> **Versión:** 1.2.0
> **Objetivo:** Cero Glosas, Trazabilidad Financiera, Integración Farmacia-Facturación y Liquidación Tarifaria (ISS/SOAT).
> **Historial:** 1.0.0 SDD Maestro inicial · 1.1.0 Módulo Autorizaciones como página independiente (`/dashboard/authorizations`) · 1.2.0 Barrido de implementación: estado y mapa de código por invariante.

---

## RESUMEN GLOBAL DE IMPLEMENTACIÓN

| # | Módulo | Estado | Nota |
|---|---|---|---|
| 0 | Core: Seguridad, RBAC, Catálogos, Notificaciones | ✅ Implementado | Auth JWT, menú híbrido, socket.io, 4 módulos API |
| 1 | Citas Médicas | ⏳ No iniciado | Solo existe catálogo `Especialidad` |
| 2 | Admisiones, Censo y Autorizaciones | ✅ Implementado | Formulario + censo + módulo autorizaciones; máquina de estados en BD |
| 3 | Historia Clínica y Epicrisis | ⏳ No iniciado | Capa de datos parcial (`Triage`, `DiagnosticoPaciente`) |
| 4 | Almacén, Farmacia y Devoluciones | ⏳ No iniciado | Sin módulo ni flujo |
| 5 | Facturación y Manuales Tarifarios | 🟡 Parcial | Pre-validación anti-glosa activa (`billability-check`); liquidación ISS/SOAT pendiente |
| 6 | Cuentas Médicas y Cartera | ⏳ No iniciado | — |
| 7 | Administrativos, Paz y Salvos, Reportes | ⏳ No iniciado | — |

**Leyenda de estado por invariante:** ✅ implementada y respaldada por tests · 🟡 parcialmente implementada · ⏳ no iniciada.

**Convención de trazabilidad SDD:** cada invariante se cita en los tests como `@spec:INV-XX-nn` (ver `docs/TESTING.md`). El gate de calidad de CI advierte si un test modificado no cita su invariante.

---

## 0. MÓDULO CORE: SEGURIDAD, ROLES Y NOTIFICACIONES
> **Estado del módulo:** ✅ Implementado — módulos `auth`, `users`, `catalogs`, `notifications` (backend) + `core/*` (frontend).

### Catálogos Transversales y Datos Maestros

* `@spec:INV-CAT-01` **Listados Transversales Unificados:** Los listados paramétricos (`TipoDocumento`, `TipoGenero`, `TipoUsuario`, `Convenio`, `Departamento`, `Municipio`) deben servirse a través de un módulo centralizado de catálogos (`/api/v1/catalogs`).
    * **Estado:** ✅
    * **Backend:** `src/modules/catalogs/` — rutas genérica `GET /catalogs/:type` + especializadas (`beds`, `contracts`, `municipalities`, `cups/search`, `diagnostics/search`).
    * **Frontend:** `core/services/catalog.service.ts` + `core/stores/catalog-store/` (caché en memoria con `shareReplay`, sin solicitudes redundantes).
* `@spec:INV-CAT-02` **Caché de Sesión y Limpieza Atómica:** El Frontend debe mantener en memoria los catálogos consultados para evitar solicitudes redundantes. Al ejecutarse el cierre de sesión (`AuthStore.logout()`), la caché del `CatalogStore` debe destruirse de manera atómica.
    * **Estado:** ✅
    * **Frontend:** `core/stores/auth-store/auth.store.ts` (logout invoca `catalogStore.clearCache()`), limpieza definida en `catalog.store.ts`.

### Invariantes de Control de Acceso (RBAC) y Seguridad

* `@spec:INV-SEC-01` **Autenticación Estricta:** Todo acceso al sistema (excepto el login) exige un token JWT válido y no expirado. Los usuarios con estado inactivo (`isActive = false`) tienen el acceso denegado a nivel de interceptor y backend.
    * **Estado:** ✅
    * **Backend:** `src/middlewares/AuthMiddleware.ts` (`authenticateToken`, `requireRole`) aplicado en todas las rutas; rate limiting en login (`SecurityMiddleware`).
    * **Frontend:** `core/guards/auth.guard.ts` (rutas) + `core/interceptors/auth.interceptor.ts` (logout automático si usuario inactivo o 401/403).
    * **Tests:** `AuthService.test.ts`.
* `@spec:INV-SEC-02` **Permisos Híbridos (Roles + Sobreescrituras):** El menú dinámico y el acceso a módulos se calcula uniendo los permisos base del Rol del usuario (`PermisoRolMenu`) y aplicando las excepciones específicas de habilitación/restricción granulares (`SobreescrituraMenuUsuario`).
    * **Estado:** ✅
    * **Backend:** `src/modules/users/users.service.ts` (merge `grantedMenuIds ∪ overrides`, transaccional en `PATCH /users/:id/permissions`); endpoint `GET /menu-options`.
    * **Frontend:** `layout/sidebar/` renderiza según menú recibido tras login; gestión granular en `features/dashboard/pages/manager-users/`.
    * **Tests:** `UserService.test.ts`, `AuthService.test.ts`.
* `@spec:INV-SEC-03` **Protección de Privilegios Administrativos:** Ningún usuario, ni siquiera un `ADMIN`, puede modificar los permisos, estado o rol de un usuario con nivel `SUPER_ADMIN`. Solo un `SUPER_ADMIN` puede crear o modificar a otro `ADMIN`.
    * **Estado:** ✅
    * **Backend:** reglas en `src/modules/users/users.controller.ts` + mensajes en `constants/index.ts` (`PERMISSIONS_SUPER_ADMIN_FORBIDDEN`, `CREATE_ADMIN_FORBIDDEN`, etc.); roles en `ROLE_CODES` (`SUPER_ADMIN`, `ADMIN`, `ADMISIONES`, `MEDICO`, `FACTURADOR`).
    * **Tests:** `UserService.test.ts` (7 casos de la invariante).
* `@spec:INV-SEC-04` **Notificaciones de Auditoría:** Operaciones críticas como la creación de usuarios o cambios de estado (`toggleUserStatus`) deben emitir una notificación persistente y en tiempo real (WebSockets) a todos los administradores activos del sistema.
    * **Estado:** ✅
    * **Backend:** `src/socket/socket.gateway.ts` (socket.io con autenticación JWT por handshake) + `src/modules/notifications/` (persistencia + email opcional) + plantillas `USER_NOTIFICATIONS` / `ADMISSION_NOTIFICATIONS` en `constants/index.ts`.
    * **Frontend:** `core/services/socket.service.ts` + `core/stores/notification-store/` + página `/dashboard/notifications`.
    * **Tests:** `UserService.test.ts`, `NotificationsService.test.ts`.

---

## 1. MÓDULO DE CITAS MÉDICAS
> **Estado del módulo:** ⏳ No iniciado — no existen módulo API, rutas ni componentes; solo el catálogo maestro `Especialidad`.

### Invariantes y Reglas Operativas
* `@spec:INV-CIT-01` **Gestión de Agenda por Especialidad:** Todo médico debe tener parametrizada su agenda vinculada a su especialidad (`Especialidad`). No se pueden asignar citas fuera de los rangos de horario activos del médico.
    * **Estado:** ⏳
    * **Datos disponibles:** modelo `Especialidad` en `backend/src/models/Especialidad.ts`.
* `@spec:INV-CIT-02` **Asignación y Control de Pacientes:** La asignación de citas (primera vez o controles) exige la existencia del paciente en el módulo `Paciente`. Una cita atendida debe cambiar automáticamente de estado y permitir la apertura del ingreso en Historia Clínica.
    * **Estado:** ⏳
    * **Base reutilizable:** consulta de pacientes ya implementada en `backend/src/modules/admissions/patient.service.ts` (lookup por documento).

---

## 2. MÓDULO DE ADMISIONES, CENSO Y AUTORIZACIONES
> **Estado del módulo:** ✅ Implementado — el más completo del sistema: registro de admisión, censo hospitalario, egreso, gestión de camas, autorizaciones y pre-validación de facturación.

### Endpoints del módulo (todos bajo `/api/v1`)
| Método | Ruta | Roles | Invariantes que protege |
|---|---|---|---|
| GET | `/admissions/patient-lookup?documentType&document` | SUPER_ADMIN, ADMIN, ADMISIONES, MEDICO | INV-HC-01, INV-AUT-01 |
| POST | `/admissions` | SUPER_ADMIN, ADMIN, ADMISIONES | INV-ADM-01..03, INV-ADM-06 |
| GET | `/admissions/census` | SUPER_ADMIN, ADMIN, ADMISIONES, MEDICO | INV-ADM-04 |
| GET | `/admissions/:admissionNumber` | SUPER_ADMIN, ADMIN, ADMISIONES | INV-AUT-01, INV-AUT-03 |
| PATCH | `/admissions/:admissionNumber` | SUPER_ADMIN, ADMIN, ADMISIONES | INV-ADM-01, INV-ADM-07, INV-AUT-02/03 |
| PATCH | `/admissions/:admissionNumber/state` | SUPER_ADMIN, ADMIN, ADMISIONES | INV-ADM-04, INV-ADM-05 |
| POST | `/admissions/:admissionNumber/discharge` | SUPER_ADMIN, ADMIN, ADMISIONES | INV-ADM-05 |
| POST | `/admissions/billability-check` | SUPER_ADMIN, ADMIN | INV-FAC-01 |

### Invariantes y Reglas Anti-Glosa

* `@spec:INV-ADM-01` **Control de Censo y Disponibilidad de Camas:** Todo ingreso de tipo hospitalización puede asignar una cama (`Admision.roomId`) cuyo estado sea `0` (Disponible); la asignación es opcional al registrar y puede hacerse después mediante actualización de la admisión activa. Al asignar la cama, esta cambia automáticamente a estado `1` (Ocupada) dentro de la misma transacción. Si una admisión activa reasigna la cama, la cama anterior vuelve a `Disponible` y la nueva pasa a `Ocupada` de forma atómica.
    * **Estado:** ✅
    * **Backend:** `modules/admissions/admissions.service.ts` + `bed.service.ts` (transacción cama↔admisión); `BED_STATUS` y errores `BED_*` en `constants/index.ts`.
    * **Frontend:** selector de camas en `features/admissions/pages/admission-form/` (solo disponibles al actualizar, label de cama ocupada) vía `services/admission-form.facade.ts`; catálogo en `shared/components/catalog-select/`.
    * **API:** `POST /admissions`, `PATCH /admissions/:admissionNumber`, `POST .../discharge`.
    * **Tests:** `AdmissionsService.test.ts` ("should create admission for new patient", "should throw if bed is not available", "should discharge admission and release the bed").
* `@spec:INV-ADM-02` **Control de Autorizaciones por Servicio:** En el momento del ingreso o solicitud del servicio, el módulo debe registrar la solicitud de autorización a la EPS (`Autorizacion`).
    * **Estado:** ✅
    * **Reglas activadas:** tarifario derivado del contrato EPS (`AUTH_FEE_SCHEDULE_REQUIRED/MISMATCH`), anti-duplicado (`AUTH_ALREADY_EXISTS`), tope de cantidad acumulada (`AUTH_QUANTITY_EXCEEDS_MAX/_MAPIISS_MAX`), MAPIISS validado contra tarifario (`AUTH_MAPIISS_NOT_FOUND`) — todas en `constants/index.ts`.
    * **Backend:** creación/validación en `modules/admissions/admissions.service.ts`; modelo `models/Autorizacion.ts`.
    * **Frontend:** componente único `features/admissions/components/authorization-entry/` (reutilizable) con wrapper modal `authorization-entry-dialog/` y búsqueda CUPS `cups-search-dialog/`.
    * **Tests:** `AdmissionsService.test.ts` (duplicados, cantidad acumulada, default qty=1, MAPIISS inexistente).
* `@spec:INV-ADM-03` **Vinculación Obligatoria para Facturación:** Se controla que todo servicio que requiera autorización previa según el contrato de la EPS tenga su respectivo número de autorización registrado (`Autorizacion.authNumber`). De lo contrario, el servicio quedará bloqueado para cobro.
    * **Estado:** ✅ (control disponible para Facturación)
    * **Backend:** evaluación en `modules/admissions/billability.service.ts` → error `BILLING_SERVICE_NO_AUTH` (`SERVICE_BLOCKED_FOR_BILLING`).
    * **API:** `POST /admissions/billability-check`.
    * **Tests:** `AdmissionsService.test.ts` (servicio bloqueado sin autorización).
* `@spec:INV-ADM-04` **Regresión de Estado en Censo (Corrección Operativa):** Una admisión puede regresar al estado inmediatamente anterior (`EN_ATENCION → REGISTRADA`, `CON_EPICRISIS → EN_ATENCION`) desde el Censo Hospitalario para corregir errores operativos. La acción exige confirmación explícita del usuario y queda registrada en la auditoría de la admisión.
    * **Estado:** ✅
    * **Backend:** `ADMISSION_STATE_REVERSE_MACHINE` en `constants/index.ts` aplicada por `PATCH /admissions/:admissionNumber/state` (`INVALID_STATE_TRANSITION` si no permitida).
    * **Frontend:** censo `features/admissions/pages/census/` + confirmación `components/census-revert-state-dialog/`; chip visual de estado en `pipes/admission-state.pipe.ts`.
    * **Tests:** `AdmissionsApi.test.ts` (transiciones inválidas 409/422).
* `@spec:INV-ADM-05` **Irreversibilidad por Integridad Financiera:** Una admisión en estado `FACTURADA` o `EGRESADA` **no puede** regresar a un estado anterior. `FACTURADA` inicia el ciclo de facturación y glosas ante la EPS; `EGRESADA` liberó la cama y cerró el egreso. Deshacer estos estados rompería la trazabilidad financiera y el control de camas.
    * **Estado:** ✅
    * **Backend:** estados terminales ausentes de ambas máquinas (`ADMISSION_STATE_MACHINE` / `_REVERSE_`); guardas `ADMISSION_ALREADY_DISCHARGED`; liberación de cama atómica en egreso.
    * **Frontend:** egreso con confirmación `components/census-discharge-dialog/`; admisiones egresadas no admiten nuevas autorizaciones.
    * **Tests:** `AdmissionsService.test.ts`, `AdmissionsApi.test.ts`.
* `@spec:INV-ADM-06` **Registro de Fecha y Hora Local:** El registro de la admisión captura fecha y hora local (`YYYY-MM-DD HH:mm:ss`) en `Admision.admissionDate`. El Censo Hospitalario muestra el campo Fecha Ingreso con fecha y hora (hh:mm:ss) para trazabilidad operativa del ingreso.
    * **Estado:** ✅
    * **Backend:** numeración/secuencia por día con fecha LOCAL en `admissions.service.ts`.
    * **Frontend:** presentación en `pages/census/census.component.ts`.
    * **Tests:** `AdmissionsService.test.ts` ("resolves the sequence using the LOCAL date…").
* `@spec:INV-ADM-07` **Actualización de Admisión Activa:** Si el paciente consultado ya tiene una admisión activa (`statusId` diferente de `EGRESADA`), el formulario no permite crear una nueva admisión: bloquea los datos del paciente, acompañante, EPS y observaciones, y habilita únicamente la selección de cama y el registro de autorizaciones. El botón cambia a `Actualizar Admisión` y solo se habilita cuando hay cambios reales (cama distinta o autorizaciones nuevas). Las autorizaciones y la cama quedan persistidas en la admisión existente y se muestran al re-consultar el paciente (`PATCH /admissions/:admissionNumber`).
    * **Estado:** ✅
    * **Backend:** respuesta con `activeAdmission` (cama + autorizaciones) en lookup y `GET :admissionNumber`; actualización parcial en `admissions.service.ts`.
    * **Frontend:** estados del formulario y detección de cambios en `admission-form.facade.ts` + `utils/admission/admission-form.builder.ts` (`hasPendingAdmissionChanges()`); merge optimista de autorizaciones.
    * **Tests:** `AdmissionsService.test.ts` (activeAdmission con/sin egreso), `AdmissionsApi.test.ts` (flujo PATCH).

### Máquina de Estados de la Admisión
$$\text{REGISTRADA} \Longleftrightarrow \text{EN\_ATENCION} \Longleftrightarrow \text{CON\_EPICRISIS} \longrightarrow \text{FACTURADA} \longrightarrow \text{EGRESADA}$$

* Las flechas dobles (`⇄`) indican transiciones reversibles de corrección operativa (requieren confirmación).
* `FACTURADA` y `EGRESADA` son estados terminales irreversibles (`@spec:INV-ADM-05`).
* **Implementación:** `ADMISSION_STATE_MACHINE` (avance) y `ADMISSION_STATE_REVERSE_MACHINE` (corrección) en `backend/src/constants/index.ts`; aplicación en `PATCH /admissions/:admissionNumber/state` y utilitario `modules/admissions/admission-status.util.ts`.

### Gestión de Autorizaciones (Módulo Autorizaciones)

* `@spec:INV-AUT-01` **Consulta Dual de la Admisión:** El módulo Autorizaciones (`/dashboard/authorizations`, visible según `INV-SEC-02`; acceso backend restringido a `SUPER_ADMIN`, `ADMIN`, `ADMISIONES`) localiza la admisión por dos vías: Tipo + Número de Documento del paciente (`GET /admissions/patient-lookup`) o Número de Admisión (`GET /admissions/:admissionNumber`). Ambas respuestas comparten la misma estructura (paciente + admisión activa con autorizaciones y estado). El resultado se presenta en tarjetas independientes: información básica del paciente, información de la admisión y gestión de autorizaciones.
    * **Estado:** ✅
    * **Frontend:** página `features/admissions/pages/authorization-manager/` (+ facade) con búsqueda unificada `shared/components/admission-search/`.
    * **Tests:** `AdmissionsService.test.ts`, specs frontend `authorization-manager.component.spec.ts` / `admission-search.component.spec.ts`.
* `@spec:INV-AUT-02` **Componente Único de Registro de Autorizaciones:** La captura de autorizaciones (tipo, número, CUPS/MAPIISS con búsqueda por tarifario, cantidad) proviene de un único componente reutilizable: se presenta como modal en el formulario de Admisiones y embebido como pantalla en el módulo Autorizaciones. En ambos contextos aplican idénticas reglas anti-glosa: tarifario derivado del contrato de la EPS, anti-duplicado y cantidad acumulada máxima por servicio (`@spec:INV-ADM-02`, `@spec:INV-ADM-03`).
    * **Estado:** ✅
    * **Frontend:** `features/admissions/components/authorization-entry/` (núcleo) + `authorization-entry-dialog/` (wrapper modal, cierre solo por botones). Validadores/formularios en `utils/authorization/`.
    * **Tests:** specs `authorization-entry.component.spec.ts`, `authorization-entry-dialog.component.spec.ts`, `cups-search-dialog.component.spec.ts`.
* `@spec:INV-AUT-03` **Persistencia y Recarga Inmediata:** El guardado ejecuta `PATCH /admissions/:admissionNumber` con las autorizaciones en cola; al éxito se limpia la cola, se notifica al usuario y se recarga la admisión mostrando las autorizaciones persistidas. Las admisiones egresadas no admiten nuevas autorizaciones (consistente con `@spec:INV-ADM-05`).
    * **Estado:** ✅
    * **Backend:** cola aplicada transaccionalmente en `admissions.service.ts`.
    * **Frontend:** flujo guardar→recargar en `authorization-manager.facade.ts` y `admission-form.facade.ts`.
    * **Tests:** `AdmissionsApi.test.ts`, `admission-form.component.spec.ts`.

---

## 3. MÓDULO DE HISTORIA CLÍNICA Y EPICRISIS
> **Estado del módulo:** ⏳ No iniciado — no hay módulo API ni UI. Capa de datos parcial: modelos `Triage`, `TriagePrioridad`, `DiagnosticoPaciente` y catálogo CIE-10 (12.423 códigos) ya cargados.

### Invariantes y Soportes
* `@spec:INV-HC-01` **Trazabilidad por Documento o Ingreso:** Cada atención médica queda registrada y vinculada de manera unívoca al documento del paciente (`Paciente.document`) o al número de admisión (`Admision.admissionNumber`).
    * **Estado:** ⏳
    * **Base reutilizable:** lookup dual ya operativa en Admisiones (ver `@spec:INV-AUT-01`).
* `@spec:INV-HC-02` **Soporte de Atención (Epicrisis):** Toda admisión hospitalaria o de urgencias debe culminar con la elaboración de la Epicrisis por parte del profesional de la salud. La Epicrisis actúa como el soporte legal e indispensable para habilitar el proceso de facturación.
    * **Estado:** ⏳
    * **Nota:** el estado `CON_EPICRISIS` ya existe en la máquina de admisiones; la elaboración/firma del documento es pendiente (bloqueante para `INV-FAC-02`).

---

## 4. MÓDULO DE ALMACÉN, FARMACIA Y DEVOLUCIONES
> **Estado del módulo:** ⏳ No iniciado — sin módulo API ni UI.

### Invariantes y Control de Inventarios Anti-Glosa
* `@spec:INV-ALM-01` **Regulación de Stock (Almacén):** El módulo de Almacén regula la entrada de medicamentos y suministros al stock general de la IPS, manteniendo control en tiempo real del inventario disponible. — **Estado:** ⏳
* `@spec:INV-FAR-01` **Despacho por Orden Médica:** Farmacia realiza la entrega de medicamentos y suministros exclusivamente mediante una orden de suministros médica activa asociada al paciente. — **Estado:** ⏳
* `@spec:INV-FAR-02` **Carga Automática a Facturación (Despachado = Aplicado):** Todo medicamento o insumo entregado a un paciente se cargará automáticamente como ítem en la pre-factura del módulo de Facturación para garantizar que lo despachado sea exactamente igual a lo cobrado y evitar glosas. — **Estado:** ⏳
* `@spec:INV-FAR-03` **Excepción de Insumos de Procedimiento:** Los insumos aplicados en procedimientos (*gasas, guantes, apósitos, electrodos, etc.*) no se cargarán como ítems cobrables individuales si la tarifa del procedimiento (ISS/SOAT) los incluye dentro de los derechos de sala o materiales. — **Estado:** ⏳
* `@spec:INV-FAR-04` **Devoluciones a Farmacia:** Si un medicamento o insumo no es aplicado al paciente y se realiza la devolución a Farmacia mediante el módulo administrativo, el sistema reingresa el ítem al stock y descuenta inmediatamente el cargo del borrador de facturación. — **Estado:** ⏳

---

## 5. MÓDULO DE FACTURACIÓN Y MANUALES TARIFARIOS
> **Estado del módulo:** 🟡 Parcial — sin módulo de facturación propiamente dicho; la **pre-validación anti-glosa** (autorizaciones vs servicios) está activa desde Admisiones y la capa tarifaria (ISS/SOAT) tiene datos y modelos listos.

### Invariantes Anti-Glosa y Liquidación
* `@spec:INV-FAC-01` **Control por Centros de Costos y Complejidad:** El módulo valida los servicios por nivel de complejidad y centro de costos. Si un servicio requiere autorización y esta no ha sido registrada por Admisiones, el sistema **impedirá la facturación del servicio**.
    * **Estado:** 🟡 — la validación de autorización previa está operativa (`billability-check`); centros de costos/complejidad pendientes de integrarse al cobro.
    * **Backend:** `modules/admissions/billability.service.ts`; modelos `CentroCosto`, `NivelAtencion`; catálogo CUPS con FKs a ambos.
    * **Tests:** `AdmissionsService.test.ts` (bloqueo por falta de autorización, cantidad insuficiente).
* `@spec:INV-FAC-02` **Bloqueo de Emisión por Epicrisis Pendiente:** Al intentar generar una factura final, el sistema valida si la Epicrisis ha sido realizada. Si la Epicrisis está pendiente, el sistema guarda los cambios del borrador pero **NO genera la factura** hasta que la Epicrisis sea firmada y completada. — **Estado:** ⏳ (depende de `INV-HC-02`).
* `@spec:INV-FAC-03` **Generación Automática de Cuadro de Justificación CTC (No-POS):** Durante la revisión o generación de la Epicrisis, el sistema detecta medicamentos y procedimientos No-POS / MIPRES y genera automáticamente el cuadro de justificación para el Comité Técnico Científico (CTC) con el fin de prevenir la Glosa Total de la cuenta. — **Estado:** ⏳.
* `@spec:INV-FAC-04` **Liquidación por Manuales Tarifarios (ISS 2000, ISS 2001, SOAT):** La liquidación de servicios se calcula estrictamente conforme a las reglas del manual parametrizado en el contrato de la EPS (`Contrato.feeScheduleId`), aplicando UVRs, valores de cirujano, anestesiólogo, ayudante, sala y materiales, ajustados por los porcentajes de variación ambulatoria, urgencia u hospitalización (`PORCENTAJE_AMB`, `PORCENTAJE_URG`, `PORCENTAJE_HOSP`).
    * **Estado:** 🟡 — motor de liquidación pendiente; la resolución de tarifario ya es funcional: CUPS y autorizaciones resuelven descripción/reglas contra el tarifario del contrato (modelos `Tarifario`, `Articulado`, `ParagrafoValor/Edad/Inclusion/Aplicacion`, `ViaAcceso`, `TipoAcceso`).
    * **Tests:** `AdmissionsService.test.ts` ("resolves the cups description scoped to the authorization tariff…").
* `@spec:INV-FAC-05` **Cálculo de Copagos y Cuotas Moderadoras:** Según la categoría del usuario (`TipoUsuario`), el sistema liquida los valores de copago, cuota moderadora y respeta los topes por evento o topes anuales antes de emitir la factura a la EPS. — **Estado:** ⏳.

### Soporte de datos ya disponible para este módulo
* Catálogos cargados en producción: **21.426 códigos CUPS** (11.351 únicos MAPIISS) y **37.266 reglas articuladas** (ver `docs/dictamen-normalizacion.md`).
* Modalidades `AMBULATORIO` / `HOSPITALIZACION` con campo de autorización correspondiente (`authAmb`/`authHosp`) en `ADMISSION_MODALITY` (`constants/index.ts`).

---

## 6. MÓDULO DE CUENTAS MÉDICAS Y CARTERA
> **Estado del módulo:** ⏳ No iniciado.

### Invariantes Financieras y Control de Glosas
* `@spec:INV-CAR-01` **Trazabilidad de Cartera:** Cartera realiza la trazabilidad financiera de las facturas bajo los estados: `RADICADA`, `GLOSA_TOTAL`, `GLOSA_PARCIAL`, `PAGO_PARCIAL` y `PAGADA`. — **Estado:** ⏳
* `@spec:INV-CM-01` **Respuesta de Glosas:** Cuentas Médicas valida las glosas notificadas por la EPS y permite estructurar las respuestas formales manteniendo la trazabilidad histórica de los conceptos objetados. — **Estado:** ⏳
* `@spec:INV-CM-02` **Inmutabilidad por Pago Aplicado (Bloqueo de Contestación):** Si el módulo de Cartera ya aplicó un pago (parcial o total) a ciertos ítems de una factura, dichos ítems quedan completamente **bloqueados en Cuentas Médicas** y no se podrán modificar ni seleccionar para contestación de glosa, ya que el servicio ha sido legalmente saldado. — **Estado:** ⏳

---

## 7. MÓDULOS ADMINISTRATIVOS, PAZ Y SALVOS Y REPORTES
> **Estado del módulo:** ⏳ No iniciado (parcialmente cubierto por notificaciones de admisión/egreso).

### Invariantes de Operación General
* `@spec:INV-ADM-SYS-01` **Operaciones Administrativas:** El sistema gestiona las atenciones diarias, interconsultas entre especialidades, órdenes médicas y devoluciones a farmacia. — **Estado:** ⏳
* `@spec:INV-ADM-SYS-02` **Expedición de Paz y Salvo:** Un paciente no podrá recibir el Paz y Salvo de egreso si registra medicamentos pendientes por devolver a farmacia, cama no liberada o inconsistencias entre los servicios prestados y la pre-factura.
    * **Estado:** ⏳ — la condición "cama liberada" ya está garantizada por el egreso transaccional (`@spec:INV-ADM-01`); faltan farmacia y pre-factura.
* `@spec:INV-REP-01` **Reportes Transversales:** Cada uno de los módulos (`Admisiones`, `Facturación`, `Cartera`, `Cuentas Médicas`, `Farmacia`, `Citas`) debe proveer sus respectivos informes operativos y consolidados para auditoría interna y entes de control. — **Estado:** ⏳

---
