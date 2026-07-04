export const valuePropIcons = ['accessible', 'simple', 'secure', 'close', 'education'] as const;

export type ValuePropIcon = (typeof valuePropIcons)[number];
