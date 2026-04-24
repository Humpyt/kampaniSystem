import type { DatabaseExecutor } from '../database';

const TICKET_PADDING = 4;

export function getTicketPrefix(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatTicketNumber(prefix: string, value: number): string {
  return `${prefix}-${String(value).padStart(TICKET_PADDING, '0')}`;
}

function parseTicketValue(ticketNumber: string | null | undefined, prefix: string): number {
  if (!ticketNumber || !ticketNumber.startsWith(`${prefix}-`)) {
    return 0;
  }

  const value = Number.parseInt(ticketNumber.slice(prefix.length + 1), 10);
  return Number.isFinite(value) ? value : 0;
}

async function getCurrentSequenceValue(executor: DatabaseExecutor, prefix: string): Promise<number> {
  const existingSequence = await executor.prepare(
    'SELECT current_value FROM ticket_sequences WHERE prefix = ?'
  ).get(prefix);

  if (existingSequence?.current_value != null) {
    return Number(existingSequence.current_value) || 0;
  }

  const latestOperation = await executor.prepare(`
    SELECT ticket_number
    FROM operations
    WHERE ticket_number LIKE ?
    ORDER BY ticket_number DESC
    LIMIT 1
  `).get(`${prefix}-%`);

  return parseTicketValue(latestOperation?.ticket_number, prefix);
}

export async function previewNextTicketNumber(
  executor: DatabaseExecutor,
  date = new Date()
): Promise<string> {
  const prefix = getTicketPrefix(date);
  const currentValue = await getCurrentSequenceValue(executor, prefix);
  return formatTicketNumber(prefix, currentValue + 1);
}

export async function allocateNextTicketNumber(
  executor: DatabaseExecutor,
  date = new Date()
): Promise<string> {
  const prefix = getTicketPrefix(date);
  const seedValue = await getCurrentSequenceValue(executor, prefix);

  await executor.prepare(`
    INSERT INTO ticket_sequences (prefix, current_value, created_at, updated_at)
    VALUES (?, ?, NOW(), NOW())
    ON CONFLICT (prefix) DO NOTHING
  `).run(prefix, seedValue);

  const sequenceRow = await executor.prepare(`
    UPDATE ticket_sequences
    SET current_value = current_value + 1,
        updated_at = NOW()
    WHERE prefix = ?
    RETURNING current_value
  `).get(prefix);

  return formatTicketNumber(prefix, Number(sequenceRow.current_value));
}
