import logger from "@/common/logger";
import { opcosDb } from "@/common/model/collections";
import { postRNCPByOpcosId } from "@/http/routes/admin.routes/opcos.routes";

export const initOpcos = async (name, rncpList) => {
  const opco = await opcosDb().findOne({ name });
  if (!opco) {
    logger.error(`Opco not found : ${name}`);
    return;
  }

  postRNCPByOpcosId({ params: { id: opco._id }, body: { rncp: rncpList } });
};
