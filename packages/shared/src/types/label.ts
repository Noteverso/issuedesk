// Label-related types
export interface Label {
  id: string;
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
  new_name?: string;
  name?: string;
  color?: string;
  description?: string;
}
