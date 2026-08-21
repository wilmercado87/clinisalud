# ESPECIFICACIÓN TÉCNICA Y REGLAS DE NEGOCIO (SDD MAESTRO)
> **Proyecto:** CLINISALUD - Sistema Integral de Gestión Hospitalaria (Desarrollos WikarSoft)
> **Versión:** 1.1.0
> **Objetivo:** Cero Glosas, Trazabilidad Financiera, Integración Farmacia-Facturación y Liquidación Tarifaria (ISS/SOAT).
> **Historial:** 1.0.0 SDD Maestro inicial · 1.1.0 Módulo Autorizaciones como página independiente (`/dashboard/authorizations`).

---

## 0. MÓDULO CORE: SEGURIDAD, ROLES Y NOTIFICACIONES

### Catálogos Transversales y Datos Maestros
* `@spec:INV-CAT-01` **Listados Transversales Unificados:** Los listados paramétricos (`TipoDocumento`, `TipoGenero`, `TipoUsuario`, `Convenio`, `Departamento`, `Municipio`) deben servirse a través de un módulo centralizado de catálogos (`/api/v1/catalogs`).
* `@spec:INV-CAT-02` **Caché de Sesión y Limpieza Atómica:** El Frontend debe mantener en memoria los catálogos consultados para evitar solicitudes redundantes. Al ejecutarse el cierre de sesión (`AuthStore.logout()`), la caché del `CatalogStore` debe destruirse de manera atómica.

### Invariantes de Control de Acceso (RBAC) y Seguridad
* `@spec:INV-SEC-01` **Autenticación Estricta:** Todo acceso al sistema (excepto el login) exige un token JWT válido y no expirado. Los usuarios con estado inactivo (`isActive = false`) tienen el acceso denegado a nivel de interceptor y backend.
* `@spec:INV-SEC-02` **Permisos Híbridos (Roles + Sobreescrituras):** El menú dinámico y el acceso a módulos se calcula uniendo los permisos base del Rol del usuario (`PermisoRolMenu`) y aplicando las excepciones específicas de habilitación/restricción granulares (`SobreescrituraMenuUsuario`).
* `@spec:INV-SEC-03` **Protección de Privilegios Administrativos:** Ningún usuario, ni siquiera un `ADMIN`, puede modificar los permisos, estado o rol de un usuario con nivel `SUPER_ADMIN`. Solo un `SUPER_ADMIN` puede crear o modificar a otro `ADMIN`.
* `@spec:INV-SEC-04` **Notificaciones de Auditoría:** Operaciones críticas como la creación de usuarios o cambios de estado (`toggleUserStatus`) deben emitir una notificación persistente y en tiempo real (WebSockets) a todos los administradores activos del sistema.

---

## 1. MÓDULO DE CITAS MÉDICAS

### Invariantes y Reglas Operativas
* `@spec:INV-CIT-01` **Gestión de Agenda por Especialidad:** Todo médico debe tener parametrizada su agenda vinculada a su especialidad (`Especialidad`). No se pueden asignar citas fuera de los rangos de horario activos del médico.
* `@spec:INV-CIT-02` **Asignación y Control de Pacientes:** La asignación de citas (primera vez o controles) exige la existencia del paciente en el módulo `Paciente`. Una cita atendida debe cambiar automáticamente de estado y permitir la apertura del ingreso en Historia Clínica.

---

## 2. MÓDULO DE ADMISIONES, CENSO Y AUTORIZACIONES

### Invariantes y Reglas Anti-Glosa
* `@spec:INV-ADM-01` **Control de Censo y Disponibilidad de Camas:** Todo ingreso de tipo hospitalización puede asignar una cama (`Admision.roomId`) cuyo estado sea `0` (Disponible); la asignación es opcional al registrar y puede hacerse después mediante actualización de la admisión activa. Al asignar la cama, esta cambia automáticamente a estado `1` (Ocupada) dentro de la misma transacción. Si una admisión activa reasigna la cama, la cama anterior vuelve a `Disponible` y la nueva pasa a `Ocupada` de forma atómica.
* `@spec:INV-ADM-07` **Actualización de Admisión Activa:** Si el paciente consultado ya tiene una admisión activa (`statusId` diferente de `EGRESADA`), el formulario no permite crear una nueva admisión: bloquea los datos del paciente, acompañante, EPS y observaciones, y habilita únicamente la selección de cama y el registro de autorizaciones. El botón cambia a `Actualizar Admisión` y solo se habilita cuando hay cambios reales (cama distinta o autorizaciones nuevas). Las autorizaciones y la cama quedan persistidas en la admisión existente y se muestran al re-consultar el paciente (`PATCH /admissions/:admissionNumber`).
* `@spec:INV-ADM-02` **Control de Autorizaciones por Servicio:** En el momento del ingreso o solicitud del servicio, el módulo debe registrar la solicitud de autorización a la EPS (`Autorizacion`).
* `@spec:INV-ADM-03` **Vinculación Obligatoria para Facturación:** Se controla que todo servicio que requiera autorización previa según el contrato de la EPS tenga su respectivo número de autorización registrado (`Autorizacion.authNumber`). De lo contrario, el servicio quedará bloqueado para cobro.
* `@spec:INV-ADM-04` **Regresión de Estado en Censo (Corrección Operativa):** Una admisión puede regresar al estado inmediatamente anterior (`EN_ATENCION → REGISTRADA`, `CON_EPICRISIS → EN_ATENCION`) desde el Censo Hospitalario para corregir errores operativos. La acción exige confirmación explícita del usuario y queda registrada en la auditoría de la admisión.
* `@spec:INV-ADM-05` **Irreversibilidad por Integridad Financiera:** Una admisión en estado `FACTURADA` o `EGRESADA` **no puede** regresar a un estado anterior. `FACTURADA` inicia el ciclo de facturación y glosas ante la EPS; `EGRESADA` liberó la cama y cerró el egreso. Deshacer estos estados rompería la trazabilidad financiera y el control de camas.
* `@spec:INV-ADM-06` **Registro de Fecha y Hora Local:** El registro de la admisión captura fecha y hora local (`YYYY-MM-DD HH:mm:ss`) en `Admision.admissionDate`. El Censo Hospitalario muestra el campo Fecha Ingreso con fecha y hora (hh:mm:ss) para trazabilidad operativa del ingreso.

