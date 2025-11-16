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
  apiKey: z.string(),
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

interface ProvidersSettingField extends BaseSettingField<'providers', AIProviderConfig[]> {
  type: 'providers';
  zodSchema: z.ZodArray<typeof AIProviderConfigSchema>;
  dbTransform: {
    serialize: (value: AIProviderConfig[]) => string;
    deserialize: (value: string | null) => AIProviderConfig[] | undefined;
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
      serialize: (value: AIProviderConfig[]) => JSON.stringify(value),
      deserialize: (value: string | null) => {
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
      serialize: (value: string) => value,
      deserialize: (value: string | null) => {
        if (value === null || value === '') return '[]';
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? value : '[]';
        } catch {
          return '[]';
        }
      }
    }
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
  aiProviders: z.array(AIProviderConfigSchema),
  customSystemPrompt: z.string().optional(),
  providerWeights: z.string()
});

export const UpdateSettingsRequestSchema = z.object({
  musicAssistantUrl: z.string().optional(),
  aiProviders: z.array(AIProviderConfigSchema).optional(),
  customSystemPrompt: z.string().optional(),
  providerWeights: z.string().optional()
});

// Extended response type (no extra computed fields needed)
export type GetSettingsResponse = AppSettings;

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

  // Get field type
  getFieldType: (key: SettingKey): SettingFieldType => SETTINGS_FIELDS[key].type,

  // Check if field is optional
  isOptional: (key: SettingKey): boolean => SETTINGS_FIELDS[key].optional ?? false,

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
  },

  // Convert form value (string) to API value using field type
  formValueToApiValue: <K extends SettingKey>(
    key: K,
    formValue: string
  ): InferFieldValue<SettingsFieldsConfig[K]> | undefined => {
    const field = SETTINGS_FIELDS[key];

    if (formValue.length === 0 && field.optional) {
      return undefined;
    }

    if (field.type === 'providers') {
      try {
        return JSON.parse(formValue) as InferFieldValue<SettingsFieldsConfig[K]>;
      } catch {
        return [] as InferFieldValue<SettingsFieldsConfig[K]>;
      }
    }

    // string - return as is
    return formValue as InferFieldValue<SettingsFieldsConfig[K]>;
  },

  // Convert API value to form value (string)
  apiValueToFormValue: <K extends SettingKey>(
    key: K,
    apiValue: InferFieldValue<SettingsFieldsConfig[K]> | undefined
  ): string => {
    const field = SETTINGS_FIELDS[key];

    if (apiValue === undefined) {
      if ('defaultValue' in field && field.defaultValue !== undefined) {
        if (field.type === 'providers') {
          return JSON.stringify(field.defaultValue);
        }
        return String(field.defaultValue);
      }
      return '';
    }

    if (field.type === 'providers') {
      return JSON.stringify(apiValue);
    }

    return String(apiValue);
  },

  // Get all settings from database
  getSettings: (db: { getSetting: (key: string) => string | null }): {
    musicAssistantUrl: string;
    aiProviders: AIProviderConfig[];
    customSystemPrompt?: string;
    providerWeights: string;
    defaultProvider: AIProviderConfig;
    providers: AIProviderConfig[];
    musicAssistantUrl: string;
    providerPreference: string[];
  } => {
    const settings: Record<string, unknown> = {};

    // Iterate through all setting fields defined in schema
    for (const key of settingsUtils.getAllKeys()) {
      const dbValue = db.getSetting(key);
      const deserializedValue = settingsUtils.deserializeFromDB(key, dbValue);
      settings[key] = deserializedValue ?? settingsUtils.getDefaultValue(key);
    }

    const aiProviders = (settings.aiProviders as AIProviderConfig[] | undefined) ?? [];
    const defaultProvider = aiProviders[0] ?? {
      id: 'default',
      name: 'Default',
      type: 'anthropic' as const,
      apiKey: '',
      model: 'claude-3-5-sonnet-20241022'
    };

    const providerWeights = (settings.providerWeights as string | undefined) ?? '';
    const providerPreference = providerWeights
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return {
      musicAssistantUrl: (settings.musicAssistantUrl as string | undefined) ?? '',
      aiProviders,
      customSystemPrompt: settings.customSystemPrompt as string | undefined,
      providerWeights,
      defaultProvider,
      providers: aiProviders,
      providerPreference
    };
  }
};
