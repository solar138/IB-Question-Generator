import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  PageBreak, 
  HeadingLevel,
  AlignmentType
} from "docx";
import { saveAs } from "file-saver";
import { SYLLABUS } from "./syllabus";

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
      text: "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯",
      color: "000000",
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
            text: `[${q.subtopicId}] ${q.question}`,
            font: "Arial",
            size: 24 // 12pt
          })
        ],
        spacing: { before: 400, after: 140 },
        keepNext: true // Keeps the question text on the same page as option A
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
            new TextRun({
              text: q.options[letter],
              font: "Arial",
              size: 24 // 12pt
            })
          ],
          indent: { left: 430 }, // 0.3 inches indentation
          spacing: { after: 140 },
          keepNext: letter !== "D" // Keeps A with B, B with C, and C with D (guarantees no question cuts)
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
        keepNext: true // Keeps the answer header on the same page as the explanation text
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
          new TextRun({
            text: q.explanation,
            font: "Arial",
            size: 20
          })
        ],
        spacing: { after: 80 }
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
