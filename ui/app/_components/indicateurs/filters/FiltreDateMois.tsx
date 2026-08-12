"use client";

import { endOfMonth, isThisMonth } from "date-fns"; // eslint-disable-line import/no-duplicates
import fr from "date-fns/locale/fr"; // eslint-disable-line import/no-duplicates
import DatePicker, { registerLocale } from "react-datepicker";

import { formatDate } from "@/common/utils/dateUtils";

import styles from "../indicateurs.module.scss";

registerLocale("fr", fr);

export function FiltreDateMois({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  return (
    <div className={styles.datePickerWrapper}>
      <DatePicker
        selected={value}
        onChange={(selectedDate) => {
          // Le mois sélectionné vaut son dernier jour, sauf pour le mois courant (pas de date future).
          const lastDayOfSelectedMonth = endOfMonth(selectedDate as Date);
          onChange(isThisMonth(lastDayOfSelectedMonth) ? new Date() : lastDayOfSelectedMonth);
        }}
        showMonthYearPicker
        showFullMonthYearPicker
        showFourColumnMonthYearPicker
        locale="fr"
        maxDate={new Date()}
        customInput={
          <button type="button" className={styles.dateButton}>
            <span>{formatDate(value, "dd MMMM yyyy")}</span>
            <i className="fr-icon-edit-line fr-icon--sm" aria-hidden="true" />
          </button>
        }
      />
    </div>
  );
}
