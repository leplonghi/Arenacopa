import { normalizeLanguage } from "./language";

export function formatCurrency(language: string, value: number, currency = "BRL") {
  return new Intl.NumberFormat(normalizeLanguage(language), {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrencyParts(language: string, value: number, currency = "BRL") {
  const parts = new Intl.NumberFormat(normalizeLanguage(language), {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(value);

  const currencySymbol = parts
    .filter((part) => part.type === "currency")
    .map((part) => part.value)
    .join("")
    .trim();

  const integerPart = parts
    .filter((part) => part.type === "integer" || part.type === "group")
    .map((part) => part.value)
    .join("");

  const decimalSeparator = parts.find((part) => part.type === "decimal")?.value ?? ",";
  const fractionPart = parts.find((part) => part.type === "fraction")?.value ?? "00";

  return {
    currencySymbol,
    integerPart,
    decimalSeparator,
    fractionPart,
    formatted: parts.map((part) => part.value).join(""),
  };
}
