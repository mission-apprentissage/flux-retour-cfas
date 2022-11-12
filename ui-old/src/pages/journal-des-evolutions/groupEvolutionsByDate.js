export const groupEvolutionsByDate = (evolutions) => {
  return Object.values(
    evolutions.reduce((acc, cur) => {
      const date = cur.date;
      if (acc[date] === undefined) {
        return {
          ...acc,
          [date]: { date, evolutions: [cur] },
        };
      } else {
        return {
          ...acc,
          [date]: { date, evolutions: [...acc[date].evolutions, cur] },
        };
      }
    }, {})
  );
};
