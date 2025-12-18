/**
 * Data-driven settings schema with full type inference
 * All types, validation, and iteration logic derive from this single source of truth
 */

import { z } from 'zod';

// Setting field types
export type SettingFieldType = 'string' | 'number' | 'boolean' | 'enum' | 'providers';

// Provider types
export const PROVIDER_TYPES = ['anthropic', 'openai-compatible'] as const;
/** @public */
export type ProviderType = typeof PROVIDER_TYPES[number];

// AI Provider Configuration
export const AIProviderConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(PROVIDER_TYPES),
  apiKey: z.string().optional(),
  model: z.string(),
  baseUrl: z.string().optional(),
  temperature: z.number().min(0).max(2).optional()
});

export type AIProviderConfig = z.infer<typeof AIProviderConfigSchema>;

// Legacy provider enum (deprecated but kept for backwards compatibility)
export const AI_PROVIDERS = ['claude', 'openai'] as const;
/** @public */
export type AIProvider = typeof AI_PROVIDERS[number];

// Setting field definition with full type safety
interface BaseSettingField<T extends SettingFieldType, V = unknown> {
  key: string;
  type: T;
  optional?: boolean;
  defaultValue?: V;
  zodSchema: z.ZodTypeAny;
  dbTransform?: {
    serialise: (value: V) => string;
    deserialise: (value: string | null) => V | undefined;
  };
}

interface StringSettingField extends BaseSettingField<'string', string> {
  type: 'string';
  zodSchema: z.ZodString | z.ZodOptional<z.ZodString>;
}

interface NumberSettingField extends BaseSettingField<'number', number> {
  type: 'number';
  zodSchema: z.ZodNumber | z.ZodOptional<z.ZodNumber>;
  dbTransform: {
    serialise: (value: number) => string;
    deserialise: (value: string | null) => number | undefined;
  };
}

interface BooleanSettingField extends BaseSettingField<'boolean', boolean> {
  type: 'boolean';
  zodSchema: z.ZodBoolean | z.ZodOptional<z.ZodBoolean>;
  dbTransform: {
    serialise: (value: boolean) => string;
    deserialise: (value: string | null) => boolean | undefined;
  };
}

interface EnumSettingField<T extends readonly string[]> extends BaseSettingField<'enum', T[number]> {
  type: 'enum';
  values: T;
  zodSchema: z.ZodEnum<any> | z.ZodOptional<z.ZodEnum<any>>;
}

interface ProvidersSettingField extends BaseSettingField<'providers', AIProviderConfig[]> {
  type: 'providers';
  zodSchema: z.ZodArray<typeof AIProviderConfigSchema>;
  dbTransform: {
    serialise: (value: AIProviderConfig[]) => string;
    deserialise: (value: string | null) => AIProviderConfig[] | undefined;
  };
}

type SettingField =
  | StringSettingField
  | NumberSettingField
  | BooleanSettingField
  | EnumSettingField<readonly string[]>
  | ProvidersSettingField;

// Settings configuration - SINGLE SOURCE OF TRUTH
export const SETTINGS_FIELDS = {
  musicAssistantUrl: {
    key: 'musicAssistantUrl',
    type: 'string',
    optional: false,
    defaultValue: '',
    zodSchema: z.string()
  } satisfies StringSettingField,

  aiProviders: {
    key: 'aiProviders',
    type: 'providers',
    optional: false,
    defaultValue: [],
    zodSchema: z.array(AIProviderConfigSchema),
    dbTransform: {
      serialise: (value: AIProviderConfig[]) => JSON.stringify(value),
      deserialise: (value: string | null) => {
        if (value === null || value === '') return [];
        try {
          return JSON.parse(value) as AIProviderConfig[];
        } catch {
          return [];
        }
      }
    }
  } satisfies ProvidersSettingField,

  customSystemPrompt: {
    key: 'customSystemPrompt',
    type: 'string',
    optional: true,
    zodSchema: z.string().optional()
  } satisfies StringSettingField,

  providerWeights: {
    key: 'providerWeights',
    type: 'string',
    optional: false,
    defaultValue: '[]',
    zodSchema: z.string(),
    dbTransform: {
      serialise: (value: string) => value,
      deserialise: (value: string | null) => {
        if (value === null || value === '') return '[]';
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? value : '[]';
        } catch {
          return '[]';
        }
      }
    }
  } satisfies StringSettingField,

  defaultProviderId: {
    key: 'defaultProviderId',
    type: 'string',
    optional: true,
    zodSchema: z.string().optional()
  } satisfies StringSettingField,

  musicAssistantToken: {
    key: 'musicAssistantToken',
    type: 'string',
    optional: true,
    zodSchema: z.string().optional()
  } satisfies StringSettingField
} as const;

// Type inference from schema
type SettingsFieldsConfig = typeof SETTINGS_FIELDS;
export type SettingKey = keyof SettingsFieldsConfig;

// Infer the actual value type for each field
type InferFieldValue<F extends SettingField> =
  F extends { optional: true }
    ? F extends { defaultValue: infer D }
      ? D | undefined
      : F extends ProvidersSettingField
        ? AIProviderConfig[] | undefined
        : F extends EnumSettingField<infer T>
          ? T[number] | undefined
          : F extends NumberSettingField
            ? number | undefined
            : F extends BooleanSettingField
              ? boolean | undefined
              : string | undefined
    : F extends ProvidersSettingField
      ? AIProviderConfig[]
      : F extends EnumSettingField<infer T>
        ? T[number]
        : F extends NumberSettingField
          ? number
          : F extends BooleanSettingField
            ? boolean
            : string;

// Derive AppSettings type from schema
export type AppSettings = {
  [K in SettingKey]: InferFieldValue<SettingsFieldsConfig[K]>;
};

// Derive UpdateSettingsRequest type (all fields optional for partial updates)
export type UpdateSettingsRequest = {
  [K in SettingKey]?: InferFieldValue<SettingsFieldsConfig[K]>;
};

// Build Zod schemas directly - type inference handles the rest
/** @public */
export const AppSettingsSchema = z.object({
  musicAssistantUrl: z.string(),
  musicAssistantToken: z.string().optional(),
  aiProviders: z.array(AIProviderConfigSchema),
  customSystemPrompt: z.string().optional(),
  providerWeights: z.string(),
  defaultProviderId: z.string().optional()
});

export const UpdateSettingsRequestSchema = z.object({
  musicAssistantUrl: z.string().optional(),
  musicAssistantToken: z.string().optional(),
  aiProviders: z.array(AIProviderConfigSchema).optional(),
  customSystemPrompt: z.string().optional(),
  providerWeights: z.string().optional(),
  defaultProviderId: z.string().optional()
});

// Extended response type (no extra computed fields needed)
export type GetSettingsResponse = AppSettings;

// Success response schema
export const SuccessResponseSchema = z.object({
  success: z.boolean()
});
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

// Re-export settingsUtils from separate file
export { settingsUtils } from './settings-utils.js';
