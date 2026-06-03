import { ObjectId } from "mongodb";
import { BREVO_TEMPLATE_NAME, BREVO_TEMPLATE_TYPE } from "shared/models/data/brevoMissionLocaleTemplate.model";

import { brevoMissionLocaleTemplateDb } from "@/common/model/collections";

// TODO: remplacer par l'ID réel du template "Invitation CFA" créé dans l'interface Brevo par l'UX
// avant d'exécuter cette migration en production.
const INVITATION_CFA_TEMPLATE_ID = 0;

export const up = async () => {
  await brevoMissionLocaleTemplateDb().insertOne({
    _id: new ObjectId(),
    type: BREVO_TEMPLATE_TYPE.MISSION_LOCALE,
    name: BREVO_TEMPLATE_NAME.INVITATION_CFA,
    templateId: INVITATION_CFA_TEMPLATE_ID,
    created_at: new Date(),
  });
};
