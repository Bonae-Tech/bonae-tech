export const valuePropIcons = ['accessible', 'simple', 'secure', 'close'] as const;
export const serviceSummaryIcons = ['web', 'social', 'crm', 'consulting'] as const;

export type ValuePropIcon = (typeof valuePropIcons)[number];
export type ServiceSummaryIcon = (typeof serviceSummaryIcons)[number];
