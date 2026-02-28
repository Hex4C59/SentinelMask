import type { RuleHit, RuleType } from "../../shared/types";
import { isValidLuhn } from "./luhn";

const phoneRegex = /(?:\+?86[-\s]?)?1[3-9]\d{9}/g;
const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const bankCardCandidateRegex = /(?:\d[ -]?){13,19}/g;
const openAiApiKeyRegex = /\bsk-(?:proj-|live-)?[A-Za-z0-9_-]{16,}\b/g;
const awsAccessKeyRegex = /\bAKIA[0-9A-Z]{16}\b/g;
const githubTokenRegex = /\bgh[pousr]_[A-Za-z0-9]{30,255}\b/g;
const cnNameRegex = /(?:我叫|姓名[:：]?)\s*([\u4e00-\u9fa5]{2,4})/g;
const enNameRegex = /\b(?:my name is|name[:：]?)\s*([A-Z][a-z]{1,20}(?:\s[A-Z][a-z]{1,20}){0,2})\b/gi;

const defaultRuleInfo: Record<
  Exclude<RuleType, "custom">,
  Pick<RuleHit, "riskLevel" | "defaultMaskMode" | "source">
> = {
  name: { riskLevel: "low", defaultMaskMode: "warn", source: "builtin" },
  phone: { riskLevel: "medium", defaultMaskMode: "partial", source: "builtin" },
  bank_card: { riskLevel: "high", defaultMaskMode: "full", source: "builtin" },
  email: { riskLevel: "medium", defaultMaskMode: "partial", source: "builtin" },
  api_key: { riskLevel: "high", defaultMaskMode: "full", source: "builtin" }
};

function hasNumericBoundary(text: string, start: number, end: number): boolean {
  const before = start > 0 ? text[start - 1] : "";
  const after = end < text.length ? text[end] : "";
  return !/\d/.test(before) && !/\d/.test(after);
}

function makeHit(ruleType: Exclude<RuleType, "custom">, match: string, index: number): RuleHit {
  const info = defaultRuleInfo[ruleType];
  return {
    ruleType,
    source: info.source,
    riskLevel: info.riskLevel,
    defaultMaskMode: info.defaultMaskMode,
    match,
    index,
    length: match.length
  };
}

function pushRegexMatches(
  text: string,
  regex: RegExp,
  ruleType: Exclude<RuleType, "custom">,
  output: RuleHit[],
  options: { enforceNumericBoundary?: boolean } = {}
): void {
  regex.lastIndex = 0;
  let matched: RegExpExecArray | null = regex.exec(text);

  while (matched) {
    const value = matched[0];
    const index = matched.index;
    const end = index + value.length;
    const isBoundaryValid =
      !options.enforceNumericBoundary || hasNumericBoundary(text, index, end);

    if (isBoundaryValid) {
      output.push(makeHit(ruleType, value, index));
    }

    matched = regex.exec(text);
  }
}

function pushNamedMatches(text: string, output: RuleHit[]): void {
  cnNameRegex.lastIndex = 0;
  let matchedCn = cnNameRegex.exec(text);
  while (matchedCn) {
    const name = matchedCn[1];
    const full = matchedCn[0];
    const index = matchedCn.index + full.indexOf(name);
    output.push(makeHit("name", name, index));
    matchedCn = cnNameRegex.exec(text);
  }

  enNameRegex.lastIndex = 0;
  let matchedEn = enNameRegex.exec(text);
  while (matchedEn) {
    const name = matchedEn[1];
    const full = matchedEn[0];
    const index = matchedEn.index + full.toLowerCase().indexOf(name.toLowerCase());
    output.push(makeHit("name", name, index));
    matchedEn = enNameRegex.exec(text);
  }
}

function pushBankCardMatches(text: string, output: RuleHit[]): void {
  bankCardCandidateRegex.lastIndex = 0;
  let matched = bankCardCandidateRegex.exec(text);

  while (matched) {
    const raw = matched[0];
    const normalized = raw.replace(/[^\d]/g, "");
    const index = matched.index;
    const end = index + raw.length;

    if (hasNumericBoundary(text, index, end) && isValidLuhn(normalized)) {
      output.push(makeHit("bank_card", raw, index));
    }

    matched = bankCardCandidateRegex.exec(text);
  }
}

export function detectBuiltinHits(
  text: string,
  enabledTypes: Partial<Record<Exclude<RuleType, "custom">, boolean>>
): RuleHit[] {
  const hits: RuleHit[] = [];

  if (enabledTypes.phone !== false) {
    pushRegexMatches(text, phoneRegex, "phone", hits, { enforceNumericBoundary: true });
  }
  if (enabledTypes.email !== false) {
    pushRegexMatches(text, emailRegex, "email", hits);
  }
  if (enabledTypes.bank_card !== false) {
    pushBankCardMatches(text, hits);
  }
  if (enabledTypes.api_key !== false) {
    pushRegexMatches(text, openAiApiKeyRegex, "api_key", hits);
    pushRegexMatches(text, awsAccessKeyRegex, "api_key", hits);
    pushRegexMatches(text, githubTokenRegex, "api_key", hits);
  }
  if (enabledTypes.name !== false) {
    pushNamedMatches(text, hits);
  }

  return hits.sort((a, b) => a.index - b.index || b.length - a.length);
}
