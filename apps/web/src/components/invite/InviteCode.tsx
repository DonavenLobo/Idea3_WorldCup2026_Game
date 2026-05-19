export interface InviteCodeProps {
  code: string;
}

export function InviteCode({ code }: InviteCodeProps) {
  return <strong>{code}</strong>;
}
