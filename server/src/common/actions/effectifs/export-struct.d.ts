export type FieldExport = {
  label: string
  csvField: string
  projectedMongoField?: string
  valueGetter: (item: any) => any
};

