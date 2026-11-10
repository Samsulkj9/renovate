import { coerceArray } from '../../../util/array.ts';
import type { PackageRule } from '../../types.ts';
import { presets } from './replacements.preset.ts';

type ReplacementRule = PackageRule & {
  replacementNameTemplate?: string;
  replacementVersionTemplate?: string;
};

interface PresetRule {
  presetName: string;
  rule: ReplacementRule;
}

const globChars = /[*?{}[\]]/;

function isLiteralName(name: string): boolean {
  return (
    !name.startsWith('/') && !name.startsWith('!') && !globChars.test(name)
  );
}

function hasName(rule: ReplacementRule): boolean {
  return !!rule.replacementName || !!rule.replacementNameTemplate;
}

function hasVersion(rule: ReplacementRule): boolean {
  return !!rule.replacementVersion || !!rule.replacementVersionTemplate;
}

/**
 * Groups the rules by each datasource and literal package name they match,
 * which is the key that `packageRules` would be merged on for a dependency.
 */
function groupByPackage(rules: PresetRule[]): Map<string, PresetRule[]> {
  const groups = new Map<string, PresetRule[]>();
  for (const presetRule of rules) {
    for (const datasource of coerceArray(presetRule.rule.matchDatasources)) {
      for (const name of coerceArray(presetRule.rule.matchPackageNames)) {
        if (isLiteralName(name)) {
          const key = `${datasource}:${name}`;
          groups.set(key, [...coerceArray(groups.get(key)), presetRule]);
        }
      }
    }
  }
  return groups;
}

describe('config/presets/internal/replacements.preset', () => {
  const presetNames = Object.keys(presets).filter((name) => name !== 'all');
  const rules: PresetRule[] = presetNames.flatMap((presetName) =>
    coerceArray(presets[presetName].packageRules as ReplacementRule[]).map(
      (rule) => ({
        presetName,
        rule,
      }),
    ),
  );
  const groups = [...groupByPackage(rules)];

  it.each(presetNames)(
    'replacements:all extends replacements:%s',
    (name: string) => {
      expect(presets.all.extends).toContain(`replacements:${name}`);
    },
  );

  it.each(groups)(
    '%s is not given a name by one rule and a version by another',
    (_key, group) => {
      const nameOnly = group.filter(
        ({ rule }) => hasName(rule) && !hasVersion(rule),
      );
      const versionOnly = group.filter(
        ({ rule }) => hasVersion(rule) && !hasName(rule),
      );

      expect(nameOnly.length === 0 || versionOnly.length === 0).toBeTrue();
    },
  );
});
