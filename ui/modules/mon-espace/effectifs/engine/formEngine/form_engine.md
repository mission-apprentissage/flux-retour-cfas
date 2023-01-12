#Field

## Api field definition

- pattern
- minLength
- maxLength
- min
- max
- enum

## Front field definition

- label
- description
- example
- required
- masks
- fieldType
- options
- requiredMessage
- validateMessage

## Field instance

- locked
- value
- loading
- success
- error
- message

### the `_init` property

If you want to display a label, options or change a props in a logic.
You will want to initiate the props at the first load.
The `_init` props is made for that !

```javascript
_init: ({values, fields}) => ({label: "myLabel", ...})
```

# Logics

### What's that ?

Logics are the rules that defines the form behavior.  
They can trigger an error or trigger other fields modifications.

Rules are played in the order they are defined and only if it has a dependency with the last changed value.

```typescript
type Cascade = {
  value?: string;
  locked?: boolean;
  label?: string;
  required?: boolean;
  options?: {};
  reset?: boolean;
  cascade?: boolean;
};
```
