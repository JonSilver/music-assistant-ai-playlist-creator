/**
 * Utility functions for working with settings
 * Extracted from settings-schema.ts to keep files under 200 lines
 */

import type { AIProviderConfig, SettingFieldType, SettingKey } from './settings-schema.js';
import { SETTINGS_FIELDS } from './settings-schema.js';

type SettingsFieldsConfig = typeof SETTINGS_FIELDS;

type SettingField = SettingsFieldsConfig[SettingKey];

type InferFieldValue<F extends SettingField> =
  F extends { optional: true }
    ? F extends { defaultValue: infer D }
      ? D | undefined
      : F extends { type: 'providers' }
        ? AIProviderConfig[] | undefined
        : string | undefined
    : F extends { type: 'providers' }
      ? AIProviderConfig[]
      : string;

/** @public */
export const settingsUtils = {
  getAllKeys: (): SettingKey[] => Object.keys(SETTINGS_FIELDS) as SettingKey[],

  getField: <K extends SettingKey>(key: K): SettingsFieldsConfig[K] => SETTINGS_FIELDS[key],

  getFieldType: (key: SettingKey): SettingFieldType => SETTINGS_FIELDS[key].type,

  isOptional: (key: SettingKey): boolean => SETTINGS_FIELDS[key].optional ?? false,

  serialiseForDB: <K extends SettingKey>(
    key: K,
    value: InferFieldValue<SettingsFieldsConfig[K]>
  ): string => {
    const field = SETTINGS_FIELDS[key];
    if ('dbTransform' in field && field.dbTransform !== undefined) {
      return field.dbTransform.serialise(value as never);
    }
    return String(value);
  },

  deserialiseFromDB: <K extends SettingKey>(
    key: K,
    value: string | null
  ): InferFieldValue<SettingsFieldsConfig[K]> | undefined => {
    const field = SETTINGS_FIELDS[key];
    if (value === null) {
      return ('defaultValue' in field ? field.defaultValue : undefined) as InferFieldValue<SettingsFieldsConfig[K]> | undefined;
    }
    if ('dbTransform' in field && field.dbTransform !== undefined) {
      return field.dbTransform.deserialise(value) as InferFieldValue<SettingsFieldsConfig[K]> | undefined;
    }
    return value as InferFieldValue<SettingsFieldsConfig[K]>;
  },

  getDefaultValue: <K extends SettingKey>(
    key: K
  ): InferFieldValue<SettingsFieldsConfig[K]> | undefined => {
    const field = SETTINGS_FIELDS[key];
    return ('defaultValue' in field ? field.defaultValue : undefined) as InferFieldValue<SettingsFieldsConfig[K]> | undefined;
  },

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
    return formValue as InferFieldValue<SettingsFieldsConfig[K]>;
  },

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

  getSettings: (db: { getSetting: (key: string) => string | null }): {
    musicAssistantUrl: string;
    musicAssistantToken?: string;
    aiProviders: AIProviderConfig[];
    customSystemPrompt?: string;
    providerWeights: string;
    defaultProviderId?: string;
    defaultProvider: AIProviderConfig;
    providers: AIProviderConfig[];
    providerPreference: string[];
  } => {
    const settings: Record<string, unknown> = {};
    for (const key of settingsUtils.getAllKeys()) {
      const dbValue = db.getSetting(key);
      const deserialisedValue = settingsUtils.deserialiseFromDB(key, dbValue);
      settings[key] = deserialisedValue ?? settingsUtils.getDefaultValue(key);
    }

    const aiProviders = (settings.aiProviders as AIProviderConfig[] | undefined) ?? [];
    const defaultProviderId = settings.defaultProviderId as string | undefined;

    let defaultProvider: AIProviderConfig;
    if (defaultProviderId !== undefined) {
      const foundProvider = aiProviders.find(p => p.id === defaultProviderId);
      defaultProvider = foundProvider ?? aiProviders[0] ?? {
        id: 'default',
        name: 'Default',
        type: 'anthropic' as const,
        apiKey: '',
        model: 'claude-3-5-sonnet-20241022'
      };
    } else {
      defaultProvider = aiProviders[0] ?? {
        id: 'default',
        name: 'Default',
        type: 'anthropic' as const,
        apiKey: '',
        model: 'claude-3-5-sonnet-20241022'
      };
    }

    const providerWeights = (settings.providerWeights as string | undefined) ?? '';
    const providerPreference = providerWeights
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    return {
      musicAssistantUrl: (settings.musicAssistantUrl as string | undefined) ?? '',
      musicAssistantToken: settings.musicAssistantToken as string | undefined,
      aiProviders,
      customSystemPrompt: settings.customSystemPrompt as string | undefined,
      providerWeights,
      defaultProviderId,
      defaultProvider,
      providers: aiProviders,
      providerPreference
    };
  }
};
