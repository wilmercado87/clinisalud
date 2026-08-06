import { Transaction } from "sequelize";
import TipoEstado from "../../models/TipoEstado";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";

export async function getStatusIdByDescription(
  description: string,
  t?: Transaction,
): Promise<number> {
  const status = await TipoEstado.findOne({ where: { description }, transaction: t });
  if (!status) {
    throw ApiError.internal(
      `El estado del sistema '${description}' no está configurado en la tabla tipo_estado`,
    );
  }
  return status.id;
}