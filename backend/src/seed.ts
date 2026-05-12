import * as bcrypt from "bcryptjs";
import Role from "./models/Role";
import MenuOption from "./models/MenuOption";
import User from "./models/User";
import RoleMenuPermission from "./models/RoleMenuPermission";
import UserMenuOverride from "./models/UserMenuOverride";

export const runSeeder = async () => {
  try {
    console.log("🚀 Iniciando Seed de Clinisalud 2026...");

    // 1. Crear Roles (Asegurando que el ADMIN sea el primero)
    const [adminRole] = await Role.findOrCreate({
      where: { code: "ADMIN" },
      defaults: { name: "Administrador Sistema", code: "ADMIN" },
    });

    const [docRole] = await Role.findOrCreate({
      where: { code: "DOC" },
      defaults: { name: "Cuerpo Médico", code: "DOC" },
    });

    const [factRole] = await Role.findOrCreate({
      where: { code: "FACT" },
      defaults: { name: "Facturador/Admisiones", code: "FACT" },
    });

    const [mainPanel] = await MenuOption.findOrCreate({
      where: { label: "PANEL PRINCIPAL" },
      defaults: { label: "PANEL PRINCIPAL", icon: "grid_view", order: 1 },
    });

    const subOptions = [
      {
        label: "Admision",
        icon: "person_add",
        path: "/dashboard/admission",
        parentId: mainPanel.id,
        order: 1,
      },
      {
        label: "Autorizaciones",
        icon: "verified",
        path: "/dashboard/authorizations",
        parentId: mainPanel.id,
        order: 2,
      },
      {
        label: "Facturacion Rips",
        icon: "receipt_long",
        path: "/dashboard/billing",
        parentId: mainPanel.id,
        order: 3,
      },
      {
        label: "Citas",
        icon: "event",
        path: "/dashboard/appointments",
        parentId: mainPanel.id,
        order: 4,
      },
      {
        label: "Historia Clinica",
        icon: "description",
        path: "/dashboard/history",
        parentId: mainPanel.id,
        order: 5,
      },
    ];

    for (const sub of subOptions) {
      await MenuOption.findOrCreate({
        where: { label: sub.label },
        defaults: sub,
      });
    }

    const [userGestor] = await MenuOption.findOrCreate({
      where: { label: "Gestor Usuarios" },
      defaults: {
        label: "Gestor Usuarios",
        icon: "manage_accounts",
        path: "/dashboard/users",
        order: 6,
      },
    });

    // 3. Asignación Masiva de Permisos
    const allOptions = await MenuOption.findAll();

    // --- ADMIN: Acceso a TODO (Incluyendo el Gestor de Usuarios) ---
    for (const opt of allOptions) {
      await RoleMenuPermission.findOrCreate({
        where: { roleId: adminRole.id, menuOptionId: opt.id },
      });
    }

    // --- DOC: Acceso limitado (Solo Médico) ---
    const medicalLabels = ["PANEL PRINCIPAL", "Citas", "Historia Clinica"];
    const medicalMenu = allOptions.filter((o) =>
      medicalLabels.includes(o.label),
    );
    for (const opt of medicalMenu) {
      await RoleMenuPermission.findOrCreate({
        where: { roleId: docRole.id, menuOptionId: opt.id },
      });
    }

    // --- FACT: Acceso administrativo (Nuevo ajuste) ---
    const factLabels = [
      "PANEL PRINCIPAL",
      "Admision",
      "Autorizaciones",
      "Facturacion Rips",
    ];
    const factMenu = allOptions.filter((o) => factLabels.includes(o.label));
    for (const opt of factMenu) {
      await RoleMenuPermission.findOrCreate({
        where: { roleId: factRole.id, menuOptionId: opt.id },
      });
    }

    // 4. Crear Usuario Admin Inicial
    const adminEmail = "admin@clinisalud.com";
    let adminUser = await User.findOne({ where: { email: adminEmail } });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash("Admin2026!", 10);
      adminUser = await User.create({
        firstName: "Admin",
        lastName: "General",
        dni: "00000000",
        email: adminEmail,
        password: hashedPassword,
        roleId: adminRole.id,
        isActive: true,
      });
      console.log(`✅ Admin creado: ${adminEmail} / Admin2026!`);
    }

    // 5. Crear permisos del admin en UserMenuOverride
    const existingOverrides = await UserMenuOverride.findOne({ where: { userId: adminUser.id } });
    if (!existingOverrides) {
      const overrideData = allOptions.map(opt => ({
        userId: adminUser.id,
        menuOptionId: opt.id,
        hasAccess: true,
      }));
      await UserMenuOverride.bulkCreate(overrideData);
      console.log(`✅ Permisos del admin configurados en UserMenuOverride`);
    }

    console.log("✨ Seed completado con éxito.");
  } catch (error) {
    console.error("❌ Error en el Seed:", error);
  }
};