### Máquina de Estados de la Admisión
$$\text{REGISTRADA} \Longleftrightarrow \text{EN\_ATENCION} \Longleftrightarrow \text{CON\_EPICRISIS} \longrightarrow \text{FACTURADA} \longrightarrow \text{EGRESADA}$$

* Las flechas dobles (`⇄`) indican transiciones reversibles de corrección operativa (requieren confirmación).
* `FACTURADA` y `EGRESADA` son estados terminales irreversibles (`@spec:INV-ADM-05`).

### Gestión de Autorizaciones (Módulo Autorizaciones)
* `@spec:INV-AUT-01` **Consulta Dual de la Admisión:** El módulo Autorizaciones (`/dashboard/authorizations`, visible según `INV-SEC-02`; acceso backend restringido a `SUPER_ADMIN`, `ADMIN`, `ADMISIONES`) localiza la admisión por dos vías: Tipo + Número de Documento del paciente (`GET /admissions/patient-lookup`) o Número de Admisión (`GET /admissions/:admissionNumber`). Ambas respuestas comparten la misma estructura (paciente + admisión activa con autorizaciones y estado). El resultado se presenta en tarjetas independientes: información básica del paciente, información de la admisión y gestión de autorizaciones.
* `@spec:INV-AUT-02` **Componente Único de Registro de Autorizaciones:** La captura de autorizaciones (tipo, número, CUPS/MAPIISS con búsqueda por tarifario, cantidad) proviene de un único componente reutilizable: se presenta como modal en el formulario de Admisiones y embebido como pantalla en el módulo Autorizaciones. En ambos contextos aplican idénticas reglas anti-glosa: tarifario derivado del contrato de la EPS, anti-duplicado y cantidad acumulada máxima por servicio (`@spec:INV-ADM-02`, `@spec:INV-ADM-03`).
* `@spec:INV-AUT-03` **Persistencia y Recarga Inmediata:** El guardado ejecuta `PATCH /admissions/:admissionNumber` con las autorizaciones en cola; al éxito se limpia la cola, se notifica al usuario y se recarga la admisión mostrando las autorizaciones persistidas. Las admisiones egresadas no admiten nuevas autorizaciones (consistente con `@spec:INV-ADM-05`).

---

## 3. MÓDULO DE HISTORIA CLÍNICA Y EPICRISIS

### Invariantes y Soportes
* `@spec:INV-HC-01` **Trazabilidad por Documento o Ingreso:** Cada atención médica queda registrada y vinculada de manera unívoca al documento del paciente (`Paciente.document`) o al número de admisión (`Admision.admissionNumber`).
* `@spec:INV-HC-02` **Soporte de Atención (Epicrisis):** Toda admisión hospitalaria o de urgencias debe culminar con la elaboración de la Epicrisis por parte del profesional de la salud. La Epicrisis actúa como el soporte legal e indispensable para habilitar el proceso de facturación.

---

## 4. MÓDULO DE ALMACÉN, FARMACIA Y DEVOLUCIONES

