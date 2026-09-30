import { and, desc, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { conversations } from "../db/schema.js";

export type ConversationRow = typeof conversations.$inferSelect;

export type ConversationView = {
  id: string;
  title: string;
  symptomText: string;
  intakeMode: string;
  status: string;
  isIncomplete: boolean;
  categoryIds: string[];
  possibleCauses: string[];
  urgency: string;
  isEmergency: boolean;
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
};

const NEEDED_CAUSE_KEYS = 2;

export function toConversationView(row: ConversationRow): ConversationView {
  const notes = (row.notes ?? []) as string[];
  const isIncomplete =
    row.status === "active" && notes.length === 0 && (row.possibleCauses as string[]).length < NEEDED_CAUSE_KEYS;
  return {
    id: row.id,
    title: row.title,
    symptomText: row.symptomText,
    intakeMode: row.intakeMode,
    status: row.status,
    isIncomplete,
    categoryIds: row.categoryIds as string[],
    possibleCauses: row.possibleCauses as string[],
    urgency: row.urgency,
    isEmergency: row.isEmergency,
    notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export function ownedConversation(id: string, patientId: string): SQL | undefined {
  return and(eq(conversations.id, id), eq(conversations.patientId, patientId));
}

export function newestFirst() {
  return desc(conversations.updatedAt);
}
