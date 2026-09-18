export const resolveModelName = (
  defaultModel: string | undefined,
  overrideModel?: string,
  fallbackModel = "fallback-model",
): string => {
  if (overrideModel && overrideModel.trim()) {
    return overrideModel;
  }

  if (defaultModel && defaultModel.trim()) {
    return defaultModel;
  }

  return fallbackModel;
};
