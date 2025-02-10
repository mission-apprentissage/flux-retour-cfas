import type { Jsonify } from "type-fest";
import type { z } from "zod";

import { zOrganisation, zOrganisme, zUsersMigration } from "../../data";

export const zArchivableOrganisme = zOrganisme.extend({
  organisation: zOrganisation.nullable().default(null),
  users: zUsersMigration.array(),
  organismes_transmis: zOrganisme.array(),
  organismes_duplicats: zOrganisme.array(),
});

export type IArchivableOrganisme = z.output<typeof zArchivableOrganisme>;
export type IArchivableOrganismeJson = Jsonify<IArchivableOrganisme>;

export const zArchivableOrganismesResponse = zArchivableOrganisme.array();

export type IArchivableOrganismesResponse = z.output<typeof zArchivableOrganismesResponse>;
export type IArchivableOrganismesResponseJson = Jsonify<IArchivableOrganismesResponse>;
