/**
 * Data-driven settings schema with full type inference
 * All types, validation, and iteration logic derive from this single source of truth
 */

import { z } from 'zod';

// Setting field types
type SettingFieldType = 'string' | 'number' | 'boolean' | 'enum';

// Define available AI providers as const for type inference
export const AI_PROVIDERS = ['claude', 'openai'] as const;
export type AIProvider = typeof AI_PROVIDERS[number];

// Setting field definition with full type safety
interface BaseSettingField<T extends SettingFieldType, V = unknown> {
  key: string;
  type: T;
  optional?: boolean;
  defaultValue?: V;
  zodSchema: z.ZodTypeAny;
  dbTransform?: {
    serialize: (value: V) => string;
    deserialize: (value: string | null) => V | undefined;
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
    serialize: (value: number) => string;
    deserialize: (value: string | null) => number | undefined;
  };
}

interface BooleanSettingField extends BaseSettingField<'boolean', boolean> {
  type: 'boolean';
  zodSchema: z.ZodBoolean | z.ZodOptional<z.ZodBoolean>;
  dbTransform: {
    serialize: (value: boolean) => string;
    deserialize: (value: string | null) => boolean | undefined;
  };
}

interface EnumSettingField<T extends readonly string[]> extends BaseSettingField<'enum', T[number]> {
  type: 'enum';
  values: T;
  zodSchema: z.ZodEnum<any> | z.ZodOptional<z.ZodEnum<any>>;
}

type SettingField =
  | StringSettingField
  | NumberSettingField
  | BooleanSettingField
  | EnumSettingField<readonly string[]>;

// Settings configuration - SINGLE SOURCE OF TRUTH
export const SETTINGS_FIELDS = {
  musicAssistantUrl: {
    key: 'musicAssistantUrl',
    type: 'string',
    optional: false,
    defaultValue: '',
    zodSchema: z.string()
  } satisfies StringSettingField,

  aiProvider: {
    key: 'aiProvider',
    type: 'enum',
    values: AI_PROVIDERS,
    optional: false,
    defaultValue: 'claude' as const,
    zodSchema: z.enum(AI_PROVIDERS)
  } satisfies EnumSettingField<typeof AI_PROVIDERS>,

  anthropicApiKey: {
    key: 'anthropicApiKey',
    type: 'string',
    optional: true,
    zodSchema: z.string().optional()
  } satisfies StringSettingField,

  anthropicModel: {
    key: 'anthropicModel',
    type: 'string',
    optional: true,
    defaultValue: 'claude-sonnet-4-5-20250929',
    zodSchema: z.string().optional()
  } satisfies StringSettingField,

  openaiApiKey: {
    key: 'openaiApiKey',
    type: 'string',
    optional: true,
    zodSchema: z.string().optional()
  } satisfies StringSettingField,

  openaiModel: {
    key: 'openaiModel',
    type: 'string',
    optional: true,
    defaultValue: 'gpt-4-turbo-preview',
    zodSchema: z.string().optional()
  } satisfies StringSettingField,

  openaiBaseUrl: {
    key: 'openaiBaseUrl',
    type: 'string',
    optional: true,
    zodSchema: z.string().optional()
  } satisfies StringSettingField,

  customSystemPrompt: {
    key: 'customSystemPrompt',
    type: 'string',
    optional: true,
    zodSchema: z.string().optional()
  } satisfies StringSettingField,

  temperature: {
    key: 'temperature',
    type: 'number',
    optional: true,
    defaultValue: 1.0,
    zodSchema: z.number().optional(),
    dbTransform: {
      serialize: (value: number) => value.toString(),
      deserialize: (value: string | null) => value !== null ? parseFloat(value) : undefined
    }
  } satisfies NumberSettingField
} as const;

// Type inference from schema
type SettingsFieldsConfig = typeof SETTINGS_FIELDS;
export type SettingKey = keyof SettingsFieldsConfig;

// Infer the actual value type for each field
type InferFieldValue<F extends SettingField> =
  F extends { optional: true }
    ? F extends { defaultValue: infer D }
      ? D | undefined
      : F extends EnumSettingField<infer T>
        ? T[number] | undefined
        : F extends NumberSettingField
          ? number | undefined
          : F extends BooleanSettingField
            ? boolean | undefined
            : string | undefined
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
export const AppSettingsSchema = z.object({
  musicAssistantUrl: z.string(),
  aiProvider: z.enum(AI_PROVIDERS),
  anthropicApiKey: z.string().optional(),
  anthropicModel: z.string().optional(),
  openaiApiKey: z.string().optional(),
  openaiModel: z.string().optional(),
  openaiBaseUrl: z.string().optional(),
  customSystemPrompt: z.string().optional(),
  temperature: z.number().optional()
});

export const UpdateSettingsRequestSchema = z.object({
  musicAssistantUrl: z.string().optional(),
  aiProvider: z.enum(AI_PROVIDERS).optional(),
  anthropicApiKey: z.string().optional(),
  anthropicModel: z.string().optional(),
  openaiApiKey: z.string().optional(),
  openaiModel: z.string().optional(),
  openaiBaseUrl: z.string().optional(),
  customSystemPrompt: z.string().optional(),
  temperature: z.number().optional()
});

// Extended response type (adds computed fields)
export interface GetSettingsResponse extends AppSettings {
  hasAnthropicKey: boolean;
  hasOpenAIKey: boolean;
}

export const GetSettingsResponseSchema = AppSettingsSchema.extend({
  hasAnthropicKey: z.boolean(),
  hasOpenAIKey: z.boolean()
});

// Success response schema
export const SuccessResponseSchema = z.object({
  success: z.boolean()
});
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

// Utility functions for working with settings
export const settingsUtils = {
  // Get all field keys
  getAllKeys: (): SettingKey[] => Object.keys(SETTINGS_FIELDS) as SettingKey[],

  // Get field definition
  getField: <K extends SettingKey>(key: K): SettingsFieldsConfig[K] => SETTINGS_FIELDS[key],

  // Serialize value for database storage
  serializeForDB: <K extends SettingKey>(
    key: K,
    value: InferFieldValue<SettingsFieldsConfig[K]>
  ): string => {
    const field = SETTINGS_FIELDS[key];
    if ('dbTransform' in field && field.dbTransform !== undefined) {
      return field.dbTransform.serialize(value as never);
    }
    return String(value);
  },

  // Deserialize value from database
  deserializeFromDB: <K extends SettingKey>(
    key: K,
    value: string | null
  ): InferFieldValue<SettingsFieldsConfig[K]> | undefined => {
    const field = SETTINGS_FIELDS[key];
    if (value === null) {
      return ('defaultValue' in field ? field.defaultValue : undefined) as InferFieldValue<SettingsFieldsConfig[K]> | undefined;
    }
    if ('dbTransform' in field && field.dbTransform !== undefined) {
      return field.dbTransform.deserialize(value) as InferFieldValue<SettingsFieldsConfig[K]> | undefined;
    }
    return value as InferFieldValue<SettingsFieldsConfig[K]>;
  },

  // Get default value for a field
  getDefaultValue: <K extends SettingKey>(
    key: K
  ): InferFieldValue<SettingsFieldsConfig[K]> | undefined => {
    const field = SETTINGS_FIELDS[key];
    return ('defaultValue' in field ? field.defaultValue : undefined) as InferFieldValue<SettingsFieldsConfig[K]> | undefined;
  }
};
