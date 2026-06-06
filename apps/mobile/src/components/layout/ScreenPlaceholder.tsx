import { Screen } from "./Screen";
import { ScreenHeader } from "./ScreenHeader";

export interface ScreenPlaceholderProps {
  title: string;
  body?: string;
}

export function ScreenPlaceholder({ title, body }: ScreenPlaceholderProps) {
  return (
    <Screen scroll>
      <ScreenHeader eyebrow="GoGaffa" title={title} subtitle={body} />
    </Screen>
  );
}
