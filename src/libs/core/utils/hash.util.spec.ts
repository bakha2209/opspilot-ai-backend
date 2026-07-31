import {
  createLegacySha256Hash,
  createSha256Hash,
} from './hash.util';

describe('hash utilities', () => {
  it('produces the same v2 hash regardless of nested key order', () => {
    const first = {
      action: 'INVENTORY_STOCK_OUT',
      afterData: { quantity: 7, reason: 'production' },
    };
    const second = {
      afterData: { reason: 'production', quantity: 7 },
      action: 'INVENTORY_STOCK_OUT',
    };

    expect(createSha256Hash(first)).toBe(createSha256Hash(second));
  });

  it('changes the v2 hash when a nested business value changes', () => {
    const before = {
      action: 'INVENTORY_STOCK_OUT',
      afterData: { quantity: 7 },
    };
    const tampered = {
      action: 'INVENTORY_STOCK_OUT',
      afterData: { quantity: 8 },
    };

    expect(createSha256Hash(before)).not.toBe(createSha256Hash(tampered));
  });

  it('preserves the legacy hash behavior for historical verification', () => {
    const before = {
      action: 'INVENTORY_STOCK_OUT',
      afterData: { quantity: 7 },
    };
    const changedNestedValue = {
      action: 'INVENTORY_STOCK_OUT',
      afterData: { quantity: 8 },
    };

    expect(createLegacySha256Hash(before)).toBe(
      createLegacySha256Hash(changedNestedValue),
    );
  });
});
