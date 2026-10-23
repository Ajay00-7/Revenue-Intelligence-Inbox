// src/types.ts

export interface Conversation {
  id: number;
  source_id: string;
  customer?: string | null;
  company?: string | null;
  contact?: string | null;
  owner?: string | null;
  date?: string | null;
  summary?: string | null;
  outcome?: string | null;
  priority?: string | null;
  follow_up_date?: string | null;
  routing?: string | null;
  notes?: string | null;
  manual_override?: boolean;
  deal_value?: number;
  stage?: string;
  sentiment?: string;
}

export interface Metrics {
  total: number;
  pending: number;
  highPriority: number;
  totalPipelineValue: number;
  closedWonValue: number;
  avgDealSize: number;
  priorityBreakdown: Record<string, number>;
  stageBreakdown: Record<string, number>;
  routingBreakdown: Record<string, number>;
}

export interface ImportSummary {
  new: number;
  updated: number;
  unchanged: number;
  duplicates: number;
  errors: string[];
}
