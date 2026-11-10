import { CATALOGUE_CHAMPS_TELEVERSEMENT } from "shared";
import { afterEach, describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { lireDate, lireFichierEffectifs, reconnaitreColonne, type LigneLue } from "./lectureFichierEffectifs";
import { toEffectifsQueue } from "./televersement";

const EN_TETES_OBLIGATOIRES = [
  "nom_apprenant",
  "prenom_apprenant",
  "date_de_naissance_apprenant",
  "annee_scolaire",
  "date_inscription_formation",
  "date_entree_formation",
  "date_fin_formation",
  "etablissement_responsable_uai",
  "etablissement_responsable_siret",
  "etablissement_formateur_uai",
  "etablissement_formateur_siret",
  "formation_rncp",
  "code_postal_apprenant",
  "email_contact",
  "contrat_date_debut",
];

const ligneComplete = (surcharge: Record<string, unknown> = {}) => {
  const base: Record<string, unknown> = {
    nom_apprenant: "TESTUX",
    prenom_apprenant: "Élodie",
    date_de_naissance_apprenant: "15/03/2006",
    annee_scolaire: "2026-2027",
    date_inscription_formation: "01/09/2026",
    date_entree_formation: "01/09/2026",
    date_fin_formation: "30/06/2028",
    etablissement_responsable_uai: "0600071B",
    etablissement_responsable_siret: "78050719000012",
    etablissement_formateur_uai: "0600071B",
    etablissement_formateur_siret: "78050719000012",
    formation_rncp: "RNCP37681",
    code_postal_apprenant: "60000",
    email_contact: "testux@example.fr",
    contrat_date_debut: "",
  };
  return { ...base, ...surcharge };
};

const classeur = (
  lignes: unknown[][],
  bookType: XLSX.BookType = "xlsx",
  nomFeuille = "Effectifs",
  { date1904 = false, origine = "A1" }: { date1904?: boolean; origine?: string } = {}
) => {
  const wb = XLSX.utils.book_new();
  const feuille = XLSX.utils.aoa_to_sheet([]);
  XLSX.utils.sheet_add_aoa(feuille, lignes, { cellDates: true, UTC: true, origin: origine });
  XLSX.utils.book_append_sheet(wb, feuille, nomFeuille);
  if (date1904) {
    wb.Workbook = { WBProps: { date1904: true } };
  }
  return XLSX.write(wb, { type: "array", bookType }) as ArrayBuffer;
};

const texteEnOctets = (texte: string) => new TextEncoder().encode(texte).buffer as ArrayBuffer;

const versLignes = (objets: Record<string, unknown>[], enTetes = Object.keys(objets[0])) => [
  enTetes,
  ...objets.map((objet) => enTetes.map((enTete) => objet[enTete] ?? null)),
];

const lire = (contenu: ArrayBuffer, nom = "effectifs.xlsx", maximumLignes = 2000) =>
  lireFichierEffectifs(contenu, nom, { maximumLignes });

const lignesLues = (contenu: ArrayBuffer, nom?: string): LigneLue[] => {
  const resultat = lire(contenu, nom);
  if (!resultat.succes) throw new Error(resultat.message);
  return resultat.lignes;
};

function ancienneDate(input: unknown): string | null {
  if (input === undefined || input === null || typeof input === "boolean") return null;
  if (typeof input === "number") {
    const date = new Date(Date.UTC(1899, 11, 30) + input * 24 * 60 * 60 * 1000);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
  }
  const texte = String(input);
  const motifs: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/^(\d{4})-(\d{2})-(\d{2})$/, (m) => `${m[1]}-${m[2]}-${m[3]}`],
    [/^(\d{2})\/(\d{2})\/(\d{4})$/, (m) => `${m[3]}-${m[2]}-${m[1]}`],
    [
      /^(\d{2})\/(\d{2})\/(\d{2})$/,
      (m) => `${Number(m[3]) <= 40 ? 2000 + Number(m[3]) : 1900 + Number(m[3])}-${m[2]}-${m[1]}`,
    ],
  ];
  for (const [regex, format] of motifs) {
    const m = texte.match(regex);
    if (m && !Number.isNaN(new Date(format(m)).getTime())) return format(m);
  }
  return null;
}

