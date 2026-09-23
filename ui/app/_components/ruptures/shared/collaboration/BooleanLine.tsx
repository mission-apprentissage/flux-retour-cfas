export function BooleanLine({
  label,
  labelFaux,
  value,
  className,
}: {
  label: string;
  /** phrase autonome pour le cas négatif, à la place de « {label} Non » */
  labelFaux?: string;
  value: boolean;
  className: string;
}) {
  if (!value && labelFaux) {
    return (
      <p className={className}>
        {labelFaux} <span aria-hidden="true">{"❌"}</span>
      </p>
    );
  }

  return (
    <p className={className}>
      {label}{" "}
      <strong>
        {value ? (
          <>
            Oui <span aria-hidden="true">{"✅"}</span>
          </>
        ) : (
          <>
            Non <span aria-hidden="true">{"❌"}</span>
          </>
        )}
      </strong>
    </p>
  );
}
