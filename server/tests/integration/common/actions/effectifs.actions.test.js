import { strict as assert } from "assert";
import { defaultValuesEffectif } from "../../../../src/common/model/next.toKeep.models/effectifs.model/effectifs.model.js";
import { structureEffectifWithEventualErrors } from "../../../../src/common/actions/effectifs.actions.js";

describe("structureEffectifWithEventualErrors", () => {
  it("returns structuredEffectif with validation_errors empty when no validation errors", () => {
    const simpleData = defaultValuesEffectif({ lockAtCreate: false });
    const structuredEffectif = structureEffectifWithEventualErrors(simpleData);
    assert.deepEqual(structuredEffectif.validation_errors, []);
  });

  it("returns structuredEffectif with validation_errors when one validation error & field replaced", () => {
    const defaultValuesForEffectif = defaultValuesEffectif({ lockAtCreate: false });
    const dataWithError = {
      ...defaultValuesForEffectif,
      source: 5, // Error on field existant in default
    };
    const structuredEffectif = structureEffectifWithEventualErrors(dataWithError);
    assert.deepEqual(structuredEffectif.validation_errors.length, 1);
    assert.deepEqual(structuredEffectif.source, defaultValuesForEffectif.source);
  });

  it("returns structuredEffectif with validation_errors when one validation error & no field replaced", () => {
    const defaultValuesForEffectif = defaultValuesEffectif({ lockAtCreate: false });
    const dataWithError = {
      ...defaultValuesForEffectif,
      archive: 5, // Error on field not required
    };
    const structuredEffectif = structureEffectifWithEventualErrors(dataWithError);
    assert.deepEqual(structuredEffectif.validation_errors.length, 1);
    assert.deepEqual(structuredEffectif.archive, undefined);
  });

  it("returns structuredEffectif with validation_errors when mixed validation error with & without no field replaced", () => {
    const defaultValuesForEffectif = defaultValuesEffectif({ lockAtCreate: false });
    const dataWithError = {
      ...defaultValuesForEffectif,
      source: 5, // Error on field existant in default
      archive: 5, // Error on field not required
    };
    const structuredEffectif = structureEffectifWithEventualErrors(dataWithError);
    assert.deepEqual(structuredEffectif.validation_errors.length, 2);
    assert.deepEqual(structuredEffectif.source, defaultValuesForEffectif.source);
    assert.deepEqual(structuredEffectif.archive, undefined);
  });
});
