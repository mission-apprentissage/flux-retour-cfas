import { ObjectId } from "mongodb";
import { BREVO_TEMPLATE_NAME, BREVO_TEMPLATE_TYPE } from "shared/models/data/brevoMissionLocaleTemplate.model";

import { brevoMissionLocaleTemplateDb } from "@/common/model/collections";

export const up = async () => {
  await brevoMissionLocaleTemplateDb().insertOne({
    _id: new ObjectId(),
    type: BREVO_TEMPLATE_TYPE.MISSION_LOCALE,
    name: BREVO_TEMPLATE_NAME.REFUS,
    templateId: 827,
    created_at: new Date(),
    ml_id: 323,
  });

  await brevoMissionLocaleTemplateDb().insertOne({
    _id: new ObjectId(),
    type: BREVO_TEMPLATE_TYPE.MISSION_LOCALE,
    name: BREVO_TEMPLATE_NAME.CONFIRMATION,
    templateId: 826,
    created_at: new Date(),
    ml_id: 323,
  });
};
