import { describe, it, expect } from "vitest";
import { formatProfileList, type Profile } from "./fixtures";

describe("Config listing display", () => {
  describe("GIVEN profiles list", () => {
    it("SHOULD format profile names correctly", () => {
      const profiles: Profile[] = [
        { name: "default", source: "local" },
        { name: "work", source: "git" },
        { name: "personal", source: "local" },
      ];
      const activeProfile = "work";

      const formatted = formatProfileList(profiles, activeProfile);

      expect(formatted[0]).toBe("    default      (local)");
      expect(formatted[1]).toBe("  * work         (git)");
      expect(formatted[2]).toBe("    personal     (local)");
    });
  });
});
