// MM-DD birthday window check — no year stored (GDPR)
export function isBirthdayWindow(birthday: string, windowDays: number): boolean {
  const parts = birthday.split('-');
  const mm = parseInt(parts[0] ?? '0', 10);
  const dd = parseInt(parts[1] ?? '0', 10);
  if (!mm || !dd) return false;
  const today = new Date();
  const year = today.getFullYear();
  for (const y of [year - 1, year, year + 1]) {
    const bday = new Date(y, mm - 1, dd);
    const diffDays = Math.round((today.getTime() - bday.getTime()) / 86400000);
    if (Math.abs(diffDays) <= windowDays) return true;
  }
  return false;
}

export function formatBirthday(birthday: string): string {
  const MONTHS = [
    'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
    'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
  ];
  const parts = birthday.split('-');
  const mm = parseInt(parts[0] ?? '0', 10);
  const dd = parseInt(parts[1] ?? '0', 10);
  if (!mm || !dd) return '';
  return `${dd} ${MONTHS[mm - 1] ?? ''}`;
}
