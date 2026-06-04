import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  PageBreak, 
  AlignmentType,
  Math as DocxMath,
  MathRun,
  MathSubScript,
  MathSuperScript
} from "docx";
import fileSaver from "file-saver";
const { saveAs } = fileSaver;
import { SYLLABUS } from "./syllabus.js";
import JSZip from "jszip";

function parseMathToDocxMath(mathText) {
  const children = [];
  let remaining = mathText;

  // Replace common LaTeX functions
  remaining = remaining.replace(/\\text\{([^}]+)\}/g, "$1");
  remaining = remaining.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)");
  remaining = remaining.replace(/\\sqrt\{([^}]+)\}/g, "√($1)");
  remaining = remaining.replaceAll("\\text{sqrt}", "√");
  
  // Replace Greek letters/symbols
  const symbolMap = {
    "\\Delta": "Δ", "\\theta": "θ", "\\lambda": "λ", "\\alpha": "α",
    "\\beta": "β", "\\gamma": "γ", "\\omega": "ω", "\\pi": "π", "\\bigpi": "π",
    "\\rho": "ρ", "\\sigma": "σ", "\\tau": "τ", "\\phi": "φ",
    "\\psi": "ψ", "\\Omega": "Ω", "\\epsilon": "ε", "\\eta": "η",
    "\\nu": "ν", "\\approx": "≈", "\\pm": "±", "\\times": "×",
    "\\cdot": "·", "\\degree": "°", "\\infty": "∞", "\\le": "≤",
    "\\ge": "≥", "\\neq": "≠", "\\to": "→", "\\sqrt": "√"
  };

  Object.entries(symbolMap).forEach(([latex, unicode]) => {
    remaining = remaining.replaceAll(latex, unicode);
  });
  
  remaining = remaining.replaceAll("\\", "");

  const regex = /(_\{([^}]+)\}|_(.)|\^\{([^}]+)\}|\^(.)|[^_^]+)/g;
  let match;
  let lastRun = null;
  
  while ((match = regex.exec(remaining)) !== null) {
    const fullMatch = match[0];
    
    if (fullMatch.startsWith("_")) {
      const text = match[2] || match[3];
      if (lastRun) {
        children.pop();
        lastRun = new MathSubScript({
          children: [lastRun],
          subScript: [new MathRun(text)]
        });
        children.push(lastRun);
      } else {
        lastRun = new MathRun("_" + text);
        children.push(lastRun);
      }
    } else if (fullMatch.startsWith("^")) {
      const text = match[4] || match[5];
      if (lastRun) {
        children.pop();
        lastRun = new MathSuperScript({
          children: [lastRun],
          superScript: [new MathRun(text)]
        });
        children.push(lastRun);
      } else {
        lastRun = new MathRun("^" + text);
        children.push(lastRun);
      }
    } else {
      const str = fullMatch;
      // Strip any remaining XML control characters just in case (except tab, newline, carriage return)
      const cleanStr = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      if (cleanStr.length > 1) {
        const prefix = cleanStr.slice(0, -1);
        const lastChar = cleanStr.slice(-1);
        children.push(new MathRun(prefix));
        lastRun = new MathRun(lastChar);
        children.push(lastRun);
      } else if (cleanStr.length === 1) {
        lastRun = new MathRun(cleanStr);
        children.push(lastRun);
      }
    }
  }

  return new DocxMath({ children });
}

function parseTextWithMath(text, baseSize = 24) {
  if (!text) return [];
  
  // Repair corrupted LaTeX tags from memory before parsing
  let repairedText = text
    .replace(/\x0Crac/g, '\\frac')
    .replace(/\x08eta/g, '\\beta')
    .replace(/\x09ext/g, '\\text')
    .replace(/\x09heta/g, '\\theta')
    .replace(/\x09au/g, '\\tau')
    .replace(/\x0Dho/g, '\\rho')
    .replace(/\x0Dight/g, '\\right')
    .replace(/\x0Aeq/g, '\\neq')
    .replace(/\x0Au/g, '\\nu');

  const parts = repairedText.split("$");
  const runs = [];
  
  parts.forEach((part, index) => {
    // Strip XML control characters
    const cleanPart = part.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    if (index % 2 === 0) {
      if (cleanPart) {
        runs.push(
          new TextRun({
            text: cleanPart,
            font: "Arial",
            size: baseSize
          })
        );
      }
    } else {
      if (cleanPart) {
        runs.push(parseMathToDocxMath(cleanPart));
      }
    }
  });
  
  return runs;
}

