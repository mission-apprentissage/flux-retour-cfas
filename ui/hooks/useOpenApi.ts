import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";

const useOpenApi = () => {
  const { data: openapiSpecs, error, isLoading } = useQuery(["openapi"], () => _get<TData>("/api/openapi.json"));

  const props =
    openapiSpecs?.paths["/v3/dossiers-apprenants"].post.requestBody.content["application/json"].schema.items.properties;

  const data = Object.entries(props || {}).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: { ...value.properties, required: (value as any).required } }),
    {
      apprenant: { required: [] },
      formation: { required: [] },
      etablissement_responsable: { required: [] },
      Etablissement_formateur: { required: [] },
      employeur: { required: [] },
      contrat: { required: [] },
    } as Record<keyof typeof props, Record<string, any> & { required: string[] }>
  );

  console.log({ data });
  return {
    data,
    isLoading,
    error,
  };
};

export default useOpenApi;

type TData = {
  info: {
    version: string;
    title: string;
    description: string;
    contact: {
      name: string;
      email: string;
    };
  };
  externalDocs: {
    description: string;
    url: string;
  };
  servers: Array<{
    url: string;
  }>;
  tags: Array<{
    name: string;
    description: string;
  }>;
  openapi: string;
  components: {
    securitySchemes: {
      httpAuth: {
        description: string;
        type: string;
        scheme: string;
      };
      apiKeyAuth: {
        description: string;
        type: string;
        name: string;
        in: string;
      };
    };
    schemas: {};
    parameters: {};
  };
  paths: {
    "/login": {
      post: {
        summary: string;
        tags: Array<string>;
        requestBody: {
          required: boolean;
          content: {
            "application/json": {
              schema: {
                type: string;
                properties: {
                  username: {
                    type: string;
                    description: string;
                    example: string;
                  };
                  password: {
                    type: string;
                    description: string;
                    example: string;
                  };
                };
                required: Array<string>;
              };
            };
          };
        };
        responses: {
          "200": {
            description: string;
            content: {
              "application/json": {
                schema: {
                  type: string;
                  properties: {
                    "400": {
                      description: string;
                    };
                    access_token: {
                      type: string;
                      description: string;
                      example: string;
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
    "/status-apprenants": {
      post: {
        deprecated: boolean;
        tags: Array<string>;
        summary: string;
        description: string;
        security: Array<{
          httpAuth: Array<any>;
        }>;
        requestBody: {
          required: boolean;
          content: {
            "application/json": {
              schema: {
                type: string;
                items: {
                  type: string;
                  properties: {
                    nom_apprenant: {
                      type: string;
                      minLength: number;
                      description: string;
                      example: string;
                    };
                    prenom_apprenant: {
                      type: string;
                      minLength: number;
                      description: string;
                      example: string;
                    };
                    date_de_naissance_apprenant: {
                      type: string;
                      format: string;
                      description: string;
                      example: string;
                    };
                    uai_etablissement: {
                      type: string;
                      pattern: string;
                      description: string;
                      example: string;
                    };
                    nom_etablissement: {
                      type: string;
                      description: string;
                    };
                    id_formation: {
                      type: string;
                      pattern: string;
                      description: string;
                    };
                    annee_scolaire: {
                      type: string;
                      description: string;
                      examples: Array<string>;
                    };
                    statut_apprenant: {
                      type: string;
                      description: string;
                      enum: Array<number>;
                    };
                    date_metier_mise_a_jour_statut: {
                      type: string;
                      format: string;
                      description: string;
                    };
                    id_erp_apprenant: {
                      type: string;
                      description: string;
                    };
                    source: {
                      type: string;
                      minLength: number;
                    };
                    ine_apprenant: {
                      type: string;
                      description: string;
                    };
                    email_contact: {
                      type: string;
                      format: string;
                      description: string;
                      example: string;
                    };
                    tel_apprenant: {
                      type: string;
                      pattern: string;
                      example: string;
                      description: string;
                    };
                    code_commune_insee_apprenant: {
                      type: string;
                      pattern: string;
                      description: string;
                    };
                    siret_etablissement: {
                      type: string;
                      pattern: string;
                      description: string;
                      example: string;
                    };
                    libelle_court_formation: {
                      type: string;
                      description: string;
                      example: string;
                    };
                    libelle_long_formation: {
                      type: string;
                      description: string;
                      example: string;
                    };
                    periode_formation: {
                      type: string;
                      description: string;
                      example: string;
                    };
                    annee_formation: {
                      type: string;
                      description: string;
                      enum: Array<string>;
                      example: string;
                    };
                    formation_rncp: {
                      type: string;
                      pattern: string;
                      description: string;
                      examples: Array<string>;
                    };
                    contrat_date_debut: {
                      type: string;
                      format: string;
                      description: string;
                      example: string;
                    };
                    contrat_date_fin: {
                      type: string;
                      format: string;
                      description: string;
                      example: string;
                    };
                    contrat_date_rupture: {
                      type: string;
                      format: string;
                      description: string;
                      example: string;
                    };
                  };
                  required: Array<string>;
                };
              };
            };
          };
        };
        responses: {
          "200": {
            description: string;
            content: {
              "application/json": {
                schema: {
                  type: string;
                  properties: {
                    message: {
                      type: string;
                      description: string;
                      enum: Array<string>;
                    };
                    data: {
                      type: string;
                      items: {
                        type: string;
                        properties: {
                          nom_apprenant: {
                            type: string;
                            minLength: number;
                            description: string;
                            example: string;
                          };
                          prenom_apprenant: {
                            type: string;
                            minLength: number;
                            description: string;
                            example: string;
                          };
                          date_de_naissance_apprenant: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                          };
                          uai_etablissement: {
                            type: string;
                            pattern: string;
                            description: string;
                            example: string;
                          };
                          nom_etablissement: {
                            type: string;
                            description: string;
                          };
                          id_formation: {
                            type: string;
                            pattern: string;
                            description: string;
                          };
                          annee_scolaire: {
                            type: string;
                            description: string;
                            examples: Array<string>;
                          };
                          statut_apprenant: {
                            type: string;
                            description: string;
                            enum: Array<number>;
                          };
                          date_metier_mise_a_jour_statut: {
                            type: string;
                            format: string;
                            description: string;
                          };
                          id_erp_apprenant: {
                            type: string;
                            description: string;
                          };
                          source: {
                            type: string;
                            minLength: number;
                          };
                          ine_apprenant: {
                            type: string;
                            description: string;
                          };
                          email_contact: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                          };
                          tel_apprenant: {
                            type: string;
                            pattern: string;
                            example: string;
                            description: string;
                          };
                          code_commune_insee_apprenant: {
                            type: string;
                            pattern: string;
                            description: string;
                          };
                          siret_etablissement: {
                            type: string;
                            pattern: string;
                            description: string;
                            example: string;
                          };
                          libelle_court_formation: {
                            type: string;
                            description: string;
                            example: string;
                          };
                          libelle_long_formation: {
                            type: string;
                            description: string;
                            example: string;
                          };
                          periode_formation: {
                            type: string;
                            description: string;
                            example: string;
                          };
                          annee_formation: {
                            type: string;
                            description: string;
                            enum: Array<string>;
                            example: string;
                          };
                          formation_rncp: {
                            type: string;
                            pattern: string;
                            description: string;
                            examples: Array<string>;
                          };
                          contrat_date_debut: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                          };
                          contrat_date_fin: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                          };
                          contrat_date_rupture: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                          };
                          validation_errors: {
                            type: string;
                            items: {
                              type: string;
                              properties: {
                                msg: {
                                  type: string;
                                  description: string;
                                  example: string;
                                };
                                path: {
                                  type: string;
                                  description: string;
                                  example: string;
                                };
                              };
                              required: Array<string>;
                            };
                            description: string;
                          };
                        };
                        required: Array<string>;
                      };
                    };
                  };
                  required: Array<string>;
                };
              };
            };
          };
          "400": {
            description: string;
          };
          "500": {
            description: string;
          };
        };
      };
    };
    "/dossiers-apprenants": {
      post: {
        tags: Array<string>;
        summary: string;
        description: string;
        security: Array<{
          httpAuth: Array<any>;
        }>;
        requestBody: {
          required: boolean;
          content: {
            "application/json": {
              schema: {
                type: string;
                items: {
                  type: string;
                  properties: {
                    nom_apprenant: {
                      type: string;
                      minLength: number;
                      description: string;
                      example: string;
                    };
                    prenom_apprenant: {
                      type: string;
                      minLength: number;
                      description: string;
                      example: string;
                    };
                    date_de_naissance_apprenant: {
                      type: string;
                      format: string;
                      description: string;
                      example: string;
                    };
                    uai_etablissement: {
                      type: string;
                      pattern: string;
                      description: string;
                      example: string;
                    };
                    nom_etablissement: {
                      type: string;
                      description: string;
                    };
                    id_formation: {
                      type: string;
                      pattern: string;
                      description: string;
                    };
                    annee_scolaire: {
                      type: string;
                      description: string;
                      examples: Array<string>;
                    };
                    statut_apprenant: {
                      type: string;
                      description: string;
                      enum: Array<number>;
                    };
                    date_metier_mise_a_jour_statut: {
                      type: string;
                      format: string;
                      description: string;
                    };
                    id_erp_apprenant: {
                      type: string;
                      description: string;
                    };
                    source: {
                      type: string;
                      minLength: number;
                    };
                    ine_apprenant: {
                      type: string;
                      description: string;
                    };
                    email_contact: {
                      type: string;
                      format: string;
                      description: string;
                      example: string;
                    };
                    tel_apprenant: {
                      type: string;
                      pattern: string;
                      example: string;
                      description: string;
                    };
                    code_commune_insee_apprenant: {
                      type: string;
                      pattern: string;
                      description: string;
                    };
                    siret_etablissement: {
                      type: string;
                      pattern: string;
                      description: string;
                      example: string;
                    };
                    libelle_court_formation: {
                      type: string;
                      description: string;
                      example: string;
                    };
                    libelle_long_formation: {
                      type: string;
                      description: string;
                      example: string;
                    };
                    periode_formation: {
                      type: string;
                      description: string;
                      example: string;
                    };
                    annee_formation: {
                      type: string;
                      description: string;
                      enum: Array<string>;
                      example: string;
                    };
                    formation_rncp: {
                      type: string;
                      pattern: string;
                      description: string;
                      examples: Array<string>;
                    };
                    contrat_date_debut: {
                      type: string;
                      format: string;
                      description: string;
                      example: string;
                    };
                    contrat_date_fin: {
                      type: string;
                      format: string;
                      description: string;
                      example: string;
                    };
                    contrat_date_rupture: {
                      type: string;
                      format: string;
                      description: string;
                      example: string;
                    };
                  };
                  required: Array<string>;
                };
              };
            };
          };
        };
        responses: {
          "200": {
            description: string;
            content: {
              "application/json": {
                schema: {
                  type: string;
                  properties: {
                    message: {
                      type: string;
                      description: string;
                      enum: Array<string>;
                    };
                    data: {
                      type: string;
                      items: {
                        type: string;
                        properties: {
                          nom_apprenant: {
                            type: string;
                            minLength: number;
                            description: string;
                            example: string;
                          };
                          prenom_apprenant: {
                            type: string;
                            minLength: number;
                            description: string;
                            example: string;
                          };
                          date_de_naissance_apprenant: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                          };
                          uai_etablissement: {
                            type: string;
                            pattern: string;
                            description: string;
                            example: string;
                          };
                          nom_etablissement: {
                            type: string;
                            description: string;
                          };
                          id_formation: {
                            type: string;
                            pattern: string;
                            description: string;
                          };
                          annee_scolaire: {
                            type: string;
                            description: string;
                            examples: Array<string>;
                          };
                          statut_apprenant: {
                            type: string;
                            description: string;
                            enum: Array<number>;
                          };
                          date_metier_mise_a_jour_statut: {
                            type: string;
                            format: string;
                            description: string;
                          };
                          id_erp_apprenant: {
                            type: string;
                            description: string;
                          };
                          source: {
                            type: string;
                            minLength: number;
                          };
                          ine_apprenant: {
                            type: string;
                            description: string;
                          };
                          email_contact: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                          };
                          tel_apprenant: {
                            type: string;
                            pattern: string;
                            example: string;
                            description: string;
                          };
                          code_commune_insee_apprenant: {
                            type: string;
                            pattern: string;
                            description: string;
                          };
                          siret_etablissement: {
                            type: string;
                            pattern: string;
                            description: string;
                            example: string;
                          };
                          libelle_court_formation: {
                            type: string;
                            description: string;
                            example: string;
                          };
                          libelle_long_formation: {
                            type: string;
                            description: string;
                            example: string;
                          };
                          periode_formation: {
                            type: string;
                            description: string;
                            example: string;
                          };
                          annee_formation: {
                            type: string;
                            description: string;
                            enum: Array<string>;
                            example: string;
                          };
                          formation_rncp: {
                            type: string;
                            pattern: string;
                            description: string;
                            examples: Array<string>;
                          };
                          contrat_date_debut: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                          };
                          contrat_date_fin: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                          };
                          contrat_date_rupture: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                          };
                          validation_errors: {
                            type: string;
                            items: {
                              type: string;
                              properties: {
                                msg: {
                                  type: string;
                                  description: string;
                                  example: string;
                                };
                                path: {
                                  type: string;
                                  description: string;
                                  example: string;
                                };
                              };
                              required: Array<string>;
                            };
                            description: string;
                          };
                        };
                        required: Array<string>;
                      };
                    };
                  };
                  required: Array<string>;
                };
              };
            };
          };
          "400": {
            description: string;
          };
          "500": {
            description: string;
          };
        };
      };
    };
    "/v3/dossiers-apprenants": {
      post: {
        summary: string;
        description: string;
        security: Array<{
          apiKeyAuth: Array<any>;
        }>;
        tags: Array<string>;
        requestBody: {
          required: boolean;
          content: {
            "application/json": {
              schema: {
                type: string;
                items: {
                  type: string;
                  properties: {
                    apprenant: {
                      type: string;
                      properties: {
                        nom: {
                          type: string;
                          minLength: number;
                          description: string;
                          example: string;
                        };
                        prenom: {
                          type: string;
                          minLength: number;
                          description: string;
                          example: string;
                        };
                        date_de_naissance: {
                          type: string;
                          format: string;
                          description: string;
                          example: string;
                        };
                        statut: {
                          type: string;
                          description: string;
                          enum: Array<number>;
                        };
                        date_metier_mise_a_jour_statut: {
                          type: string;
                          format: string;
                          description: string;
                        };
                        id_erp: {
                          type: string;
                          description: string;
                        };
                        ine: {
                          type: string;
                          description: string;
                        };
                        email: {
                          type: string;
                          format: string;
                          description: string;
                          example: string;
                        };
                        telephone: {
                          type: string;
                          pattern: string;
                          example: string;
                          description: string;
                        };
                        code_commune_insee: {
                          type: string;
                          pattern: string;
                          description: string;
                        };
                        sexe: {
                          type: string;
                          description: string;
                          enum: Array<string>;
                          example: string;
                        };
                        rqth: {
                          type: string;
                          description: string;
                          example: boolean;
                        };
                        date_rqth: {
                          type: string;
                          format: string;
                          description: string;
                          example: string;
                        };
                      };
                      required: Array<string>;
                    };
                    etablissement_responsable: {
                      type: string;
                      properties: {
                        siret: {
                          type: string;
                          pattern: string;
                          description: string;
                          example: string;
                        };
                        uai: {
                          type: string;
                          pattern: string;
                          description: string;
                          example: string;
                        };
                        nom: {
                          type: string;
                          description: string;
                        };
                      };
                    };
                    etablissement_formateur: {
                      type: string;
                      properties: {
                        siret: {
                          type: string;
                          pattern: string;
                          description: string;
                          example: string;
                        };
                        uai: {
                          type: string;
                          pattern: string;
                          description: string;
                          example: string;
                        };
                        nom: {
                          type: string;
                          description: string;
                        };
                        code_commune_insee: {
                          type: string;
                          pattern: string;
                          description: string;
                        };
                      };
                    };
                    formation: {
                      type: string;
                      properties: {
                        libelle_court: {
                          type: string;
                          description: string;
                          example: string;
                        };
                        libelle_long: {
                          type: string;
                          description: string;
                          example: string;
                        };
                        periode: {
                          type: string;
                          description: string;
                          example: string;
                        };
                        annee_scolaire: {
                          type: string;
                          description: string;
                          examples: Array<string>;
                        };
                        annee: {
                          type: string;
                          description: string;
                          enum: Array<string>;
                          example: string;
                        };
                        code_rncp: {
                          type: string;
                          pattern: string;
                          description: string;
                          examples: Array<string>;
                        };
                        code_cfd: {
                          type: string;
                          pattern: string;
                          description: string;
                        };
                        date_inscription: {
                          type: string;
                          format: string;
                          description: string;
                        };
                        date_entree: {
                          type: string;
                          format: string;
                          description: string;
                          example: string;
                        };
                        date_fin: {
                          type: string;
                          format: string;
                          description: string;
                          example: string;
                        };
                        obtention_diplome: {
                          type: string;
                          description: string;
                          example: boolean;
                        };
                        date_obtention_diplome: {
                          type: string;
                          format: string;
                          description: string;
                          example: string;
                        };
                        date_exclusion: {
                          type: string;
                          format: string;
                          description: string;
                          example: string;
                        };
                        cause_exclusion: {
                          type: string;
                          description: string;
                          examples: Array<string>;
                        };
                        referent_handicap: {
                          type: string;
                          properties: {
                            nom: {
                              type: string;
                              description: string;
                            };
                            prenom: {
                              type: string;
                              description: string;
                            };
                            email: {
                              type: string;
                              format: string;
                              description: string;
                            };
                          };
                        };
                      };
                      required: Array<string>;
                      description: string;
                    };
                    contrat: {
                      type: string;
                      properties: {
                        date_debut: {
                          type: string;
                          format: string;
                          description: string;
                          example: string;
                        };
                        date_fin: {
                          type: string;
                          format: string;
                          description: string;
                          example: string;
                        };
                        date_rupture: {
                          type: string;
                          format: string;
                          description: string;
                          example: string;
                        };
                        cause_rupture: {
                          type: string;
                          description: string;
                          examples: Array<string>;
                        };
                      };
                      description: string;
                    };
                    employeur: {
                      type: string;
                      properties: {
                        siret: {
                          type: string;
                          pattern: string;
                          description: string;
                        };
                        code_commune_insee: {
                          type: string;
                          pattern: string;
                          description: string;
                        };
                        code_naf: {
                          type: string;
                          minLength: number;
                          maxLength: number;
                          description: string;
                          example: string;
                        };
                      };
                      description: string;
                    };
                  };
                  required: Array<string>;
                };
              };
            };
          };
        };
        responses: {
          "200": {
            description: string;
            content: {
              "application/json": {
                schema: {
                  type: string;
                  properties: {
                    message: {
                      type: string;
                      description: string;
                      enum: Array<string>;
                    };
                    data: {
                      type: string;
                      items: {
                        type: string;
                        properties: {
                          nom_apprenant: {
                            type: string;
                            minLength: number;
                            description: string;
                            example: string;
                          };
                          prenom_apprenant: {
                            type: string;
                            minLength: number;
                            description: string;
                            example: string;
                          };
                          date_de_naissance_apprenant: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                          };
                          uai_etablissement: {
                            type: string;
                            pattern: string;
                            description: string;
                            example: string;
                          };
                          nom_etablissement: {
                            type: string;
                            description: string;
                          };
                          id_formation: {
                            type: string;
                            pattern: string;
                            description: string;
                          };
                          annee_scolaire: {
                            type: string;
                            description: string;
                            examples: Array<string>;
                          };
                          statut_apprenant: {
                            type: string;
                            description: string;
                            enum: Array<number>;
                          };
                          date_metier_mise_a_jour_statut: {
                            type: string;
                            format: string;
                            description: string;
                          };
                          id_erp_apprenant: {
                            type: string;
                            description: string;
                          };
                          source: {
                            type: string;
                            minLength: number;
                          };
                          ine_apprenant: {
                            type: string;
                            description: string;
                          };
                          email_contact: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                          };
                          tel_apprenant: {
                            type: string;
                            pattern: string;
                            example: string;
                            description: string;
                          };
                          code_commune_insee_apprenant: {
                            type: string;
                            pattern: string;
                            description: string;
                          };
                          siret_etablissement: {
                            type: string;
                            pattern: string;
                            description: string;
                            example: string;
                          };
                          libelle_court_formation: {
                            type: string;
                            description: string;
                            example: string;
                          };
                          libelle_long_formation: {
                            type: string;
                            description: string;
                            example: string;
                          };
                          periode_formation: {
                            type: string;
                            description: string;
                            example: string;
                          };
                          annee_formation: {
                            type: string;
                            description: string;
                            enum: Array<string>;
                            example: string;
                          };
                          formation_rncp: {
                            type: string;
                            pattern: string;
                            description: string;
                            examples: Array<string>;
                          };
                          contrat_date_debut: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                          };
                          contrat_date_fin: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                          };
                          contrat_date_rupture: {
                            type: string;
                            format: string;
                            description: string;
                            example: string;
                          };
                          validation_errors: {
                            type: string;
                            items: {
                              type: string;
                              properties: {
                                msg: {
                                  type: string;
                                  description: string;
                                  example: string;
                                };
                                path: {
                                  type: string;
                                  description: string;
                                  example: string;
                                };
                              };
                              required: Array<string>;
                            };
                            description: string;
                          };
                        };
                        required: Array<string>;
                      };
                    };
                  };
                  required: Array<string>;
                };
              };
            };
          };
          "500": {
            description: string;
          };
        };
      };
    };
  };
};
