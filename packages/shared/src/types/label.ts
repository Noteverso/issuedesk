// Label-related types
export interface Label {
  id: string; // UUID v4
  name: string;
  color: string; // Hex color without #
  description: string | null;
  issueCount: number;
}

export interface CreateLabelInput {
  name: string;
  color: string;
  description?: string;
}

export interface UpdateLabelInput {
  name?: string;
  color?: string;
  description?: string;
}
