export interface PaperAnalysis {
  shortSummary: string;
  detailedSummary: string;
  abstract: string;
  introduction: string;
  methodology: string;
  results: string;
  conclusion: string;
  keywords: string[];
  entities: { name: string; type: string }[];
  topicDistribution: { topic: string; percentage: number }[];
}
