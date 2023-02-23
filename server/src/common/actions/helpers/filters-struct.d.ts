export type EffectifsFilters = {
  date: Date
  organisme_id?: string
  organisme_ids?: string[]
  formation_cfd?: string
  etablissement_reseaux?: string
  etablissement_num_departement?: string
  etablissement_num_region?: string
  niveau_formation?: string
  siret_etablissement?: string
  uai_etablissement?: string
};

export interface FilterConfiguration {
  matchKey: string

  // optional transformer
  transformValue?: (value: any) => any

  // some filters need a preliminary lookup with another collection
  preliminaryLookup?: {
    from: string
    localField: string
    foreignField: string
    as: string
  }
}

export type FilterConfigurations = {[key in EffectifsFilters]: FilterConfiguration}
