import { describe, it, expect } from "vitest";
import {
  ProfileEntrySchema,
  OpenStackConfigSchema,
  validateConfig,
  validateProfileEntry,
} from "../validation";
import {
  validProfile,
  validConfig,
  configWithMultipleProfiles,
  emptyProfilesConfig,
  invalidProfileEmptyName,
  invalidProfileBadDate,
  invalidProfileMissingFields,
  incompleteConfig,
  configWithInvalidProfile,
} from "./fixtures";

describe("ProfileEntrySchema", () => {
  describe("GIVEN a valid profile entry", () => {
    it("SHOULD parse successfully", () => {
      const result = ProfileEntrySchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });
  });

  describe("GIVEN a profile with empty name", () => {
    it("SHOULD fail validation", () => {
      const result = ProfileEntrySchema.safeParse(invalidProfileEmptyName);
      expect(result.success).toBe(false);
    });
  });

  describe("GIVEN a profile with invalid datetime", () => {
    it("SHOULD fail validation", () => {
      const result = ProfileEntrySchema.safeParse(invalidProfileBadDate);
      expect(result.success).toBe(false);
    });
  });

  describe("GIVEN a profile missing required fields", () => {
    it("SHOULD fail validation", () => {
      const result = ProfileEntrySchema.safeParse(invalidProfileMissingFields);
      expect(result.success).toBe(false);
    });
  });
});

describe("OpenStackConfigSchema", () => {
  describe("GIVEN a valid config", () => {
    it("SHOULD parse successfully", () => {
      const result = OpenStackConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });
  });

  describe("GIVEN a config with multiple profiles", () => {
    it("SHOULD parse successfully", () => {
      const result = OpenStackConfigSchema.safeParse(configWithMultipleProfiles);
      expect(result.success).toBe(true);
    });
  });

  describe("GIVEN a config with empty profiles array", () => {
    it("SHOULD parse successfully", () => {
      const result = OpenStackConfigSchema.safeParse(emptyProfilesConfig);
      expect(result.success).toBe(true);
    });
  });

  describe("GIVEN a config missing required fields", () => {
    it("SHOULD fail validation", () => {
      const result = OpenStackConfigSchema.safeParse(incompleteConfig);
      expect(result.success).toBe(false);
    });
  });

  describe("GIVEN a config with invalid profile in array", () => {
    it("SHOULD fail validation", () => {
      const result = OpenStackConfigSchema.safeParse(configWithInvalidProfile);
      expect(result.success).toBe(false);
    });
  });
});

describe("validateProfileEntry", () => {
  describe("GIVEN a valid profile entry", () => {
    it("SHOULD return ok with the data", () => {
      const result = validateProfileEntry(validProfile);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe(validProfile.name);
        expect(result.value.source).toBe(validProfile.source);
      }
    });
  });

  describe("GIVEN an invalid profile entry", () => {
    it("SHOULD return err with error message", () => {
      const result = validateProfileEntry(invalidProfileEmptyName);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain("name");
      }
    });
  });
});

describe("validateConfig", () => {
  describe("GIVEN a valid config", () => {
    it("SHOULD return ok with the data", () => {
      const result = validateConfig(validConfig);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.version).toBe(validConfig.version);
        expect(result.value.active_profile).toBe(validConfig.active_profile);
        expect(result.value.profiles).toHaveLength(1);
      }
    });
  });

  describe("GIVEN an invalid config", () => {
    it("SHOULD return err with formatted error message", () => {
      const invalidConfig = {
        version: "0.1.0",
        active_profile: "default",
        profiles: [invalidProfileEmptyName],
      };

      const result = validateConfig(invalidConfig);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.length).toBeGreaterThan(0);
      }
    });
  });

  describe("GIVEN non-object data", () => {
    it("SHOULD return err", () => {
      const result = validateConfig("not an object");
      expect(result.isErr()).toBe(true);
    });
  });

  describe("GIVEN null data", () => {
    it("SHOULD return err", () => {
      const result = validateConfig(null);
      expect(result.isErr()).toBe(true);
    });
  });
});
