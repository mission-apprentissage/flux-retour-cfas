import { stringify } from "safe-stable-stringify";

export const mergeObjectsBy = (objects: any[] = [], key: any) => {
  return Object.values(
    objects.reduce((acc, cur) => {
      // sometimes the key value can be an object (for example if result comes from a mongodb groupBy with _id representing multiple fields)
      const mergeKey = typeof cur[key] === "object" ? stringify(cur[key]) : cur[key];
      const grouped = acc[mergeKey];
      if (grouped) {
        return { ...acc, [mergeKey]: { ...grouped, ...cur } };
      }
      return { ...acc, [mergeKey]: cur };
    }, {})
  );
};
