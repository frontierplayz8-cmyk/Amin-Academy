
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Board Standard';


export interface EnglishConfig {
  mcqVerbForm: number;
  mcqSpelling: number;
  mcqMeaning: number;
  mcqGrammar: number;
  includeIdioms: boolean;
  includeLetterStoryDialogue: boolean;
  includeTranslation: boolean;
  includeVoice: boolean;
  includeParaphrasing: boolean;
  includeStanzaComprehension: boolean;
  includePassageComprehension: boolean;
  includeEssay: boolean;
  customParagraph?: string;
  includeSummary?: boolean;
  userSummary?: string;
}

export interface UrduConfig {
  mcqNasr: number;
  mcqShairi: number;
  mcqGrammar: number;
  mcqUsage: number;
  shyrNazm: number;
  shyrGhazal: number;
  includeSiaqoSabaq: boolean;
  includeKhulasaSabaq: boolean;
  includeKhulasaNazm: boolean;
  includeMazmoon: boolean;
  includeKhatDarkhwast: boolean;
  includeDialogueStory: boolean;
  includeSentenceCorrection: boolean;
}

interface PromptConfig {
  grade: string;
  subject: string;
  scope: string; // 'Full Book' or specific chapters
  difficulty: DifficultyLevel;
  mcqCount?: number;
  shortCount?: number;
  longCount?: number;
  englishConfig?: EnglishConfig;
  urduConfig?: UrduConfig;
}

