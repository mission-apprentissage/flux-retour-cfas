import { TypeEffectifNominatif } from "shared";

// récupéré de l'API et adapté pour ne pas avoir certains champs optionnels
export interface Organisme {
  _id: string;
  /**
   * Code UAI de l'établissement
   */
  uai?: string;
  /**
   * N° SIRET fiabilisé
   */
  siret: string;
  /**
   * Réseaux du CFA, s'ils existent
   */
  reseaux?: string[];
  /**
   * ERPs rattachés au CFA, s'ils existent
   */
  erps?: string[];
  /**
   * ERP renseigné par l'utilisateur à la configuration quand il n'est pas supporté
   */
  erp_unsupported?: string;
  /**
   * Compteur sur le nombre d'effectifs de l'organisme
   */
  effectifs_count?: number;
  /**
   * Nature de l'organisme de formation
   */
  nature: "responsable" | "formateur" | "responsable_formateur" | "lieu_formation" | "inconnue";
  /**
   * Nom de l'organisme de formation
   */
  nom?: string;
  /**
   * Enseigne de l'organisme de formation
   */
  enseigne?: string;
  /**
   * Raison sociale de l'organisme de formation
   */
  raison_sociale?: string;
  /**
   * Adresse de l'établissement
   */
  adresse?: {
    /**
     * N° de la voie
     */
    numero?: number;
    /**
     * Indice de répétition du numéro de voie
     */
    repetition_voie?: "B" | "T" | "Q" | "C";
    /**
     * Nom de voie
     */
    voie?: string;
    /**
     * Complément d'adresse
     */
    complement?: string;
    /**
     * Le code postal doit contenir 5 caractères
     */
    code_postal?: string;
    /**
     * Le code insee doit contenir 5 caractères
     */
    code_insee?: string;
    /**
     * Commune
     */
    commune?: string;
    departement?:
      | "01"
      | "02"
      | "03"
      | "04"
      | "05"
      | "06"
      | "07"
      | "08"
      | "09"
      | "10"
      | "11"
      | "12"
      | "13"
      | "14"
      | "15"
      | "16"
      | "17"
      | "18"
      | "19"
      | "21"
      | "22"
      | "23"
      | "24"
      | "25"
      | "26"
      | "27"
      | "28"
      | "29"
      | "2A"
      | "2B"
      | "30"
      | "31"
      | "32"
      | "33"
      | "34"
      | "35"
      | "36"
      | "37"
      | "38"
      | "39"
      | "40"
      | "41"
      | "42"
      | "43"
      | "44"
      | "45"
      | "46"
      | "47"
      | "48"
      | "49"
      | "50"
      | "51"
      | "52"
      | "53"
      | "54"
      | "55"
      | "56"
      | "57"
      | "58"
      | "59"
      | "60"
      | "61"
      | "62"
      | "63"
      | "64"
      | "65"
      | "66"
      | "67"
      | "68"
      | "69"
      | "70"
      | "71"
      | "72"
      | "73"
      | "74"
      | "75"
      | "76"
      | "77"
      | "78"
      | "79"
      | "80"
      | "81"
      | "82"
      | "83"
      | "84"
      | "85"
      | "86"
      | "87"
      | "88"
      | "89"
      | "90"
      | "91"
      | "92"
      | "93"
      | "94"
      | "95"
      | "971"
      | "972"
      | "973"
      | "974"
      | "976"
      | "977"
      | "978"
      | "984"
      | "986"
      | "987"
      | "988"
      | "989";
    region?:
      | "01"
      | "02"
      | "03"
      | "04"
      | "06"
      | "11"
      | "24"
      | "27"
      | "28"
      | "32"
      | "44"
      | "52"
      | "53"
      | "75"
      | "76"
      | "84"
      | "93"
      | "94"
      | "978"
      | "977"
      | "00";
    academie?:
      | "10"
      | "11"
      | "12"
      | "13"
      | "14"
      | "15"
      | "16"
      | "17"
      | "18"
      | "19"
      | "20"
      | "22"
      | "23"
      | "24"
      | "25"
      | "27"
      | "28"
      | "31"
      | "32"
      | "33"
      | "43"
      | "70"
      | "77"
      | "78"
      | "1"
      | "2"
      | "3"
      | "4"
      | "6"
      | "7"
      | "8"
      | "9";
    /**
     * Adresse complète
     */
    complete?: string;
    /**
     * Pays
     */
    pays?:
      | "AF"
      | "ZA"
      | "AL"
      | "DZ"
      | "DE"
      | "AD"
      | "AO"
      | "AG"
      | "SA"
      | "AR"
      | "AM"
      | "AU"
      | "AT"
      | "AZ"
      | "BS"
      | "BH"
      | "BD"
      | "BB"
      | "BE"
      | "BZ"
      | "BJ"
      | "BT"
      | "BY"
      | "MM"
      | "BO"
      | "BQ"
      | "BA"
      | "BW"
      | "BR"
      | "BN"
      | "BG"
      | "BF"
      | "BI"
      | "KH"
      | "CM"
      | "CA"
      | "CV"
      | "CF"
      | "CL"
      | "CN"
      | "CY"
      | "CO"
      | "KM"
      | "CG"
      | "CD"
      | "KR"
      | "KP"
      | "CR"
      | "CI"
      | "HR"
      | "CU"
      | "CW"
      | "DK"
      | "DJ"
      | "DO"
      | "DM"
      | "EG"
      | "SV"
      | "AE"
      | "EC"
      | "ER"
      | "ES"
      | "EE"
      | "SZ"
      | "US"
      | "ET"
      | "MK"
      | "FJ"
      | "FI"
      | "FR"
      | "GA"
      | "GM"
      | "GE"
      | "GH"
      | "GR"
      | "GD"
      | "GT"
      | "GN"
      | "GQ"
      | "GW"
      | "GY"
      | "HT"
      | "HN"
      | "HU"
      | "IN"
      | "ID"
      | "IR"
      | "IQ"
      | "IE"
      | "IS"
      | "IL"
      | "IT"
      | "JM"
      | "JP"
      | "JO"
      | "KZ"
      | "KE"
      | "KG"
      | "KI"
      | "XK"
      | "KW"
      | "LA"
      | "LS"
      | "LV"
      | "LB"
      | "LR"
      | "LY"
      | "LI"
      | "LT"
      | "LU"
      | "MG"
      | "MY"
      | "MW"
      | "MV"
      | "ML"
      | "MT"
      | "MA"
      | "MH"
      | "MU"
      | "MR"
      | "MX"
      | "FM"
      | "MD"
      | "MC"
      | "MN"
      | "ME"
      | "MZ"
      | "NA"
      | "NR"
      | "NP"
      | "NI"
      | "NE"
      | "NG"
      | "NO"
      | "NZ"
      | "OM"
      | "UG"
      | "UZ"
      | "PK"
      | "PW"
      | "PS"
      | "PA"
      | "PG"
      | "PY"
      | "NL"
      | "PE"
      | "PH"
      | "PL"
      | "PT"
      | "QA"
      | "RO"
      | "GB"
      | "RU"
      | "RW"
      | "KN"
      | "SM"
      | "SX"
      | "VC"
      | "LC"
      | "SB"
      | "WS"
      | "ST"
      | "SN"
      | "RS"
      | "SC"
      | "SL"
      | "SG"
      | "SK"
      | "SI"
      | "SO"
      | "SD"
      | "SS"
      | "LK"
      | "SE"
      | "CH"
      | "SR"
      | "SY"
      | "TJ"
      | "TZ"
      | "TD"
      | "CZ"
      | "TH"
      | "TL"
      | "TG"
      | "TO"
      | "TT"
      | "TN"
      | "TM"
      | "TR"
      | "TV"
      | "UA"
      | "UY"
      | "VU"
      | "VA"
      | "VE"
      | "VN"
      | "YE"
      | "ZM"
      | "ZW";
  };
  organismesFormateurs?: {
    siret?: string;
    uai?: string | null;
    referentiel?: boolean;
    label?: string;
    sources?: string[];
    _id?: string | null;
    enseigne?: string;
    raison_sociale?: string;
    commune?: string;
    region?: string;
    departement?: string;
    academie?: string;
    reseaux?: string[];
  }[];
  organismesResponsables?: {
    siret?: string;
    uai?: string | null;
    referentiel?: boolean;
    label?: string;
    sources?: string[];
    _id?: string | null;
    enseigne?: string;
    raison_sociale?: string;
    commune?: string;
    region?: string;
    departement?: string;
    academie?: string;
    reseaux?: string[];
    responsabilitePartielle: boolean;
  }[];
  /**
   * Date de la première transmission de données
   */
  first_transmission_date?: string;
  /**
   * Date de la dernière transmission de données
   */
  last_transmission_date?: string;
  /**
   * Est dans le referentiel onisep des organismes
   */
  est_dans_le_referentiel?: "absent" | "present";
  /**
   * Le siret est fermé
   */
  ferme?: boolean;
  /**
   * a la certification Qualiopi
   */
  qualiopi?: boolean;
  /**
   * API key pour envoi de données
   */
  api_key?: string;
  api_uai?: string;
  api_siret?: string;
  api_configuration_date?: string;
  /**
   * Statut de fiabilisation de l'organisme
   */
  fiabilisation_statut?:
    | "FIABLE"
    | "NON_FIABILISABLE_UAI_NON_VALIDEE"
    | "NON_FIABILISABLE_UAI_VALIDEE"
    | "A_CONTACTER"
    | "INCONNU"
    | "INCONNU_INSCRIPTION"
    | "FIABILISE";
  /**
   * Mode de transmission des effectifs
   */
  mode_de_transmission?: "API" | "MANUEL";
  /**
   * Date à laquelle le mode de transmission a été configuré
   */
  mode_de_transmission_configuration_date?: string;
  /**
   * Auteur de la configuration (prénom nom)
   */
  mode_de_transmission_configuration_author_fullname?: string;
  /**
   * Gestion erreurs transmission
   */
  has_transmission_errors?: boolean;
  transmission_errors_date?: string;
  /**
   * Date de mise à jour en base de données
   */
  updated_at?: string;
  /**
   * Date d'ajout en base de données
   */
  created_at?: string;

  is_transmission_target?: boolean;
  last_effectifs_deca_update?: string;

  formationsCount?: number;
  permissions?: {
    viewContacts: boolean;
    infoTransmissionEffectifs: boolean;
    indicateursEffectifs: boolean; // pourrait peut-être être false | "partial" (restriction réseau/territoire) | "full"
    effectifsNominatifs: boolean | TypeEffectifNominatif[];
    manageEffectifs: boolean;
  };
  missionLocale?: {
    id: string;
    nom: string;
    siret: string;
    localisation?: {
      geopoint?: {
        type: "Point";
        coordinates: [number, number];
      };
      adresse?: string;
      cp?: string;
      ville?: string;
    };
    contact?: {
      email?: string;
      telephone?: string;
      siteWeb?: string;
    };
    contactsTDB?: {
      _id: string;
      email: string;
      nom?: string;
      prenom?: string;
      fonction?: string;
      telephone?: string;
      created_at: string;
    }[];
  };
}
