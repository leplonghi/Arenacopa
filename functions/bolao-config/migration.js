function normalizeLegacyBolao(legacy) {
  return {
    ...legacy,
    legacy_mode: true,
    schema_version: 1,
    editable_sections: {
      presentation: true,
      context: false,
      access_policy: false,
      competition_rules: false,
      finance_rules: false,
      operation: true,
    },
  };
}

module.exports = {
  normalizeLegacyBolao,
};
