async function run() {
  const now = new Date();
  const res = await fetch(`https://cfas.apprentissage.beta.gouv.fr/api/v1/indicateurs/national?date=${now.toJSON()}`);
  const data = await res.json();

  const intl = new Intl.NumberFormat("fr-FR");

  const effectifs = data.indicateursEffectifs.reduce(
    (acc, item) => {
      acc.apprentis += item.apprentis;
      acc.inscritsSansContrat += item.inscritsSansContrat;
      acc.abandons += item.abandons;
      acc.rupturants += item.rupturants;
      acc.apprenants += item.apprenants;

      return acc;
    },
    {
      apprentis: 0,
      inscritsSansContrat: 0,
      abandons: 0,
      rupturants: 0,
      apprenants: 0,
    }
  );
  const organismes = data.indicateursOrganismes.reduce(
    (acc, item) => {
      acc.organismesTransmetteurs_responsables += item.organismesTransmetteurs.responsables;
      acc.organismesTransmetteurs_responsablesFormateurs += item.organismesTransmetteurs.responsablesFormateurs;
      acc.organismesTransmetteurs_formateurs += item.organismesTransmetteurs.formateurs;
      acc.organismesTransmetteurs_inconnues += item.organismesTransmetteurs.inconnues;

      acc.totalOrganismes_responsables += item.totalOrganismes.responsables;
      acc.totalOrganismes_responsablesFormateurs += item.totalOrganismes.responsablesFormateurs;
      acc.totalOrganismes_formateurs += item.totalOrganismes.formateurs;
      acc.totalOrganismes_inconnues += item.totalOrganismes.inconnues;

      return acc;
    },
    {
      organismesTransmetteurs_responsables: 0,
      organismesTransmetteurs_responsablesFormateurs: 0,
      organismesTransmetteurs_formateurs: 0,
      organismesTransmetteurs_inconnues: 0,
      totalOrganismes_responsables: 0,
      totalOrganismes_responsablesFormateurs: 0,
      totalOrganismes_formateurs: 0,
      totalOrganismes_inconnues: 0,
    }
  );

  const slackMessage = {
    text: "Chiffres clés du Tableau de Bord",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Chiffres clés du Tableau de Bord",
        },
      },
      {
        type: "divider",
      },
      {
        type: "rich_text",
        elements: [
          {
            type: "rich_text_section",
            elements: [
              {
                type: "text",
                text: "Effectifs",
                style: {
                  bold: true,
                },
              },
            ],
          },
          {
            type: "rich_text_list",
            style: "bullet",
            elements: Object.keys(effectifs).map((key) => ({
              type: "rich_text_section",
              elements: [
                {
                  type: "text",
                  text: `${key}: `,
                },
                {
                  type: "text",
                  text: intl.format(effectifs[key]),
                },
              ],
            })),
          },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "rich_text",
        elements: [
          {
            type: "rich_text_section",
            elements: [
              {
                type: "text",
                text: "Organismes",
                style: {
                  bold: true,
                },
              },
            ],
          },
          {
            type: "rich_text_list",
            style: "bullet",
            elements: Object.keys(organismes).map((key) => ({
              type: "rich_text_section",
              elements: [
                {
                  type: "text",
                  text: `${key}: `,
                },
                {
                  type: "text",
                  text: intl.format(organismes[key]),
                },
              ],
            })),
          },
        ],
      },
    ],
  };

  await fetch(process.env.SLACK_WEBHOOK, {
    method: "POST",
    body: JSON.stringify(slackMessage),
  });
}

await run();
