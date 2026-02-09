
export const buildDigitizationPrompt = (metadata: any): string => {
  return `
[ROLE]
You are a highly accurate Optical Character Recognition (OCR) and exam digitization expert. Your task is to extract all questions from the provided scanned past paper image/PDF and convert them into a structured JSON format.

[CONTEXT]
- Subject: ${metadata.subject}
- Class: ${metadata.grade}
- Board: ${metadata.board}
- Year: ${metadata.year}

[RULES]
1. **EXTRACT EXACT TEXT**: Do not change the wording of questions or options.
2. **BILINGUAL EXTRACTION**: Most papers are in English and Urdu. Extract BOTH. 
   - If a question is only in one language, provide an accurate translation for the other.
3. **STRUCTURE**:
   - MCQs: Extract question, 4 options (A-D), and their Urdu translations.
   - Short Questions: Extract question text and Urdu translation.
   - Long Questions: Extract question text, parts (a, b, etc.), and Urdu translations.
4. **BILINGUAL REQ**: Every field ("en" and "ur") MUST be populated.
5. **JSON ONLY**: Return ONLY a raw JSON object. No markdown, no explanations.

[OUTPUT SCHEMA]
{
  "paperInfo": { 
    "class": "${metadata.grade}", 
    "subject": "${metadata.subject}", 
    "chapters": ["${metadata.year} ${metadata.session} - ${metadata.group}"] 
  },
  "headerDetails": {
    "session": "e.g., Annual 2024",
    "subjectUrdu": "Urdu name of subject",
    "timeObjective": "e.g., 20 Minutes",
    "marksObjective": "e.g., 15",
    "timeSubjective": "e.g., 2:10 Hours",
    "marksSubjective": "e.g., 60"
  },
  "mcqs": [
    { 
      "en": "Question text in English", 
      "ur": "Question text in Urdu", 
      "options": [
        { "en": "Option A", "ur": "Option A Urdu" },
        { "en": "Option B", "ur": "Option B Urdu" },
        { "en": "Option C", "ur": "Option C Urdu" },
        { "en": "Option D", "ur": "Option D Urdu" }
      ]
    }
  ],
  "shortQuestions": [
    { "en": "Short Question 1 English", "ur": "Short Question 1 Urdu" }
  ],
  "longQuestions": [
    { 
      "en": "Long Question English", 
      "ur": "Long Question Urdu", 
      "parts": [
        {"en": "Part (a) English", "ur": "Part (a) Urdu"}
      ] 
    }
  ],
  "metadata": {
    "model_name": "Identify yourself here (e.g. Gemini 2.0 Flash Thinking)",
    "confidence_score": "0-100"
  }
}
`;
};