function ancienLecteur(contenu: ArrayBuffer) {
  const wb = XLSX.read(new Uint8Array(contenu), { type: "array" });
  const [enTetes, ...lignes] = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  return lignes.map((ligne) =>
    Object.fromEntries(
      (enTetes as string[]).map((enTete, index) => [
        enTete,
        enTete === "date_de_naissance_apprenant" ? ancienneDate(ligne[index]) : ligne[index] || null,
      ])
    )
  );
}

const hash = (valeurs: Record<string, unknown>) => toEffectifsQueue([valeurs])[0].id_erp_apprenant;

describe("lecture du fichier d'effectifs", () => {
  const fuseauInitial = process.env.TZ;
  afterEach(() => {
    process.env.TZ = fuseauInitial;
  });

  describe.each(["Europe/Paris", "America/Martinique"])("identifiant inchangé avec le fuseau %s", (fuseau) => {
    const enTetes = ["nom_apprenant", "prenom_apprenant", "date_de_naissance_apprenant"];

    it.each([
      ["une cellule date", new Date(Date.UTC(2006, 2, 15))],
      ["un nombre Excel", 38791],
      ["un texte jj/mm/aaaa", "15/03/2006"],
    ])("lit %s comme l'ancien lecteur", (_cas, naissance) => {
      process.env.TZ = fuseau;
      const contenu = classeur([enTetes, ["TESTUX", "Élodie", naissance]]);

      const [nouvelle] = lignesLues(contenu);
      const [ancienne] = ancienLecteur(contenu);

      expect(nouvelle.valeurs.date_de_naissance_apprenant).toBe("2006-03-15");
      expect(hash(nouvelle.valeurs)).toBe(hash(ancienne));
    });

    it("lit un CSV comme l'ancien lecteur lisait le même texte dans un classeur", () => {
      process.env.TZ = fuseau;
      const csv = new TextEncoder().encode(`${enTetes.join(";")}\nTESTUX;Élodie;15/03/2006\n`).buffer as ArrayBuffer;

      const [nouvelle] = lignesLues(csv, "effectifs.csv");
      const [ancienne] = ancienLecteur(classeur([enTetes, ["TESTUX", "Élodie", "15/03/2006"]]));

      expect(hash(nouvelle.valeurs)).toBe(hash(ancienne));
    });

    it.each([
      [
        "un tableau HTML",
        `<table><tr>${[...enTetes, "code_postal_apprenant"].map((enTete) => `<td>${enTete}</td>`).join("")}</tr><tr><td>TESTUX</td><td>Élodie</td><td>01/02/2006</td><td>01000</td></tr></table>`,
      ],
      ["un CSV", `${[...enTetes, "code_postal_apprenant"].join(";")}\nTESTUX;Élodie;01/02/2006;01000\n`],
      ["un TSV", `${[...enTetes, "code_postal_apprenant"].join("\t")}\nTESTUX\tÉlodie\t01/02/2006\t01000\n`],
    ])("lit un .xls qui contient %s sans inverser jour et mois", (_cas, texte) => {
      process.env.TZ = fuseau;

      const [nouvelle] = lignesLues(texteEnOctets(texte), "export.xls");
      const [ancienne] = ancienLecteur(classeur([enTetes, ["TESTUX", "Élodie", "01/02/2006"]]));

      expect(nouvelle.valeurs).toEqual({
        nom_apprenant: "TESTUX",
        prenom_apprenant: "Élodie",
        date_de_naissance_apprenant: "2006-02-01",
        code_postal_apprenant: "01000",
      });
      expect(hash(nouvelle.valeurs)).toBe(hash(ancienne));
    });

    it("lit un nombre Excel d'un classeur 1904 comme le même jour d'un classeur 1900", () => {
      process.env.TZ = fuseau;

      const [nouvelle] = lignesLues(
        classeur([enTetes, ["TESTUX", "Élodie", 37329]], "xlsx", "Effectifs", { date1904: true })
      );
      const [ancienne] = ancienLecteur(classeur([enTetes, ["TESTUX", "Élodie", 38791]]));

      expect(nouvelle.valeurs.date_de_naissance_apprenant).toBe("2006-03-15");
      expect(hash(nouvelle.valeurs)).toBe(hash(ancienne));
    });

    it("garde la cellule date d'un classeur 1904", () => {
      process.env.TZ = fuseau;
      const contenu = classeur([enTetes, ["TESTUX", "Élodie", new Date(Date.UTC(2006, 2, 15))]], "xlsx", "Effectifs", {
        date1904: true,
      });

      expect(lignesLues(contenu)[0].valeurs.date_de_naissance_apprenant).toBe("2006-03-15");
    });

    it("lit des en-têtes placés sous un titre, avec les vrais numéros de ligne", () => {
      process.env.TZ = fuseau;
      const contenu = classeur([["Liste des apprenants"], [], enTetes, ["TESTUX", "Élodie", "15/03/2006"]]);

      const [nouvelle] = lignesLues(contenu);
      const [ancienne] = ancienLecteur(classeur([enTetes, ["TESTUX", "Élodie", "15/03/2006"]]));

      expect(nouvelle.numero).toBe(4);
      expect(hash(nouvelle.valeurs)).toBe(hash(ancienne));
    });

    it.each(["15/03/2006 00:00:00", "15/03/2006 08:30", "2006-03-15 18:00:00", "2006-03-15T23:30:00.000Z"])(
      "lit la date avec heure %s au jour écrit",
      (naissance) => {
        process.env.TZ = fuseau;

        const [nouvelle] = lignesLues(classeur([enTetes, ["TESTUX", "Élodie", naissance]]));
        const [ancienne] = ancienLecteur(classeur([enTetes, ["TESTUX", "Élodie", "15/03/2006"]]));

        expect(nouvelle.valeurs.date_de_naissance_apprenant).toBe("2006-03-15");
        expect(hash(nouvelle.valeurs)).toBe(hash(ancienne));
      }
    );
  });

  it("lit les dates qui étaient perdues", () => {
    expect(lireDate("1/9/2026")).toEqual({ date: "2026-09-01" });
    expect(lireDate("30.06.2028")).toEqual({ date: "2028-06-30" });
    expect(lireDate("01-09-2026")).toEqual({ date: "2026-09-01" });
    expect(lireDate(" 01 / 09 / 2026 ")).toEqual({ date: "2026-09-01" });
    expect(lireDate("2026-09-01T00:00:00.000Z")).toEqual({ date: "2026-09-01" });
    expect(lireDate("15/03/06")).toEqual({ date: "2006-03-15" });
    expect(lireDate("15/03/95")).toEqual({ date: "1995-03-15" });
  });

  it("signale une date impossible, illisible ou hors des bornes", () => {
    expect(lireDate("31/02/2006")).toEqual({ code: "date_impossible" });
    expect(lireDate("31/04/2026")).toEqual({ code: "date_impossible" });
    expect(lireDate("01/13/2026")).toEqual({ code: "date_illisible" });
    expect(lireDate("32/01/2026")).toEqual({ code: "date_illisible" });
    expect(lireDate("00/00/0000")).toEqual({ code: "date_illisible" });
    expect(lireDate("le 1er septembre")).toEqual({ code: "date_illisible" });
    expect(lireDate("01/09/1900")).toEqual({ code: "date_illisible" });
    expect(lireDate("15/03/2006 8h00")).toEqual({ code: "date_illisible" });
  });

  it("montre la date telle que saisie dans le message d'erreur", () => {
    const enTetes = ["nom_apprenant", "date_de_naissance_apprenant", "date_entree_formation", "date_fin_formation"];
    const contenu = classeur([enTetes, ["TESTUX", new Date(Date.UTC(1949, 5, 1)), "01/13/2026", "31/02/2026"]]);

    expect(lignesLues(contenu)[0].erreurs).toEqual([
      {
        code: "date_illisible",
        cle: "date_de_naissance_apprenant",
        message: "Date de naissance illisible : 01/06/1949. Écrivez-la sous la forme 01/09/2026.",
      },
      {
        code: "date_illisible",
        cle: "date_entree_formation",
        message: "Date d'entrée en formation illisible : 01/13/2026. Écrivez-la sous la forme 01/09/2026.",
      },
      { code: "date_impossible", cle: "date_fin_formation", message: "Le 31/02/2026 n'existe pas." },
    ]);
  });

  it("reconnaît les noms techniques, les libellés et les alias, pas les en-têtes ambigus", () => {
    expect(reconnaitreColonne("nom_apprenant *")).toBe("nom_apprenant");
    expect(reconnaitreColonne("Date d'entrée en formation")).toBe("date_entree_formation");
    expect(reconnaitreColonne("DATE_DEBUT_CONTRAT")).toBe("contrat_date_debut");
    expect(reconnaitreColonne("CP")).toBe("code_postal_apprenant");
    expect(reconnaitreColonne("UAI")).toBeNull();
    expect(reconnaitreColonne("Année")).toBeNull();
  });

  it("rattache chaque nom technique, libellé et alias du catalogue à son propre champ", () => {
    const mal = CATALOGUE_CHAMPS_TELEVERSEMENT.flatMap(({ cle, libelle, alias }) =>
      [cle, libelle, ...alias].filter((enTete) => reconnaitreColonne(enTete) !== cle)
    );

    expect(mal).toEqual([]);
  });

  it.each([
    ["Date de début de contrat", "contrat_date_debut"],
    ["Date début de contrat", "contrat_date_debut"],
    ["Date de fin de contrat", "contrat_date_fin"],
    ["Date de rupture de contrat", "contrat_date_rupture"],
    ["Date de naissance de l'apprenant", "date_de_naissance_apprenant"],
    ["Date de naissance de l’apprenant", "date_de_naissance_apprenant"],
    ["Email apprenant", "email_contact"],
    ["Téléphone apprenant", "tel_apprenant"],
    ["Date début de formation", "date_entree_formation"],
    ["Date de fin de la formation", "date_fin_formation"],
  ])("reconnaît l'en-tête courant %s", (enTete, cle) => {
    expect(reconnaitreColonne(enTete)).toBe(cle);
  });

  it("ne reconnaît ni un en-tête ambigu ni une clé du prototype", () => {
    expect(["UAI", "SIRET", "Année", "De", "constructor", "__proto__"].map(reconnaitreColonne)).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it("préfère le nom technique au libellé et le libellé à l'alias, sans erreur", () => {
    const contenu = classeur([
      ["Nom de famille", "Nom", "nom_apprenant *", "Prénom de l'apprenant", "Prénom", "Date de naissance"],
      ["ALIAS", "LIBELLE", "TESTUX", "Alias", "Élodie", "15/03/2006"],
    ]);

    const resultat = lire(contenu);

    expect(resultat.succes && resultat.colonnesEnDouble).toEqual([]);
    expect(resultat.succes && resultat.lignes[0].valeurs).toEqual({
      nom_apprenant: "TESTUX",
      prenom_apprenant: "Élodie",
      date_de_naissance_apprenant: "2006-03-15",
    });
  });

  it("signale deux colonnes de même rang pour un même champ", () => {
    const contenu = classeur([
      [
        "Nom de famille",
        "Nom d'usage",
        "Prénom",
        "Prénom",
        "date_de_naissance_apprenant",
        "date_de_naissance_apprenant",
      ],
      ["MARTIN", "DUPONT", "Élodie", "Élodie", "15/03/2006", "15/03/2006"],
    ]);

    const resultat = lire(contenu);

    expect(resultat.succes && resultat.colonnesEnDouble).toEqual(["Nom", "Prénom", "Date de naissance"]);
  });

  it("reconnaît les en-têtes d'un export de logiciel, sauf les ambigus", () => {
    const enTetes = [
      "Nom",
      "Prénom",
      "Date de naissance",
      "Sexe",
      "Email",
      "Adresse",
      "CP",
      "Ville",
      "N° INE",
      "Téléphone",
      "UAI",
      "SIRET",
      "Année scolaire",
      "Année",
      "Code RNCP",
      "Code diplôme",
      "Date d'inscription",
      "Date début formation",
      "Date fin formation",
      "Début contrat",
      "Fin contrat",
      "SIRET employeur",
      "Date rupture",
      "Motif rupture",
      "Commentaire",
    ];

    expect(enTetes.filter((enTete) => !reconnaitreColonne(enTete))).toEqual([
      "Ville",
      "UAI",
      "SIRET",
      "Année",
      "Commentaire",
    ]);
  });

  it("lit un fichier valide, avec ses dates de contrat", () => {
    const contenu = classeur(
      versLignes([
        ligneComplete({ contrat_date_debut: "1/9/2026", contrat_date_fin: "30.06.2028" }),
        ligneComplete({ prenom_apprenant: "Jules" }),
      ])
    );

    const resultat = lire(contenu);

    expect(resultat).toMatchObject({ succes: true, colonnesObligatoiresAbsentes: [] });
    if (!resultat.succes) return;
    expect(resultat.lignes[0].valeurs).toMatchObject({
      contrat_date_debut: "2026-09-01",
      contrat_date_fin: "2028-06-30",
    });
    expect(resultat.lignes[0].erreurs).toEqual([]);
    expect(resultat.lignes[1].valeurs).not.toHaveProperty("contrat_date_debut");
  });

  it("numérote les lignes d'une plage qui ne commence pas en ligne 1", () => {
    const contenu = classeur(
      [
        ["nom_apprenant", "prenom_apprenant", "date_de_naissance_apprenant"],
        ["TESTUX", "Élodie", "15/03/2006"],
        ["TESTUX", "Jules", "31/02/2006"],
      ],
      "xlsx",
      "Effectifs",
      { origine: "A3" }
    );

    expect(lignesLues(contenu).map(({ numero }) => numero)).toEqual([4, 5]);
  });

  it("garde les numéros de ligne du fichier, ignore les lignes vides et lit les lignes sans texte", () => {
    const enTetes = Object.keys(ligneComplete());
    const contenu = classeur([
      enTetes,
      Object.values(ligneComplete()),
      enTetes.map(() => null),
      Object.values(ligneComplete({ sexe_apprenant: "Homme" })),
      Object.values(ligneComplete({ date_de_naissance_apprenant: "31/02/2006" })),
      enTetes.map((enTete) => (enTete === "date_entree_formation" ? new Date(Date.UTC(2026, 8, 1)) : null)),
    ]);

    const lignes = lignesLues(contenu);

    expect(lignes.map(({ numero }) => numero)).toEqual([2, 4, 5, 6]);
    expect(lignes[2].erreurs).toEqual([
      { code: "date_impossible", cle: "date_de_naissance_apprenant", message: "Le 31/02/2006 n'existe pas." },
    ]);
    expect(lignes[3].valeurs).toEqual({ date_entree_formation: "2026-09-01" });
  });

  it.each([
    ["f", "F"],
    ["Femme", "F"],
    ["FÉMININ", "F"],
    ["2", "F"],
    [2, "F"],
    ["m", "M"],
    ["H", "M"],
    ["homme", "M"],
    ["Masculin", "M"],
    ["1", "M"],
    [1, "M"],
    ["X", "X"],
    ["constructor", "constructor"],
  ])("lit le sexe %s en %s", (sexe, attendu) => {
    const [ligne] = lignesLues(
      classeur([
        ["nom_apprenant", "sexe_apprenant"],
        ["TESTUX", sexe],
      ])
    );

    expect(ligne.valeurs.sexe_apprenant).toBe(attendu);
  });

  it.each(["constructor", "__proto__", "toString"])("refuse %s dans une colonne Oui ou Non", (valeur) => {
    const [ligne] = lignesLues(texteEnOctets(`nom_apprenant;rqth_apprenant\nTESTUX;${valeur}\n`), "effectifs.csv");

    expect(ligne.valeurs).toEqual({ nom_apprenant: "TESTUX" });
    expect(ligne.erreurs.map(({ code }) => code)).toEqual(["valeur_mal_formee"]);
    expect(() => structuredClone(ligne)).not.toThrow();
  });

  it("accepte Homme, Femme, Oui, Non, Vrai, Faux et garde le zéro", () => {
    const enTetes = [
      ...Object.keys(ligneComplete()),
      "sexe_apprenant",
      "rqth_apprenant",
      "duree_theorique_formation_mois",
    ];
    const contenu = classeur([
      enTetes,
      [...Object.values(ligneComplete()), "Femme", "Vrai", 0],
      [...Object.values(ligneComplete()), "homme", "non", 24],
      [...Object.values(ligneComplete()), "F", "peut-être", 24],
    ]);

    const lignes = lignesLues(contenu);

    expect(lignes[0].valeurs).toMatchObject({
      sexe_apprenant: "F",
      rqth_apprenant: true,
      duree_theorique_formation_mois: 0,
    });
    expect(lignes[1].valeurs).toMatchObject({ sexe_apprenant: "M", rqth_apprenant: false });
    expect(lignes[2].erreurs.map(({ code, cle }) => ({ code, cle }))).toEqual([
      { code: "valeur_mal_formee", cle: "rqth_apprenant" },
    ]);
  });

  it("signale les colonnes obligatoires absentes, dont la date de début de contrat", () => {
    const sansEntree = Object.keys(ligneComplete()).filter(
      (enTete) => !["date_entree_formation", "contrat_date_debut", "email_contact"].includes(enTete)
    );
    const contenu = classeur(versLignes([ligneComplete()], sansEntree));

    const resultat = lire(contenu);

    expect(resultat.succes && resultat.colonnesObligatoiresAbsentes).toEqual([
      "Email ou téléphone",
      "Date d'entrée en formation",
      "Début du contrat",
    ]);
  });

  it("reconnaît date_debut_contrat comme la colonne de début de contrat", () => {
    const enTetes = Object.keys(ligneComplete()).map((enTete) =>
      enTete === "contrat_date_debut" ? "date_debut_contrat" : enTete
    );
    const contenu = classeur([enTetes, Object.values(ligneComplete({ contrat_date_debut: "01/09/2026" }))]);

    const resultat = lire(contenu);

    expect(resultat.succes && resultat.colonnesObligatoiresAbsentes).toEqual([]);
    expect(resultat.succes && resultat.lignes[0].valeurs.contrat_date_debut).toBe("2026-09-01");
  });

  it("lit un CSV UTF-8 avec ou sans BOM et un CSV windows-1252 de la même façon", () => {
    const texte = `${EN_TETES_OBLIGATOIRES.join(";")}\nTESTUX;Élodie;01/09/2005;2026-2027;01/09/2026;01/09/2026;30/06/2028;0600071B;78050719000012;0600071B;78050719000012;RNCP37681;01000;testux@example.fr;\n`;
    const utf8 = new TextEncoder().encode(texte).buffer as ArrayBuffer;
    const windows1252 = new Uint8Array(
      [...texte].map((caractere) => (caractere === "É" ? 0xc9 : caractere.charCodeAt(0)))
    ).buffer;

    const utf8AvecBom = new Uint8Array([0xef, 0xbb, 0xbf, ...new Uint8Array(utf8)]).buffer;

    for (const contenu of [utf8, utf8AvecBom, windows1252]) {
      const [ligne] = lignesLues(contenu, "effectifs.csv");
      expect(ligne.valeurs).toMatchObject({
        prenom_apprenant: "Élodie",
        code_postal_apprenant: "01000",
        date_de_naissance_apprenant: "2005-09-01",
      });
    }
  });

  it.each(["xls", "ods"] as const)("lit un fichier .%s", (bookType) => {
    const contenu = classeur(
      versLignes([ligneComplete({ date_de_naissance_apprenant: new Date(Date.UTC(2006, 2, 15)) })]),
      bookType
    );

    const [ligne] = lignesLues(contenu, `effectifs.${bookType}`);

    expect(ligne.valeurs).toMatchObject({ nom_apprenant: "TESTUX", date_de_naissance_apprenant: "2006-03-15" });
  });

  it("ignore la feuille Aide et lit la première feuille aux en-têtes reconnus", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Colonne", "Aide"],
        ["Nom", "Nom de famille"],
      ]),
      "Aide"
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(versLignes([ligneComplete()])), "Effectifs");

    const [ligne] = lignesLues(XLSX.write(wb, { type: "array", bookType: "xlsx" }));

    expect(ligne.valeurs.nom_apprenant).toBe("TESTUX");
  });

  it("refuse un fichier vide, trop long ou qui n'est pas un tableur", () => {
    expect(lire(classeur([Object.keys(ligneComplete())]))).toMatchObject({ succes: false, code: "fichier_vide" });
    expect(
      lire(classeur(versLignes([ligneComplete(), ligneComplete(), ligneComplete()])), "effectifs.xlsx", 2)
    ).toMatchObject({
      succes: false,
      code: "trop_de_lignes",
    });
    expect(lire(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]).buffer, "effectifs.xlsx")).toMatchObject({
      succes: false,
      code: "format_refuse",
    });
    expect(lire(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00, 0x01]).buffer, "effectifs.xls")).toMatchObject({
      succes: false,
      code: "format_refuse",
    });
  });
});
