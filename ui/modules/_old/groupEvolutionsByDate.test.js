import { groupEvolutionsByDate } from "../../pages/journal-des-evolutions/groupEvolutionsByDate";

it("renvoie un tableau d'éléments avec date et évolutions groupés par date", () => {
  const input = [
    {
      title: "Déploiement en Guadeloupe et à Mayotte",
      date: "2022/04/18",
    },
    {
      title: "Déploiement en Corse",
      date: "2022/04/18",
    },
    {
      title: "Modification API et de la documentation",
      date: "2022/04/18",
    },
    {
      title: "Déploiement auprès des directeurs de CFA de la FNADIR",
      date: "2022/04/15",
    },
    {
      title: "Mise en ligne de la page statistiques",
      date: "2022/03/21",
    },
  ];
  const output = groupEvolutionsByDate(input);
  expect(output.length).toEqual(3);
  expect(output).toEqual([
    {
      date: "2022/04/18",
      evolutions: [
        {
          title: "Déploiement en Guadeloupe et à Mayotte",
          date: "2022/04/18",
        },
        {
          title: "Déploiement en Corse",
          date: "2022/04/18",
        },
        {
          title: "Modification API et de la documentation",
          date: "2022/04/18",
        },
      ],
    },
    {
      date: "2022/04/15",
      evolutions: [{ title: "Déploiement auprès des directeurs de CFA de la FNADIR", date: "2022/04/15" }],
    },
    {
      date: "2022/03/21",
      evolutions: [
        {
          title: "Mise en ligne de la page statistiques",
          date: "2022/03/21",
        },
      ],
    },
  ]);
});
