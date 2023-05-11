import { endOfMonth, isThisMonth } from "date-fns"; // eslint-disable-line import/no-duplicates
// besoin de date-fns 3 pour import esm, voir https://github.com/date-fns/date-fns/issues/2629
import fr from "date-fns/locale/fr"; // eslint-disable-line import/no-duplicates
import React, { useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";

import { formatDate } from "@/common/utils/dateUtils";
import SecondarySelectButton from "@/components/SelectButton/SecondarySelectButton";

registerLocale("fr", fr);

interface Props {
  value: Date;
  onChange: (selectedDate: any) => void;
}
function DateFilter({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <DatePicker
        selected={value}
        onChange={(selectedDate) => {
          // by default, once a month is selected we use its last day
          const lastDayOfSelectedMonth = endOfMonth(selectedDate);
          // if user has selected current month, we choose to use the current date instead of the last day in the month to avoid using dates in the future
          const date = isThisMonth(lastDayOfSelectedMonth) ? new Date() : lastDayOfSelectedMonth;
          onChange(date);
        }}
        showMonthYearPicker
        showFullMonthYearPicker
        showFourColumnMonthYearPicker
        locale="fr"
        onCalendarClose={() => setIsOpen(false)}
        onCalendarOpen={() => setIsOpen(true)}
        customInput={
          <SecondarySelectButton onClick={() => setIsOpen(!isOpen)} isActive={isOpen}>
            {formatDate(value, "dd MMMM yyyy")}
          </SecondarySelectButton>
        }
      />
    </div>
  );
}

export default DateFilter;
