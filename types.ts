
export interface Question {
  id: number;
  text: string;
  options: Option[];
}

export interface Option {
  id: string;
  label: string;
  emoji: string;
}

export interface Program {
  code: string;
  name: string;
  description: string;
  subjectCombination: string;
  category: string;
}

export interface Result {
  profileSummary: string;
  recommendedPrograms: RecommendedProgram[];
}

export interface RecommendedProgram {
  name: string;
  description: string;
  whyFits: string;
  subjects: string;
}
