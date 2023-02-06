import createEffectifs from "./effectifs.js";

export default async (options = {}) => {
  const effectifs = options.effectifs || createEffectifs();

  return {
    effectifs,
  };
};