export async function exportQuestionBankToDocx(questions) {
  if (!questions || questions.length === 0) {
    alert("Question bank is empty! Add questions before exporting.");
    return;
  }

  const docChildren = [];

  // 1. Exam Title / Header Block (Minimally styled like official papers)
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "IB PHYSICS HL - QUESTION WORKBOARD",
          bold: true,
          color: "000000",
          size: 36, // 18pt
          font: "Arial"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Exam Practice Session | Total Questions: ${questions.length}`,
          color: "000000",
          italic: true,
          size: 20, // 10pt
          font: "Arial"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "----------------------------------------------------------------------",
          color: "000000"
        })
      ],
      spacing: { after: 300 }
    })
  );

  let currentTopicId = null;

  // 2. Add Questions (Formatted exactly like official IB exam papers)
  questions.forEach((q, index) => {
    // If we transition to a new major Topic (A, B, C, D, E), insert a major topic heading
    if (q.topicId !== currentTopicId) {
      currentTopicId = q.topicId;
      const topicInfo = SYLLABUS.find(t => t.id === q.topicId);
      const topicTitle = topicInfo ? topicInfo.title : `Topic ${q.topicId}`;

      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: topicTitle.toUpperCase(),
              bold: true,
              color: "000000",
              size: 26, // 13pt
              font: "Arial"
            })
          ],
          spacing: { before: 360, after: 180 }
        })
      );
    }

    // Question Text (Regular weight text, bold question numbers, bracketed subtopic prefix)
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. `,
            bold: true,
            font: "Arial",
            size: 24 // 12pt
          }),
          new TextRun({
            text: `[${q.subtopicId}] `,
            font: "Arial",
            size: 24 // 12pt
          }),
          ...parseTextWithMath(q.question, 24)
        ],
        spacing: { before: 400, after: 140 },
        keepNext: true, // Keeps the question text on the same page as option A
        keepLines: true // Prevents paragraph from breaking across pages
      })
    );

    // Options (A, B, C, D - each on a new line, bold prefix, slightly indented)
    ["A", "B", "C", "D"].forEach((letter) => {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${letter}.  `,
              bold: true,
              font: "Arial",
              size: 24 // 12pt
            }),
            ...parseTextWithMath(q.options[letter], 24)
          ],
          indent: { left: 430 }, // 0.3 inches indentation
          spacing: { after: 140 },
          keepNext: letter !== "D", // Keeps A with B, B with C, and C with D (guarantees no question cuts)
          keepLines: true // Prevents option from breaking across pages
        })
      );
    });
  });

  // 3. Add Page Break and Teacher Answer Key
  docChildren.push(
    new Paragraph({
      children: [new PageBreak()]
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "ANSWER KEY & EXPLANATIONS",
          bold: true,
          color: "000000",
          size: 28, // 14pt
          font: "Arial"
        })
      ],
      spacing: { before: 200, after: 300 }
    })
  );

  // 4. Populate Answer Key with Correct options and explanations
  questions.forEach((q, index) => {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Question ${index + 1}. [${q.subtopicId}] `,
            bold: true,
            font: "Arial",
            size: 20 // 10pt
          }),
          new TextRun({
            text: `Correct Answer: ${q.answer}`,
            bold: true,
            color: "16A34A", // Emerald Green
            font: "Arial",
            size: 20
          })
        ],
        spacing: { before: 140, after: 40 },
        keepNext: true, // Keeps the answer header on the same page as the explanation text
        keepLines: true // Prevents paragraph from breaking across pages
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Explanation: ",
            bold: true,
            color: "475569",
            font: "Arial",
            size: 20
          }),
          ...parseTextWithMath(q.explanation, 20)
        ],
        spacing: { after: 80 },
        keepLines: true // Prevents paragraph from breaking across pages
      })
    );
  });

  // Construct the final document
  const doc = new Document({
    sections: [
      {
        children: docChildren
      }
    ]
  });

  // Generate blob and trigger browser download
  try {
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `IB_Physics_HL_Exam_Practice_${new Date().toISOString().split('T')[0]}.docx`);
  } catch (err) {
    console.error("Error creating DOCX file:", err);
    alert("Could not generate Word document. Please check console logs.");
  }
}

export async function exportQuestionsToZip(questions) {
  if (!questions || questions.length === 0) return;
  const zip = new JSZip();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const docChildren = [];
    
    // Add question content
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Question ${i + 1} [${q.subtopicId}] `,
            bold: true,
            font: "Arial",
            size: 24
          }),
          ...parseTextWithMath(q.question, 24)
        ],
        spacing: { before: 200, after: 140 }
      })
    );

    ["A", "B", "C", "D"].forEach((letter) => {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${letter}.  `, bold: true, font: "Arial", size: 24 }),
            ...parseTextWithMath(q.options[letter] || "", 24)
          ],
          indent: { left: 430 },
          spacing: { after: 140 }
        })
      );
    });

    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Correct Answer: ", bold: true, font: "Arial", size: 20 }),
          new TextRun({ text: q.answer, bold: true, color: "16A34A", font: "Arial", size: 20 })
        ],
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Explanation: ", bold: true, font: "Arial", size: 20 }),
          ...parseTextWithMath(q.explanation || "", 20)
        ]
      })
    );

    const doc = new Document({ sections: [{ children: docChildren }] });
    
    try {
      const blob = await Packer.toBlob(doc);
      // Fallback name if id is missing
      const fileName = `Question_${i + 1}_${q.subtopicId ? q.subtopicId.replace(/\./g, "_") : 'unknown'}.docx`;
      zip.file(fileName, blob);
    } catch (err) {
      console.error(`Error packing question ${i + 1}`, err);
      // Create an error text file instead to signify it failed
      zip.file(`Question_${i + 1}_ERROR.txt`, `Failed to generate DOCX for this question.\\n\\nError: ${err.message}\\n\\nQuestion Data:\\n${JSON.stringify(q, null, 2)}`);
    }
  }

  try {
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `IB_Physics_Questions_Debug_${new Date().toISOString().split('T')[0]}.zip`);
  } catch (err) {
    console.error("Error creating ZIP file:", err);
    alert("Could not generate ZIP document. Please check console logs.");
  }
}
