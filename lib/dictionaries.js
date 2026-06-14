const dictionaries = {
  ro: () => import('@/dictionaries/ro').then((module) => module.default),
  ru: () => import('@/dictionaries/ru').then((module) => module.default),
};

export const getDictionary = async (locale) => dictionaries[locale]();
