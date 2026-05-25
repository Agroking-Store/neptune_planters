// ─────────────────────────────────────────────
// Shared constants — UOM predefined values
// Used in both Product model enum and Zod validator
// ─────────────────────────────────────────────
export const UOM_VALUES = ['pcs', 'box', 'kg', 'ltr', 'set', 'mtr', 'sqft'] as const;
export type UOM = (typeof UOM_VALUES)[number];

export const PRODUCT_STATUS_VALUES = ['Active', 'Inactive'] as const;
export type ProductStatus = (typeof PRODUCT_STATUS_VALUES)[number];

export const IMAGE_TYPE_VALUES = ['product', 'reference', 'texture'] as const;
export type ImageType = (typeof IMAGE_TYPE_VALUES)[number];
