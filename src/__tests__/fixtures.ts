// Common test data fixtures for validation tests

export const validProfile = {
  name: "my-profile",
  source: "https://github.com/user/repo",
  installed_at: "2025-01-09T10:00:00Z",
};

export const validProfileLocal = {
  name: "default",
  source: "local",
  installed_at: "2025-01-09T10:00:00Z",
};

export const validConfig = {
  version: "0.1.0",
  active_profile: "default",
  profiles: [validProfileLocal],
};

export const configWithMultipleProfiles = {
  version: "0.1.0",
  active_profile: "work",
  profiles: [
    validProfileLocal,
    {
      name: "work",
      source: "https://github.com/user/repo",
      installed_at: "2025-01-09T11:00:00Z",
    },
  ],
};

export const emptyProfilesConfig = {
  version: "0.1.0",
  active_profile: "default",
  profiles: [],
};

// Invalid fixtures
export const invalidProfileEmptyName = {
  name: "",
  source: "local",
  installed_at: "2025-01-09T10:00:00Z",
};

export const invalidProfileBadDate = {
  name: "test",
  source: "local",
  installed_at: "not-a-datetime",
};

export const invalidProfileMissingFields = {
  name: "test",
};

export const incompleteConfig = {
  version: "0.1.0",
};

export const configWithInvalidProfile = {
  version: "0.1.0",
  active_profile: "default",
  profiles: [invalidProfileEmptyName],
};
