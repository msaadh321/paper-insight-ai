import jsPDF from "jspdf";
import type { PaperAnalysis } from "@/types/paper";

export function exportAnalysisPdf(analysis: PaperAnalysis) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const addHeading = (text: string) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += 8;
  };

  const addBody = (text: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 5;
    }
    y += 4;
  };

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ResearchLens Analysis Report", margin, y);
  y += 12;

  // Summary
  addHeading("Short Summary");
  addBody(analysis.shortSummary);

  addHeading("Detailed Summary");
  addBody(analysis.detailedSummary);

  // Sections
  const sections: { key: keyof PaperAnalysis; label: string }[] = [
    { key: "abstract", label: "Abstract" },
    { key: "introduction", label: "Introduction" },
    { key: "methodology", label: "Methodology" },
    { key: "results", label: "Results" },
    { key: "conclusion", label: "Conclusion" },
  ];

  for (const { key, label } of sections) {
    const val = analysis[key];
    if (typeof val === "string" && val) {
      addHeading(label);
      addBody(val);
    }
  }

  // Keywords
  if (analysis.keywords.length) {
    addHeading("Keywords");
    addBody(analysis.keywords.join(", "));
  }

  // Entities
  if (analysis.entities.length) {
    addHeading("Key Entities");
    addBody(analysis.entities.map((e) => `${e.name} (${e.type})`).join(", "));
  }

  // Topic Distribution
  if (analysis.topicDistribution.length) {
    addHeading("Topic Distribution");
    addBody(
      analysis.topicDistribution.map((t) => `${t.topic}: ${t.percentage}%`).join(", ")
    );
  }

  doc.save("ResearchLens_Report.pdf");
}
