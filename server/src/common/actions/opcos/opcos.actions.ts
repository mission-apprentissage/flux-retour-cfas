import Boom from "boom";
import { ObjectId } from "mongodb";
import { IOpcos, IRncp } from "shared/models";

import { opcosDb, opcosRncpDb } from "@/common/model/collections";

import { updateEffectifComputedFromRNCP } from "../effectifs.actions";

export const findAllOpcos = async () => {
  return opcosDb().find().toArray();
};

export const findOpco = async (id: string) => {
  return opcosDb().findOne({ _id: new ObjectId(id) });
};

export const findRNCPByOpcosId = async (id: string) => {
  const opco = await findOpco(id);
  if (!opco) {
    throw Boom.notFound(`Opco with id ${id} not found`);
  }

  return opcosRncpDb()
    .find({ opco_id: new ObjectId(id) })
    .toArray();
};

export const createRNCPByOpcos = async (opco: IOpcos, rncp: IRncp) => {
  const opcoRncp = await opcosRncpDb().findOne({ opco_id: opco._id, rncp_id: rncp._id });
  if (!opcoRncp) {
    const _computed = {
      opco: { nom: opco.name },
      rncp: { code: rncp.rncp },
    };
    await opcosRncpDb().insertOne({
      _id: new ObjectId(),
      opco_id: opco._id,
      rncp_id: rncp._id,
      _computed,
    });

    updateEffectifComputedFromRNCP(rncp, opco);
  }
};

export const removeRNCPByOpcos = async (opco: IOpcos, rncp: IRncp) => {
  const opcoRncp = await opcosRncpDb().findOne({ opco_id: opco._id, rncp_id: rncp._id });
  if (opcoRncp) {
    return await opcosRncpDb().deleteOne({ _id: opcoRncp._id });
  }
};
