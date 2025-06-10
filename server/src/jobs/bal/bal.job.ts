import { captureException } from "@sentry/node";

import {
  getMissionLocaleRupturantToCheckMail,
  updateRupturantsWithMailInfo,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { verifyBouncerMails } from "@/common/apis/bal/bal.api";

export const verifyMissionLocaleEffectifMail = async () => {
  try {
    const mails = await getMissionLocaleRupturantToCheckMail();
    const result = await verifyBouncerMails(mails);
    await updateRupturantsWithMailInfo(result);
  } catch (error) {
    captureException(error);
  }
};
