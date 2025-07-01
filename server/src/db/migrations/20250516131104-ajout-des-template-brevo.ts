import { ObjectId } from "mongodb";
import { BREVO_TEMPLATE_NAME, BREVO_TEMPLATE_TYPE } from "shared/models/data/brevoMissionLocaleTemplate.model";

import { brevoMissionLocaleTemplateDb } from "@/common/model/collections";

export const up = async () => {
  await brevoMissionLocaleTemplateDb().insertOne({
    _id: new ObjectId(),
    type: BREVO_TEMPLATE_TYPE.MISSION_LOCALE,
    name: BREVO_TEMPLATE_NAME.REFUS,
    templateId: 2,
    created_at: new Date(),
  });

  await brevoMissionLocaleTemplateDb().insertOne({
    _id: new ObjectId(),
    type: BREVO_TEMPLATE_TYPE.MISSION_LOCALE,
    name: BREVO_TEMPLATE_NAME.CONFIRMATION,
    templateId: 1,
    created_at: new Date(),
  });
};
