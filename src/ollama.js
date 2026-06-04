// Ollama API integration and high-quality Mock Question Generator

// A library of high-quality, syllabus-specific mock questions to make the app work flawlessly in Mock Mode.
const MOCK_QUESTIONS_DB = {
  "A.1": {
    "remembering": [
      {
        question: "Which of the following is a fundamental SI unit?",
        options: {
          A: "Newton (N)",
          B: "Joule (J)",
          C: "Ampere (A)",
          D: "Watt (W)"
        },
        answer: "C",
        explanation: "The Ampere (A) is one of the seven base SI units. Newton, Joule, and Watt are derived units."
      },
      {
        question: "What is the distinction between a vector and a scalar quantity?",
        options: {
          A: "Vectors have magnitude only, scalars have direction only.",
          B: "Vectors have both magnitude and direction, scalars have magnitude only.",
          C: "Scalars have both magnitude and direction, vectors have magnitude only.",
          D: "Both quantities possess direction, but only vectors have units."
        },
        answer: "B",
        explanation: "A vector quantity has both magnitude and direction (e.g., displacement, velocity), whereas a scalar has magnitude only (e.g., distance, speed)."
      },
      {
        question: "Which of the following represents a systematic error?",
        options: {
          A: "Slight variations in stopwatch readings by an observer.",
          B: "A voltmeter showing 0.2 V when not connected to any circuit.",
          C: "Fluctuations in the ambient room temperature during an experiment.",
          D: "Misreading the scale of a thermometer randomly."
        },
        answer: "B",
        explanation: "A zero error (like a voltmeter showing a reading when unconnected) is a classic systematic error, shifting all readings by a constant amount."
      },
      {
        question: "What is the standard unit of acceleration in the SI system?",
        options: {
          A: "m/s",
          B: "m^2/s",
          C: "m/s^2",
          D: "kg m/s"
        },
        answer: "C",
        explanation: "Acceleration is defined as the rate of change of velocity, which gives units of (m/s) / s = m/s^2."
      },
      {
        question: "Which of the following is a scalar quantity?",
        options: {
          A: "Displacement",
          B: "Velocity",
          C: "Acceleration",
          D: "Speed"
        },
        answer: "D",
        explanation: "Speed is the scalar rate of motion, while displacement, velocity, and acceleration are all vector quantities."
      }
    ],
    "understanding": [
      {
        question: "A ball is thrown horizontally from the top of a cliff. Neglecting air resistance, what happens to the horizontal component of its velocity as it falls?",
        options: {
          A: "It increases linearly with time.",
          B: "It remains constant throughout the flight.",
          C: "It decreases due to gravity.",
          D: "It becomes zero when the ball reaches terminal speed."
        },
        answer: "B",
        explanation: "Since there is no force acting in the horizontal direction (neglecting air resistance), the horizontal acceleration is zero, and horizontal velocity remains constant."
      },
      {
        question: "A car accelerates from rest at a constant rate. In the first second, it travels a distance d. What distance does it travel in the second second?",
        options: {
          A: "d",
          B: "2d",
          C: "3d",
          D: "4d"
        },
        answer: "C",
        explanation: "Using s = 1/2 a t^2. At t=1, s1 = 1/2 a (1)^2 = d. At t=2, total distance s2 = 1/2 a (2)^2 = 4d. The distance traveled *in the second second* is s2 - s1 = 4d - d = 3d."
      },
      {
        question: "On a displacement-time graph, what does a horizontal straight line indicate about the state of motion of an object?",
        options: {
          A: "The object is moving with a constant positive velocity.",
          B: "The object is stationary.",
          C: "The object is undergoing uniform acceleration.",
          D: "The object is moving with a constant negative velocity."
        },
        answer: "B",
        explanation: "The slope of a displacement-time graph represents velocity. A horizontal line has a slope of zero, meaning the object's velocity is zero (stationary)."
      },
      {
        question: "A projectile is launched at an angle to the horizontal. At the highest point of its trajectory, what are its velocity and acceleration components?",
        options: {
          A: "Both velocity and acceleration are zero.",
          B: "Velocity is horizontal and non-zero; acceleration is g downwards.",
          C: "Velocity is zero; acceleration is g downwards.",
          D: "Velocity is horizontal and non-zero; acceleration is zero."
        },
        answer: "B",
        explanation: "At the peak, vertical velocity is zero but horizontal velocity remains. The only force acting is gravity, so acceleration is g downwards."
      },
      {
        question: "The velocity-time graph of an object shows a straight line with a constant negative gradient. What does this indicate?",
        options: {
          A: "The object is moving backward at a constant speed.",
          B: "The object is stationary.",
          C: "The object is decelerating at a constant rate.",
          D: "The object has variable acceleration."
        },
        answer: "C",
        explanation: "The gradient of a velocity-time graph represents acceleration. A constant negative gradient indicates constant negative acceleration (deceleration)."
      }
    ]
  },
  "B.3": {
    "remembering": [
      {
        question: "According to Boyle's Law, what is the relationship between the pressure and volume of a fixed mass of gas at constant temperature?",
        options: {
          A: "Pressure is directly proportional to volume.",
          B: "Pressure is inversely proportional to volume.",
          C: "Pressure is proportional to the square of volume.",
          D: "Pressure is independent of volume."
        },
        answer: "B",
        explanation: "Boyle's Law states that for a fixed mass of gas at a constant temperature, pressure P is inversely proportional to volume V (P ∝ 1/V, or PV = constant)."
      },
      {
        question: "What does the symbol 'n' represent in the ideal gas equation PV = nRT?",
        options: {
          A: "Number of molecules in the gas.",
          B: "Mass of the gas in grams.",
          C: "Number of moles of the gas.",
          D: "Avogadro's constant."
        },
        answer: "C",
        explanation: "In PV = nRT, 'n' represents the amount of substance in moles, whereas N represents the absolute number of molecules."
      },
      {
        question: "At which of the following temperatures does the kinetic energy of ideal gas molecules theoretically become zero?",
        options: {
          A: "0 °C",
          B: "-100 °C",
          C: "0 K",
          D: "273 K"
        },
        answer: "C",
        explanation: "Absolute zero (0 Kelvin) is the temperature at which all molecular motion stops, meaning the average kinetic energy of the molecules is theoretically zero."
      },
      {
        question: "Which gas law states that at constant pressure, the volume of a gas is directly proportional to its absolute temperature?",
        options: {
          A: "Boyle's Law",
          B: "Charles's Law",
          C: "Gay-Lussac's Law",
          D: "Avogadro's Law"
        },
        answer: "B",
        explanation: "Charles's Law relates volume and absolute temperature (V ∝ T) under constant pressure conditions."
      },
      {
        question: "What are the standard SI units for the universal gas constant R?",
        options: {
          A: "J mol^-1 K^-1",
          B: "Pa m^3 mol^-1",
          C: "atm L mol^-1 K^-1",
          D: "N m K^-1"
        },
        answer: "A",
        explanation: "R has units of Joules per mole per Kelvin (J mol^-1 K^-1) in the standard SI system."
      }
    ],
    "understanding": [
      {
        question: "Why does the pressure of an ideal gas increase when it is heated in a container of fixed volume?",
        options: {
          A: "The molecules expand and occupy more volume.",
          B: "The average speed of the molecules increases, leading to more frequent and forceful collisions with the walls.",
          C: "Intermolecular attractive forces become stronger.",
          D: "The number of gas molecules inside the container increases."
        },
        answer: "B",
        explanation: "Heating increases the absolute temperature, which increases the average kinetic energy and speed of the molecules. In a fixed volume, they hit the walls more frequently and with greater momentum change, increasing pressure."
      },
      {
        question: "An ideal gas is compressed isothermally to half of its original volume. What happens to the average kinetic energy of its molecules?",
        options: {
          A: "It doubles.",
          B: "It is halved.",
          C: "It remains unchanged.",
          D: "It increases by a factor of four."
        },
        answer: "C",
        explanation: "The average kinetic energy of gas molecules depends solely on its absolute temperature (E_k = 3/2 k_B T). Since the compression is isothermal (constant temperature), the average kinetic energy remains unchanged."
      },
      {
        question: "Under what conditions of temperature and pressure do real gases behave most like an ideal gas?",
        options: {
          A: "Low temperature and high pressure.",
          B: "High temperature and high pressure.",
          C: "High temperature and low pressure.",
          D: "Low temperature and low pressure."
        },
        answer: "C",
        explanation: "At high temperatures (molecules move very fast, minimizing intermolecular attraction) and low pressures (molecules are far apart, making molecular volume negligible), real gases approximate ideal gas behavior."
      },
      {
        question: "If a gas volume is doubled and its absolute temperature is tripled, by what factor does its pressure change?",
        options: {
          A: "6",
          B: "1.5",
          C: "2/3",
          D: "3"
        },
        answer: "B",
        explanation: "From PV = nRT, we have P = nRT/V. If T becomes 3T and V becomes 2V, the new pressure P' = nR(3T)/(2V) = 1.5 * (nRT/V) = 1.5 P."
      },
      {
        question: "Which of the following describes the molecular behavior during an isobaric expansion of an ideal gas?",
        options: {
          A: "Molecules slow down as volume increases.",
          B: "Molecules speed up to maintain pressure as collisions per unit area would otherwise decrease.",
          C: "Molecules maintain the exact same speed and collision rate.",
          D: "The intermolecular attraction increases to pull the piston."
        },
        answer: "B",
        explanation: "In an isobaric (constant pressure) expansion, volume increases. To maintain constant pressure, temperature must rise (Charles's law), meaning molecules speed up to compensate for hitting the larger wall surface area less frequently."
      }
    ]
  }
};

