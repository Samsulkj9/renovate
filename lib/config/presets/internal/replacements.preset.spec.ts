import { presets } from './replacements.preset.ts';

describe('config/presets/internal/replacements.preset', () => {
  const presetNames = Object.keys(presets).filter((name) => name !== 'all');

  it.each(presetNames)(
    'replacements:all extends replacements:%s',
    (name: string) => {
      expect(presets.all.extends).toContain(`replacements:${name}`);
    },
  );
});
