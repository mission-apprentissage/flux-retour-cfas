import { object, string, objectId, date, boolean } from "../json-schema/jsonSchemaTypes.js";

export const collectionName = "notifications";

// export function indexes() {
//   return [[{ jwt: 1 }, { unique: true }]];
// }

export const schema = object(
  {
    _id: objectId(),
    context: string({
      description: "context",
      // TODO enum
    }),
    to: string({ description: "to whom email" }),
    channel: string({
      description: "channel",
      // TODO enum
    }),
    subject: string({ description: "subject" }),
    message: string({ description: "message" }),
    link: string({ description: "link" }),
    payload: object({ description: "payload" }),
    date: date({ description: "Date" }),
    active: boolean({ description: "Notification active" }),
  },
  { required: ["context", "to", "channel", "subject", "link", "date", "active"], additionalProperties: false }
);

// Default value
export function defaultValuesNotification() {
  return {
    date: new Date(),
  };
}

// TODO [tech] USAGE ACTIONS
// sendNotification("organisme_invite_tojoin", ["@user1"], ["email", "internal"], {
//   subject: `Invitation à rejoindre l'espace XXX`,
//   message: `Vous avez été invité à rejoindre l'espace XXX`,
//   link: `/pathto`,
//   payload: {},
// });
// sendNotification("organisme_invite_hasjoin", ["@user2"], ["internal"], {
//   subject: `User1 a rejoint l'espace XXX`,
//   message: `User1 a rejoint l'espace XXX`,
//   link: `/pathto`,
//   payload: {},
// });
