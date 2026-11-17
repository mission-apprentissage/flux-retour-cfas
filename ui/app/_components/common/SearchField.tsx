"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { useCallback, useId, useRef, useState, type MutableRefObject, type RefCallback } from "react";

interface SearchFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Si fourni, le bouton « Rechercher » déclenche la recherche ; sinon la recherche se fait en direct. */
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  maxLength?: number;
  autoComplete?: string;
  inputRef?: RefCallback<HTMLInputElement> | MutableRefObject<HTMLInputElement | null>;
}

export function SearchField({
  label,
  value,
  onChange,
  onSearch,
  placeholder,
  className,
  inputClassName,
  maxLength,
  autoComplete,
  inputRef,
}: SearchFieldProps) {
  const id = useId();
  const inputId = `search-${id}-input`;
  const localRef = useRef<HTMLInputElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const setRefs = useCallback(
    (element: HTMLInputElement | null) => {
      localRef.current = element;
      if (typeof inputRef === "function") {
        inputRef(element);
      } else if (inputRef) {
        inputRef.current = element;
      }
    },
    [inputRef]
  );

  const handleSearch = () => {
    if (value === "") {
      localRef.current?.focus();
      return;
    }
    onSearch?.(value);
  };

  const showButton = onSearch !== undefined || (!isFocused && value === "");

  return (
    <div className={[fr.cx("fr-search-bar"), className].filter(Boolean).join(" ")} role="search">
      <label className={fr.cx("fr-label")} htmlFor={inputId}>
        {label}
      </label>
      <input
        ref={setRefs}
        id={inputId}
        className={[fr.cx("fr-input"), inputClassName].filter(Boolean).join(" ")}
        type="search"
        placeholder={placeholder ?? label}
        value={value}
        maxLength={maxLength}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {showButton && (
        <button
          type="button"
          className={fr.cx("fr-btn")}
          title="Rechercher"
          onClick={handleSearch}
          style={onSearch === undefined ? { position: "absolute", right: 0 } : undefined}
        >
          Rechercher
        </button>
      )}
    </div>
  );
}
