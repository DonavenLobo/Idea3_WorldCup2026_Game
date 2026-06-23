import { Card, type CardProps } from "@gogaffa/ui";

/** Canonical list/data card — 16px radius, 16px padding, surface grey. */
export function ContentCard(props: CardProps) {
  return <Card {...props} />;
}

export type { CardProps as ContentCardProps };
