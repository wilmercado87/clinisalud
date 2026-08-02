import Usuario from "../models/Usuario";
import { UserResponse } from "../modules/users/users.types";

export const toSafeUserJson = (user: Usuario): UserResponse => {
  const { password: _password, ...safe } = user.toJSON() as UserResponse & { password?: string };
  return safe;
};