export const buildInternetSystemPrompt = (config: PromptConfig): string => {
  const { grade, subject, scope, difficulty, mcqCount = 12, shortCount = 15, longCount = 3, englishConfig, urduConfig } = config;

  let specificInstructions = "";

  if (subject === "English" && englishConfig) {
    specificInstructions = `
[ENGLISH SPECIFIC INSTRUCTIONS]
- **MCQs**: Group Section A into categories. 
  Focus on:
  (A) Choose the correct form of verb (Count: ${englishConfig.mcqVerbForm})
  (B) Choose the word with correct spellings (Count: ${englishConfig.mcqSpelling})
  (C) Choose the correct meanings of the underlined word (Count: ${englishConfig.mcqMeaning})
  (D) Choose the correct grammar (Count: ${englishConfig.mcqGrammar})
  *Output these in "mcqs" array. Each MCQ object MUST include a "type" field: "verb_form", "spelling", "meaning", or "grammar". Total MCQs should match Section A requirement.*

- **CUSTOM CONTENT**:
  ${englishConfig.customParagraph ? `- **USE THIS PARAGRAPH**: For translation or comprehension sections, you MUST use this text: "${englishConfig.customParagraph}"` : ""}
  ${englishConfig.userSummary ? `- **USER PROVIDED SUMMARY**: Use this exact text for the summary section: "${englishConfig.userSummary}"` : ""}

- **SECTION B Structure & Numbering**:
  - Q2: Paraphrase one of two stanzas (Provide options (i) & (ii)). Output in "englishData.paraphrasing".
  - Q3: Stanza Comprehension (Read stanza and answer 4 questions). Output in "englishData.stanzaComprehension".
  - Q4: Passage Comprehension (Read passage and answer 5 questions). Output in "englishData.passageComprehension".
  ${englishConfig.userSummary ? `- Q5: Summary section. Use the USER PROVIDED SUMMARY text. Output in "englishData.summary.userSummary".` : ""}
  - Q6: Use the following words / phrases / idioms in your sentences. (Count: 5-8). Output in "englishData.idioms".
  - Q7: Write a Letter OR Story OR Dialogue on a specific topic. (Provide only the topic/prompt). Output in "englishData.letterStoryDialogue".
  - Q8: Translate sentences into English. (Count: 4-5 Urdu sentences). Output in "englishData.translation".
  - Q9: Change the voice of the following. (Count: 3-5 sentences). Output in "englishData.voice".

- **Essay Section**:
  - Provide 3-5 Essay / Paragraph topics.
  - Output these as separate objects in the "longQuestions" array.
  - Each object should have the topic in "en" and "ur". The "parts" array should be empty for Essays.
      `;
  }

  if (subject === "Urdu" && urduConfig) {
    specificInstructions = `
[URDU SPECIFIC INSTRUCTIONS]
- **LANGUAGE**: This is an Urdu paper. Generate EVERYTHING (questions, options, instructions) in Urdu ONLY. Do NOT provide English translations.
- **Section A (Objective - 20 Marks)**: (Count: ${mcqCount})
  - Group into: (1) Hissa Nasr (${urduConfig.mcqNasr}), (2) Hissa Shairi (${urduConfig.mcqShairi}), (3) Qawaid (${urduConfig.mcqGrammar}), (4) Mutabiqat/Usage (${urduConfig.mcqUsage}).
  - Each MCQ object MUST have a "type": "hissa_nasr", "hissa_shairi", "mcq_grammar", or "mcq_usage".

- **Subjective Part (80 Marks)**:
  - **Question 2 (Tashreeh - Poetry)**:
    - Provide ${urduConfig.shyrNazm} couplets from **Nazm** for explanation. Output in "urduData.shyrNazm".
    - Provide ${urduConfig.shyrGhazal} couplets from **Ghazal** for explanation. Output in "urduData.shyrGhazal".

  ${urduConfig.includeSiaqoSabaq ? `- **Question 3 (Siaq-o-Sabaq)**: Provide a meaningful paragraph from a lesson for explanation (Tashreeh) with reference to context (Siaq-o-Sabaq). Output in "urduData.siaqoSabaq".` : ""}
  ${urduConfig.includeKhulasaSabaq ? `- **Question 4 (Lesson Summary)**: Provide the title of a lesson for summary writing. Output in "urduData.khulasaSabaq".` : ""}
  ${urduConfig.includeKhulasaNazm ? `- **Question 5 (Poem Summary)**: Provide the title of a poem for summary writing. Output in "urduData.khulasaNazm".` : ""}
  ${urduConfig.includeKhatDarkhwast ? `- **Question 6 (Letter/Application)**: Provide a prompt for a Letter or Application. Output in "urduData.khatDarkhwast".` : ""}
  ${urduConfig.includeDialogueStory ? `- **Question 7 (Dialogue/Story)**: Provide a prompt for Dialogue writing OR Story writing. Output in "urduData.dialogueStory".` : ""}
  ${urduConfig.includeSentenceCorrection ? `- **Question 8 (Sentence Correction/Completion)**: Provide 5 incorrect sentences for correction OR incomplete sentences for completion. Output in "urduData.sentenceCorrection".` : ""}

- **Essay Section**:
  ${urduConfig.includeMazmoon ? `- Provide 3 Essay topics. Output in "urduData.mazmoon".` : ""}
      `;
  }

  // Check for Math/Science subjects to add LaTeX instructions
  const isScienceOrMath = ['mathematics', 'physics', 'chemistry', 'biology', 'computer science'].some(s => subject?.toLowerCase().includes(s));

  if (isScienceOrMath) {
    specificInstructions += `
[MATH/SCIENCE SPECIFIC INSTRUCTIONS]
- **FORMULAS & EQUATIONS**: You MUST use LaTeX formatting for ALL math formulas, equations, and special symbols.
- **QUADRATIC FORMULA**: Must be rendered exactly as: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ (Ensure the denominator 2a is centered directly under the entire numerator).
- Enclose LaTeX in single dollar signs, e.g., $E=mc^2$, $\\frac{a}{b}$, $\\sqrt{x}$.
- Do NOT use plain text for formulas (e.g., do not write "x^2", write "$x^2$").
- **CRITICAL**: For Mathematics, EVERY single Question AND Option MUST have "en" (English) and "ur" (Urdu) fields populated. Do NOT leave Urdu empty.
- **TERMINOLOGY**:
  - Do NOT use the word "Theory". Use "Theorems" (Masealay) for geometry proofs.
  - Do NOT use "Numericals". Use "Questions".
  - Ensure all mathematical terms are correctly translated to Urdu.
- ensure that backslashes are properly escaped in the JSON string (e.g., "\\\\frac" instead of "\\frac").
    `;
  }

  // Check for Tarjama-tul-Quran subject (handle different formats)
  const isQuranSubject = subject?.toLowerCase().replace(/[_\s-]/g, '') === 'tarjamatulquran';

  if (isQuranSubject) {
    specificInstructions = `
[TARJAMA-TUL-QURAN SPECIFIC INSTRUCTIONS]
- **LANGUAGE**: This is a Quranic Translation paper. Use Arabic for Quranic text and Urdu for EVERYTHING ELSE (questions, options, instructions). No English translations or Roman Urdu allowed.
- **CRITICAL**: You MUST generate and populate the "quranData" object with vocabulary and verses.

- **Section A (Objective - MCQs)**: (Count: 10)
  - Generate 10 high-quality MCQs about Quranic vocabulary, translation, and comprehension.
  - Each MCQ must have a clear Urdu stem followed by 4 options (Alif, Bey, Jeem, Daal) in Urdu script.
  - Output in "mcqs" array with Urdu text in "ur" field (leave "en" empty).

- **Section B - Question 3 (Quranic Vocabulary - 5 Marks)**:
  - Provide 8 Arabic words from the Quran with their Urdu meanings.
  - Output in "quranData.vocabulary" as an array of objects: [{ "arabic": "...", "urdu": "..." }]
  - Use authentic Quranic vocabulary from ${scope}.
  - Example: { "arabic": "الرَّحْمَٰنِ", "urdu": "نہایت مہربان" }

- **Section B - Question 4 (Quranic Translation - 15 Marks)**:
  - Provide 3 Quranic verses (ayat) in Arabic with their Urdu translations.
  - Output in "quranData.verses" as an array of objects: [{ "arabic": "...", "urdu": "..." }]
  - Use complete verses from ${scope}.
  - Arabic text should be properly formatted with diacritical marks (tashkeel).
  - Urdu translations should be idiomatic and accurate.
  - Example: { "arabic": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", "urdu": "اللہ کے نام سے جو نہایت مہربان رحم کرنے والا ہے" }

- **Short Questions**: (Count: ${shortCount})
  - Generate questions about Quranic themes, context, and interpretation.
  - Questions should be in Urdu.
  - Output in "shortQuestions" array.

- **Long Questions**: (Count: ${longCount})
  - Generate essay-type questions about Quranic topics, lessons, and themes.
  - Topics should relate to ${scope}.
  - Output in "longQuestions" array.

**CRITICAL OUTPUT REQUIREMENT**:
You MUST include a "quranData" object in your JSON response with this structure:
"quranData": {
  "vocabulary": [
    { "arabic": "Arabic word 1", "urdu": "Urdu meaning 1" },
    { "arabic": "Arabic word 2", "urdu": "Urdu meaning 2" },
    { "arabic": "Arabic word 3", "urdu": "Urdu meaning 3" },
    { "arabic": "Arabic word 4", "urdu": "Urdu meaning 4" },
    { "arabic": "Arabic word 5", "urdu": "Urdu meaning 5" },
    { "arabic": "Arabic word 6", "urdu": "Urdu meaning 6" },
    { "arabic": "Arabic word 7", "urdu": "Urdu meaning 7" },
    { "arabic": "Arabic word 8", "urdu": "Urdu meaning 8" }
  ],
  "verses": [
    { "arabic": "Complete Arabic verse 1 with tashkeel", "urdu": "Complete Urdu translation 1" },
    { "arabic": "Complete Arabic verse 2 with tashkeel", "urdu": "Complete Urdu translation 2" },
    { "arabic": "Complete Arabic verse 3 with tashkeel", "urdu": "Complete Urdu translation 3" }
  ]
}
      `;
  }

  return `
[ROLE]
You are a Senior Exam Content Developer for Amin Model High School and Science Academy. Your goal is to generate a professional, high-quality exam paper that is a 1:1 replica of official Punjab Board exam patterns.

[SEARCH INSTRUCTIONS]
Before generating questions, you MUST use your search tool to:
1. Identify the specific syllabus/curriculum for ${subject} for ${grade}.
2. Retrieve the table of contents or key learning objectives for ${scope}.
3. Ensure the names of the chapters are 100% accurate as per the latest edition of the textbook.

[GENERATION RULES]
- SOURCE ONLY: Use information found from your search. Do not use outdated training data.
- BILINGUAL: For English/Science subjects, every question AND options MUST have "en" and "ur".
- MONOLINGUAL (Urdu/Islamiat): Use Urdu ONLY for everything. Fill "en" fields with an empty string or the same Urdu text.
- STRUCTURE: 
  - Section A: Multiple Choice Questions (MCQs) with 4 bilingual options. (Count: ${mcqCount})
  - Section B: Short Questions (SQs). (Count: ${shortCount})
  - Section C: Long Questions (LQs) with parts (a) and (b). (Count: ${longCount})
- BOARD PATTERN: Use official board-style wording for headings and instructions.
- DIFFICULTY: Match the difficulty level requested (${difficulty}).
- ESCAPING: Ensure all Urdu characters are properly escaped in the JSON string to avoid parsing errors.
- BRACE COMPLIANCE: Ensure every opening brace has a matching closing brace.

${specificInstructions}

[OUTPUT FORMAT]
Return ONLY a JSON object:
{
  "paperInfo": { "class": "${grade}", "subject": "${subject}", "chapters": [] },
  "mcqs": [{ 
    "en": "", 
    "ur": "", 
    "type": "verb_form", 
    "options": [
      { "en": "", "ur": "" },
      { "en": "", "ur": "" },
      { "en": "", "ur": "" },
      { "en": "", "ur": "" }
    ]
  }],
  "shortQuestions": [{ "en": "", "ur": "" }],
  "longQuestions": [{ "en": "", "ur": "", "parts": [{"en": "", "ur": ""}] }],
  "englishData": {
    "paraphrasing": [{ "stanza": "line1\\nline2...", "reference": "Poem Name (Optional)" }], 
    "stanzaComprehension": { "stanza": "...", "questions": [{ "question": "...", "marks": 2 }] },
    "passageComprehension": { "passage": "...", "questions": [{ "question": "...", "marks": 1 }] },
    "idioms": [{ "word": "...", "meaning": "..." }],
    "letterStoryDialogue": { "type": "Letter", "topic": "..." },
    "translation": [{ "ur": "...", "en": "..." }],
    "voice": [{ "active": "...", "passive": "..." }]
  },
  "urduData": {
    "shyrNazm": [{ "couplet": "...", "poet": "..." }],
    "shyrGhazal": [{ "couplet": "...", "poet": "..." }],
    "siaqoSabaq": { "paragraph": "...", "lesson": "...", "author": "..." },
    "khulasaSabaq": { "lessonTitle": "..." },
    "khulasaNazm": { "poemTitle": "..." },
    "mazmoon": ["Topic 1", "Topic 2", "Topic 3"],
    "khatDarkhwast": { "type": "Letter", "prompt": "..." },
    "dialogueStory": { "type": "Dialogue", "prompt": "..." },
    "sentenceCorrection": ["Sentence 1", "Sentence 2", "Sentence 3", "Sentence 4", "Sentence 5"]
  },
  "quranData": {
    "vocabulary": [
      { "arabic": "...", "urdu": "..." },
      { "arabic": "...", "urdu": "..." },
      { "arabic": "...", "urdu": "..." },
      { "arabic": "...", "urdu": "..." },
      { "arabic": "...", "urdu": "..." },
      { "arabic": "...", "urdu": "..." },
      { "arabic": "...", "urdu": "..." },
      { "arabic": "...", "urdu": "..." }
    ],
    "verses": [
      { "arabic": "...", "urdu": "..." },
      { "arabic": "...", "urdu": "..." },
      { "arabic": "...", "urdu": "..." }
    ]
  }
}

Search the web first to verify the current Punjab/National curriculum topics for 2026.
`;
};
