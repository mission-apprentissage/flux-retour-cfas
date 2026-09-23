import { z } from "zod";

export const CFA_INVITES_SORT_FIELDS = ["localisation", "invitations"] as const;
export const zCfaInvitesSortBy = z.enum(CFA_INVITES_SORT_FIELDS);
export type ICfaInvitesSortBy = z.output<typeof zCfaInvitesSortBy>;

export const zCfaInvitesSansCollabQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(10).max(50).default(10),
  sort_by: zCfaInvitesSortBy.default("invitations"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export type ICfaInvitesSansCollabQuery = z.output<typeof zCfaInvitesSansCollabQuery>;

const zCfaInviteSansCollabRow = z.object({
  organisme_id: z.string(),
  siret: z.string(),
  uai: z.string().nullable(),
  raison_sociale: z.string().nullable(),
  adresse: z
    .object({
      code_postal: z.string().nullable(),
      commune: z.string().nullable(),
      complete: z.string().nullable(),
    })
    .nullable(),
  invitations_recues: z.number(),
  ml_invitantes: z.number(),
  derniere_invitation_at: z.date(),
});

export type ICfaInviteSansCollabRow = z.output<typeof zCfaInviteSansCollabRow>;

export const zCfaInvitesSansCollabResponse = z.object({
  total: z.number(),
  pagination: z.object({ page: z.number(), limit: z.number(), total_pages: z.number() }),
  data: z.array(zCfaInviteSansCollabRow),
});

export type ICfaInvitesSansCollabResponse = z.output<typeof zCfaInvitesSansCollabResponse>;
