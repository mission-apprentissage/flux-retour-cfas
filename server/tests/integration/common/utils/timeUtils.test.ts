import { strict as assert } from "assert";

import { sleep } from "@/common/utils/asyncUtils";
import { getCurrentTime, resetTime, setTime } from "@/common/utils/timeUtils";

describe("utils/timeUtils", () => {
  beforeEach(() => {
    resetTime();
  });
  describe("#getCurrentTime()", () => {
    // it("should return the current time by default", async () => {
    //   assert.deepEqual(getCurrentTime().getTime(), new Date().getTime()); // jest toBeCloseTo(..., 1)
    //   await sleep(10);
    //   assert.deepEqual(getCurrentTime().getTime(), new Date().getTime());
    // });
    it("should return the fixed time when the time is fixed", async () => {
      const oldDate = new Date("2019-11-26");
      setTime(oldDate);
      assert.deepEqual(getCurrentTime(), oldDate);
      await sleep(10);
      assert.deepEqual(getCurrentTime(), oldDate);
    });
  });
});
