export const valuePropIcons = ['accessible', 'simple', 'secure', 'close'] as const;

export type ValuePropIcon = (typeof valuePropIcons)[number];