### Invariantes y Control de Inventarios Anti-Glosa
* `@spec:INV-ALM-01` **Regulación de Stock (Almacén):** El módulo de Almacén regula la entrada de medicamentos y suministros al stock general de la IPS, manteniendo control en tiempo real del inventario disponible.
* `@spec:INV-FAR-01` **Despacho por Orden Médica:** Farmacia realiza la entrega de medicamentos y suministros exclusivamente mediante una orden de suministros médica activa asociada al paciente.
* `@spec:INV-FAR-02` **Carga Automática a Facturación (Despachado = Aplicado):** Todo medicamento o insumo entregado a un paciente se cargará automáticamente como ítem en la pre-factura del módulo de Facturación para garantizar que lo despachado sea exactamente igual a lo cobrado y evitar glosas.
* `@spec:INV-FAR-03` **Excepción de Insumos de Procedimiento:** Los insumos aplicados en procedimientos (*gasas, guantes, apósitos, electrodos, etc.*) no se cargarán como ítems cobrables individuales si la tarifa del procedimiento (ISS/SOAT) los incluye dentro de los derechos de sala o materiales.
* `@spec:INV-FAR-04` **Devoluciones a Farmacia:** Si un medicamento o insumo no es aplicado al paciente y se realiza la devolución a Farmacia mediante el módulo administrativo, el sistema reingresa el ítem al stock y descuenta inmediatamente el cargo del borrador de facturación.

---

## 5. MÓDULO DE FACTURACIÓN Y MANUALES TARIFARIOS

### Invariantes Anti-Glosa y Liquidación
* `@spec:INV-FAC-01` **Control por Centros de Costos y Complejidad:** El módulo valida los servicios por nivel de complejidad y centro de costos. Si un servicio requiere autorización y esta no ha sido registrada por Admisiones, el sistema **impedirá la facturación del servicio**.
* `@spec:INV-FAC-02` **Bloqueo de Emisión por Epicrisis Pendiente:** Al intentar generar una factura final, el sistema valida si la Epicrisis ha sido realizada. Si la Epicrisis está pendiente, el sistema guarda los cambios del borrador pero **NO genera la factura** hasta que la Epicrisis sea firmada y completada.
* `@spec:INV-FAC-03` **Generación Automática de Cuadro de Justificación CTC (No-POS):** Durante la revisión o generación de la Epicrisis, el sistema detecta medicamentos y procedimientos No-POS / MIPRES y genera automáticamente el cuadro de justificación para el Comité Técnico Científico (CTC) con el fin de prevenir la Glosa Total de la cuenta.
* `@spec:INV-FAC-04` **Liquidación por Manuales Tarifarios (ISS 2000, ISS 2001, SOAT):** La liquidación de servicios se calcula estrictamente conforme a las reglas del manual parametrizado en el contrato de la EPS (`Contrato.feeScheduleId`), aplicando UVRs, valores de cirujano, anestesiólogo, ayudante, sala y materiales, ajustados por los porcentajes de variación ambulatoria, urgencia u hospitalización (`PORCENTAJE_AMB`, `PORCENTAJE_URG`, `PORCENTAJE_HOSP`).
* `@spec:INV-FAC-05` **Cálculo de Copagos y Cuotas Moderadoras:** Según la categoría del usuario (`TipoUsuario`), el sistema liquida los valores de copago, cuota moderadora y respeta los topes por evento o topes anuales antes de emitir la factura a la EPS.

---

## 6. MÓDULO DE CUENTAS MÉDICAS Y CARTERA

### Invariantes Financieras y Control de Glosas
* `@spec:INV-CAR-01` **Trazabilidad de Cartera:** Cartera realiza la trazabilidad financiera de las facturas bajo los estados: `RADICADA`, `GLOSA_TOTAL`, `GLOSA_PARCIAL`, `PAGO_PARCIAL` y `PAGADA`.
* `@spec:INV-CM-01` **Respuesta de Glosas:** Cuentas Médicas valida las glosas notificadas por la EPS y permite estructurar las respuestas formales manteniendo la trazabilidad histórica de los conceptos objetados.
* `@spec:INV-CM-02` **Inmutabilidad por Pago Aplicado (Bloqueo de Contestación):** Si el módulo de Cartera ya aplicó un pago (parcial o total) a ciertos ítems de una factura, dichos ítems quedan completamente **bloqueados en Cuentas Médicas** y no se podrán modificar ni seleccionar para contestación de glosa, ya que el servicio ha sido legalmente saldado.

---

## 7. MÓDULOS ADMINISTRATIVOS, PAZ Y SALVOS Y REPORTES

### Invariantes de Operación General
* `@spec:INV-ADM-SYS-01` **Operaciones Administrativas:** El sistema gestiona las atenciones diarias, interconsultas entre especialidades, órdenes médicas y devoluciones a farmacia.
* `@spec:INV-ADM-SYS-02` **Expedición de Paz y Salvo:** Un paciente no podrá recibir el Paz y Salvo de egreso si registra medicamentos pendientes por devolver a farmacia, cama no liberada o inconsistencias entre los servicios prestados y la pre-factura.
* `@spec:INV-REP-01` **Reportes Transversales:** Cada uno de los módulos (`Admisiones`, `Facturación`, `Cartera`, `Cuentas Médicas`, `Farmacia`, `Citas`) debe proveer sus respectivos informes operativos y consolidados para auditoría interna y entes de control.