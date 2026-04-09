import { describe, it, expect } from "vitest";
import {
  ProfileEntrySchema,
  OpenStackConfigSchema,
  validateConfig,
  validateProfileEntry,
} from "../validation";

describe("ProfileEntrySchema", () => {
  describe("GIVEN a valid profile entry", () => {
    it("SHOULD parse successfully", () => {
      const validProfile = {
        name: "my-profile",
        source: "https://github.com/user/repo",
        installed_at: "2025-01-09T10:00:00Z",
      };

      const result = ProfileEntrySchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });
  });

  describe("GIVEN a profile with empty name", () => {
    it("SHOULD fail validation", () => {
      const invalidProfile = {
        name: "",
        source: "local",
        installed_at: "2025-01-09T10:00:00Z",
      };

      const result = ProfileEntrySchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });
  });

  describe("GIVEN a profile with invalid datetime", () => {
    it("SHOULD fail validation", () => {
      const invalidProfile = {
        name: "test",
        source: "local",
        installed_at: "not-a-datetime",
      };

      const result = ProfileEntrySchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });
  });

  describe("GIVEN a profile missing required fields", () => {
    it("SHOULD fail validation", () => {
      const incompleteProfile = {
        name: "test",
      };

      const result = ProfileEntrySchema.safeParse(incompleteProfile);
      expect(result.success).toBe(false);
    });
  });
});

describe("OpenStackConfigSchema", () => {
  describe("GIVEN a valid config", () => {
    it("SHOULD parse successfully", () => {
      const validConfig = {
        version: "0.1.0",
        active_profile: "default",
        profiles: [
          {
            name: "default",
            source: "local",
            installed_at: "2025-01-09T10:00:00Z",
          },
        ],
      };

      const result = OpenStackConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });
  });

  describe("GIVEN a config with multiple profiles", () => {
    it("SHOULD parse successfully", () => {
      const configWithMultipleProfiles = {
        version: "0.1.0",
        active_profile: "work",
        profiles: [
          {
            name: "default",
            source: "local",
            installed_at: "2025-01-09T10:00:00Z",
          },
          {
            name: "work",
            source: "https://github.com/user/repo",
            installed_at: "2025-01-09T11:00:00Z",
          },
        ],
      };

      const result = OpenStackConfigSchema.safeParse(configWithMultipleProfiles);
      expect(result.success).toBe(true);
    });
  });

  describe("GIVEN a config with empty profiles array", () => {
    it("SHOULD parse successfully", () => {
      const configWithNoProfiles = {
        version: "0.1.0",
        active_profile: "default",
        profiles: [],
      };

      const result = OpenStackConfigSchema.safeParse(configWithNoProfiles);
      expect(result.success).toBe(true);
    });
  });

  describe("GIVEN a config missing required fields", () => {
    it("SHOULD fail validation", () => {
      const incompleteConfig = {
        version: "0.1.0",
      };

      const result = OpenStackConfigSchema.safeParse(incompleteConfig);
      expect(result.success).toBe(false);
    });
  });

  describe("GIVEN a config with invalid profile in array", () => {
    it("SHOULD fail validation", () => {
      const configWithInvalidProfile = {
        version: "0.1.0",
        active_profile: "default",
        profiles: [
          {
            name: "",
            source: "local",
            installed_at: "not-a-datetime",
          },
        ],
      };

      const result = OpenStackConfigSchema.safeParse(configWithInvalidProfile);
      expect(result.success).toBe(false);
    });
  });
});

describe("validateProfileEntry", () => {
  describe("GIVEN a valid profile entry", () => {
    it("SHOULD return ok with the data", () => {
      const validProfile = {
        name: "my-profile",
        source: "https://github.com/user/repo",
        installed_at: "2025-01-09T10:00:00Z",
      };

      const result = validateProfileEntry(validProfile);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.name).toBe("my-profile");
        expect(result.value.source).toBe("https://github.com/user/repo");
      }
    });
  });

  describe("GIVEN an invalid profile entry", () => {
    it("SHOULD return err with error message", () => {
      const invalidProfile = {
        name: "",
        source: "local",
        installed_at: "invalid",
      };

      const result = validateProfileEntry(invalidProfile);
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
      const validConfig = {
        version: "0.1.0",
        active_profile: "default",
        profiles: [
          {
            name: "default",
            source: "local",
            installed_at: "2025-01-09T10:00:00Z",
          },
        ],
      };

      const result = validateConfig(validConfig);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.version).toBe("0.1.0");
        expect(result.value.active_profile).toBe("default");
        expect(result.value.profiles).toHaveLength(1);
      }
    });
  });

  describe("GIVEN an invalid config", () => {
    it("SHOULD return err with formatted error message", () => {
      const invalidConfig = {
        version: "0.1.0",
        active_profile: "default",
        profiles: [
          {
            name: "",
            source: "local",
            installed_at: "2025-01-09T10:00:00Z",
          },
        ],
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
