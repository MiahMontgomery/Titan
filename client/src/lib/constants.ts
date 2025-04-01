export interface PersonaTemplate {
  name: string;
  displayName: string;
  description: string;
  behavior: {
    tone: string;
    style: string;
    vocabulary: string;
    instructions: string;
  };
  imageUrl?: string;
}

export const PERSONA_TEMPLATES: Record<string, PersonaTemplate> = {
  // Templates will be populated dynamically from the database or API
};