import { Transaction } from "sequelize";
import Cama from "../../models/Cama";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";
import { ADMISSION_ERROR_CODES, BED_STATUS, ERROR_MESSAGES_ADMISION } from "../../constants";

export class BedService {
  public async occupyBed(roomId: number, t: Transaction): Promise<void> {
    const bed = await Cama.findByPk(roomId, { transaction: t });
    if (!bed) throw ApiError.notFound(ERROR_MESSAGES_ADMISION.BED_NOT_FOUND);
    if (bed.bedStatus !== BED_STATUS.AVAILABLE) {
      throw ApiError.conflict(
        ERROR_MESSAGES_ADMISION.BED_UNAVAILABLE,
        ADMISSION_ERROR_CODES.BED_UNAVAILABLE,
      );
    }
    bed.bedStatus = BED_STATUS.OCCUPIED;
    await bed.save({ transaction: t });
  }

  public async releaseBed(roomId: number, t: Transaction): Promise<void> {
    const bed = await Cama.findByPk(roomId, { transaction: t });
    if (!bed) throw ApiError.notFound(ERROR_MESSAGES_ADMISION.BED_NOT_FOUND);
    if (bed.bedStatus !== BED_STATUS.OCCUPIED) {
      throw ApiError.conflict(
        ERROR_MESSAGES_ADMISION.BED_NOT_OCCUPIED,
        ADMISSION_ERROR_CODES.BED_NOT_OCCUPIED,
      );
    }
    bed.bedStatus = BED_STATUS.AVAILABLE;
    await bed.save({ transaction: t });
  }
}