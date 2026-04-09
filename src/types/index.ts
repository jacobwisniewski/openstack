export interface Config {
  version: string;
  active_profile: string;
  profiles: ProfileEntry[];
}

export interface ProfileEntry {
  name: string;
  source: string;
  installed_at: string;
}

export interface Profile {
  name: string;
  path: string;
  source: string;
  installed_at: Date;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface CommandResult {
  success: boolean;
  message?: string;
  error?: Error;
}