// Generates procedural mock questions in case we don't have static ones defined for a topic/level
function generateProceduralMockQuestions(subtopicId, subtopicName, level) {
  const isRemembering = level.toLowerCase().includes("remembering");
  const questions = [];

  for (let i = 1; i <= 5; i++) {
    let questionText = "";
    let options = {};
    let answer = "A";
    let explanation = "";

    if (isRemembering) {
      // Templates for Remembering level
      switch (i) {
        case 1:
          questionText = `In the context of IB Physics Topic ${subtopicId} (${subtopicName}), what is the standard SI unit or definition for a core quantity?`;
          options = {
            A: "The ratio of relevant fundamental quantities, measured in standard units.",
            B: "A derived quantity measured in standard vector terms.",
            C: "The scalar product of mechanical characteristics.",
            D: "The fundamental constant defined by radioactive baseline cycles."
          };
          answer = "A";
          explanation = "Standard physical definitions in IB Physics emphasize the ratio or products of fundamental SI base units, aligning with syllabus criteria.";
          break;
        case 2:
          questionText = `Which of the following correctly identifies a fundamental law, formula, or principle of ${subtopicName}?`;
          options = {
            A: "The quantity remains conserved under closed, isolated system boundaries.",
            B: "The quantity increases exponentially with the square of the distance.",
            C: "The gradient of the potential field is always perpendicular to motion.",
            D: "Energy is dissipated strictly through electromagnetic wave propagation."
          };
          answer = "A";
          explanation = "Conservation laws are central remembering landmarks in the IB Physics HL curriculum for subtopic " + subtopicName + ".";
          break;
        case 3:
          questionText = `Which of the following is a primary characteristic of a system undergoing processes described in ${subtopicName}?`;
          options = {
            A: "No net external force acts, maintaining state equilibrium.",
            B: "Energy is perfectly conserved as mechanical kinetic potential.",
            C: "Entropy decreases locally without thermal output.",
            D: "The wave function collapses immediately to its eigenvalue."
          };
          answer = "A";
          explanation = "For " + subtopicName + ", identifying state conditions such as zero net force or equilibrium is essential base knowledge.";
          break;
        case 4:
          questionText = `What physical quantity does the gradient of the primary graphical representation in ${subtopicName} define?`;
          options = {
            A: "The direct rate of change of the primary dependent variable.",
            B: "The accumulated product (area under curve) of the variables.",
            C: "A dimensionless coefficient of resistance.",
            D: "The instantaneous flux density of the field."
          };
          answer = "A";
          explanation = "The gradient of any physical graph represents the rate of change (dy/dx) of the plotted physical parameters.";
          break;
        default:
          questionText = `Which of the following is a scalar quantity in the study of ${subtopicName}?`;
          options = {
            A: "Temperature and total energy content.",
            B: "Field strength and momentum.",
            C: "Displacement vector and torque.",
            D: "Induced EMF and magnetic force."
          };
          answer = "A";
          explanation = "Energy and temperature are scalar quantities, whereas forces, fields, and displacement are vector quantities in " + subtopicName + ".";
          break;
      }
    } else {
      // Templates for Understanding level (requires conceptual mapping or simple calculation explanation)
      switch (i) {
        case 1:
          questionText = `An experiment in ${subtopicName} results in a parameter being doubled. What is the physical explanation of the corresponding effect?`;
          options = {
            A: "The double change increases the response proportionally due to linear scaling.",
            B: "The response quadruples because of the inverse square relation.",
            C: "The response is cut in half to satisfy conservation of energy.",
            D: "The system remains unaffected due to dampening factors."
          };
          answer = "A";
          explanation = "A linear relationship in " + subtopicName + " implies that doubling the independent parameter results in a proportional doubling of the dependent response.";
          break;
        case 2:
          questionText = `How do the principles of ${subtopicName} explain the conservation of energy during a state transition?`;
          options = {
            A: "Mechanical work done equals the area under the force-displacement curve.",
            B: "Dissipative thermal losses increase the total potential energy.",
            C: "The work is converted entirely to gravitational fields without resistance.",
            D: "The velocity increases to keep the kinetic potential constant."
          };
          answer = "A";
          explanation = "Mechanical work done represents energy transferred, which is conceptually represented by the area under the force-displacement curve in " + subtopicName + ".";
          break;
        case 3:
          questionText = `Under what physical model can the behavior of a system in ${subtopicName} be approximated as ideal?`;
          options = {
            A: "When external friction, drag, and thermal losses are negligible.",
            B: "When the system is subjected to high gravity and absolute zero temperature.",
            C: "When the microscopic particle collisions are highly inelastic.",
            D: "When relativistic effects dominate the kinematics."
          };
          answer = "A";
          explanation = "Idealizations in IB Physics HL focus on eliminating resistive forces like air resistance or friction to study fundamental laws.";
          break;
        case 4:
          questionText = `What is the physical significance of the area under the curve in a primary plot of ${subtopicName}?`;
          options = {
            A: "It represents the total work done or change in energy of the system.",
            B: "It defines the instant acceleration of the system particles.",
            C: "It is a measure of the experimental systematic error.",
            D: "It gives the wave amplitude frequency ratio."
          };
          answer = "A";
          explanation = "In many physical graphs, the integral or area under the curve represents an accumulated product, such as Work = Force x Distance in " + subtopicName + ".";
          break;
        default:
          questionText = `Which of the following describes a fundamental principle commonly applied in ${subtopicName}?`;
          options = {
            A: "The system's total energy and momentum are conserved in the absence of external unbalanced forces or torques.",
            B: "The microscopic particles expand continuously to fill any available vacuum.",
            C: "The physical laws undergo a phase transition at macroscopic scales.",
            D: "The measured parameters remain entirely subjective to the observer's frame."
          };
          answer = "A";
          explanation = "In " + subtopicName + ", as in most classical physics frameworks, conservation laws of energy and momentum form the foundation for analyzing system dynamics.";
          break;
      }
    }

    questions.push({
      question: questionText,
      options: options,
      answer: answer,
      explanation: explanation
    });
  }

  return questions;
}

