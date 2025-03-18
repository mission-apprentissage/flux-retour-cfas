import format from "date-fns/format/index";
import { fr } from "date-fns/locale";

import { MonthItem } from "./types";

export const formatMonthAndYear = (dateString: string): string => {
  const date = new Date(dateString);
  const raw = format(date, "MMMM yyyy", { locale: fr });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

export const sortDataByMonthDescending = (data: MonthItem[]): MonthItem[] => {
  return [...data].sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
};

export const anchorFromLabel = (label: string): string => {
  return label.replace(/\s/g, "-").toLowerCase();
};

export const getTotalEffectifs = (data: MonthItem[]): number => {
  return data.reduce((acc, item) => acc + item.data.length, 0);
};
