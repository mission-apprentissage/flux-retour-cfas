export const findDefinition = ({ name, schema }) => {
  const formattedName = name.replace(/\[.\]/, "[]");
  const fieldSchema = schema.fields[formattedName];
  if (fieldSchema) return { ...fieldSchema };
};