// Randomizes the answer choices so that the correct answer is uniformly distributed among A, B, C, D
function shuffleQuestion(q) {
  const letters = ["A", "B", "C", "D"];
  const correctText = q.options[q.answer];
  const optionTexts = letters.map(l => q.options[l]);

  // Fisher-Yates shuffle
  for (let i = optionTexts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [optionTexts[i], optionTexts[j]] = [optionTexts[j], optionTexts[i]];
  }

  const newCorrectIndex = optionTexts.indexOf(correctText);
  const newAnswer = letters[newCorrectIndex];

  return {
    ...q,
    options: {
      A: optionTexts[0],
      B: optionTexts[1],
      C: optionTexts[2],
      D: optionTexts[3]
    },
    answer: newAnswer
  };
}

export async function generateQuestions(host, model, topicId, subtopicId, subtopicName, level, providerMode, geminiApiKey, geminiModel) {
  if (providerMode === "mock" || providerMode === true) {
    let selectedQuestions = [];
    if (MOCK_QUESTIONS_DB[subtopicId] && MOCK_QUESTIONS_DB[subtopicId][level]) {
      selectedQuestions = MOCK_QUESTIONS_DB[subtopicId][level];
    } else {
      selectedQuestions = generateProceduralMockQuestions(subtopicId, subtopicName, level);
    }
    return selectedQuestions.map(shuffleQuestion).slice(0, 5);
  }

  const cleanedLevel = level.toLowerCase();
  const promptText = `For IB Physics HL topic ${subtopicId} (${subtopicName}), create 5 multiple choice questions, with answer and explanation, that will fit the ${cleanedLevel} level of bloom's taxonomy.
Each question must have exactly four answer choices (A, B, C, D).
You must output your response as a JSON object matching this schema:
{
  "questions": [
    {
      "thought_scratchpad": "Write a step-by-step physical and mathematical derivation here before doing anything else. For example, write down the relevant equations, perform the algebra, check inequality signs carefully, and verify the conclusion. Be extremely rigorous and detail-oriented.",
      "question": "Clear and precise physics multiple choice question text",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "explanation": "Brief, finalized explanation of why the option is correct. DO NOT include any of your internal thought process, self-corrections, or drafting steps here. Those belong STRICTLY in the thought_scratchpad.",
      "answer": "A" // must be exactly 'A', 'B', 'C', or 'D'
    }
  ]
}

Ensure the questions are accurate for the IB Physics HL syllabus, use correct terminology, and the specified cognitive level (${cleanedLevel}).

PHYSICS ACCURACY & LOGICAL RIGOR RULES:
- STRICTLY limit scope to the IB Physics syllabus. Do NOT include IB Chemistry concepts (e.g., Gibbs Free Energy, Enthalpy, exothermic/endothermic reactions) even for overlapping topic names like Thermodynamics.
- Perform step-by-step mathematical reasoning and physics verification for each question before defining the options.
- ALL reasoning, self-correction, drafting, and step-by-step verification MUST go in the "thought_scratchpad" field. The "explanation" field MUST only contain the polished, final explanation for the student. Do not let your internal monologue leak into the explanation or question text!
- Double-check all formulas, equations, vector diagrams, signs, and relative shifts. Avoid sign errors and conceptual misunderstandings!

LaTeX MATH FORMATTING RULES:
- Use LaTeX inline formatting (using single dollar signs, like $m$, $F$, $a$, $f_k$, $E_k = \\frac{1}{2}mv^2$) for all variable symbols, units, equations, and mathematical variables.
- CRITICAL FOR JSON STRING COMPATIBILITY: In JSON strings, any backslash must be double-escaped. Therefore, you MUST write \\\\text{...} instead of \\text{...}, \\\\frac{...}{...} instead of \\frac{...}{...}, \\\\Delta instead of \\Delta, and so on. Failing to double-escape backslashes (\\\\) will result in JSON parsing errors or corrupted text (e.g., \\text being parsed as a tab character \\t followed by ext).

Do not include any text outside the JSON object.`;

  try {
    let rawText = "";

    if (providerMode === "gemini") {
      if (!geminiApiKey) {
        throw new Error("Gemini API key is required but not provided.");
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Gemini API error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No candidates returned from Gemini");
      }
      rawText = data.candidates[0].content.parts[0].text;
      
    } else {
      // Default to Ollama
      const url = `${host.replace(/\/$/, "")}/api/generate`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model,
          prompt: promptText,
          max_tokens: 4096,
          stream: false,
          options: { temperature: 0.7 },
          format: "json"
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      rawText = data.response;
    }

    // Fix common unescaped backslashes in LaTeX generated by LLMs before parsing
    // 1. Fix all invalid JSON escapes (anything not " \ / b f n r t u)
    rawText = rawText.replace(/(?<!\\)\\([^"\\/bfnrtu])/g, "\\\\$1");
    // 2. Explicitly fix LaTeX commands that start with valid JSON escapes
    rawText = rawText.replace(/(?<!\\)\\(beta|bf|bar|bot|bullet|big|frac|nu|neq|nabla|rho|right|rightarrow|Rightarrow|rangle|tau|text|times|theta|to|triangle|therefore|tilde|tan)/g, "\\\\$1");
    // 3. Fix \u that is not followed by 4 hex digits (e.g. \uparrow)
    rawText = rawText.replace(/(?<!\\)\\u(?![0-9a-fA-F]{4})/g, "\\\\u");

    // Parse with extreme robustness
    let parsedData;
    try {
      parsedData = JSON.parse(rawText.trim());
    } catch (e) {
      const start = rawText.indexOf("{");
      const end = rawText.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        const jsonSub = rawText.substring(start, end + 1);
        parsedData = JSON.parse(jsonSub);
      } else {
        throw new Error("Failed to parse JSON out of LLM output");
      }
    }

    // Normalize output structure
    if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
      throw new Error("LLM output did not contain 'questions' array");
    }

    const normalizedQuestions = parsedData.questions.map((q, idx) => {
      const questionText = q.question || `Question ${idx + 1} for ${subtopicId}`;
      let opts = q.options || { A: "Option A", B: "Option B", C: "Option C", D: "Option D" };
      
      if (Array.isArray(opts)) {
        opts = {
          A: opts[0] || "Option A",
          B: opts[1] || "Option B",
          C: opts[2] || "Option C",
          D: opts[3] || "Option D"
        };
      }

      let ans = (q.answer || "A").toString().trim().toUpperCase();
      if (!["A", "B", "C", "D"].includes(ans)) { ans = "A"; }

      let expl = q.explanation || q.Explanation || q.reasoning || "";
      let scratchpad = q.thought_scratchpad || q.Thought_scratchpad || "";
      
      let finalExplanation = "No explanation provided.";
      if (expl) {
        finalExplanation = expl;
      } else if (scratchpad) {
        finalExplanation = scratchpad;
      }

      return {
        question: questionText,
        options: opts,
        answer: ans,
        explanation: finalExplanation
      };
    });

    return normalizedQuestions.map(shuffleQuestion).slice(0, 5);

  } catch (error) {
    console.error("Error querying LLM API:", error);
    throw new Error(error.message || "Network error contacting LLM");
  }
}
