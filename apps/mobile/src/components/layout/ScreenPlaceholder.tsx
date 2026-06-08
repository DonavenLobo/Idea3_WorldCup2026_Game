import { Screen } from "./Screen";
import { ScreenHeader } from "./ScreenHeader";

export interface ScreenPlaceholderProps {
  eyebrow?: string;
  title: string;
  body?: string;
}

export function ScreenPlaceholder({ eyebrow = "GoGaffa", title, body }: ScreenPlaceholderProps) {
  return (
    <Screen scroll>
      <ScreenHeader eyebrow={eyebrow} title={title} subtitle={body} />
    </Screen>
  );
}
