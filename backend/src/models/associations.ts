import User from "./User";
import Role from "./Role";
import MenuOption from "./MenuOption";
import RoleMenuPermission from "./RoleMenuPermission";
import UserMenuOverride from "./UserMenuOverride";

User.belongsTo(Role, { foreignKey: "roleId", as: "roleData" });
Role.hasMany(User, { foreignKey: "roleId", as: "users" });

User.hasMany(UserMenuOverride, { foreignKey: "userId", as: "menuOverrides" });

Role.hasMany(RoleMenuPermission, { foreignKey: "roleId", as: "menuPermissions" });
RoleMenuPermission.belongsTo(Role, { foreignKey: "roleId", as: "role" });
RoleMenuPermission.belongsTo(MenuOption, { foreignKey: "menuOptionId", as: "menuOption" });

MenuOption.hasMany(RoleMenuPermission, { foreignKey: "menuOptionId", as: "rolePermissions" });

UserMenuOverride.belongsTo(User, { foreignKey: "userId", as: "user" });
UserMenuOverride.belongsTo(MenuOption, { foreignKey: "menuOptionId", as: "menuOption" });

MenuOption.hasMany(MenuOption, { as: "children", foreignKey: "parent_id" });
MenuOption.belongsTo(MenuOption, { as: "parent", foreignKey: "parent_id" });
