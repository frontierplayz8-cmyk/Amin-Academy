export function repairTruncatedJSON(jsonString: string): string {
    let trimmed = jsonString.trim();

    // 1. Handle unclosed string values first
    // Count quotes to see if we are inside a string
    let inString = false;
    let escape = false;
    for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        if (char === '\\' && !escape) {
            escape = true;
            continue;
        }
        if (char === '"' && !escape) {
            inString = !inString;
        }
        escape = false;
    }

    if (inString) {
        trimmed += '"';
    }

    // 2. Balance braces and brackets
    const stack: string[] = [];
    let isInsideString = false;
    let isEscaped = false;

    for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];

        if (char === '\\' && !isEscaped) {
            isEscaped = true;
            continue;
        }

        if (char === '"' && !isEscaped) {
            isInsideString = !isInsideString;
        }

        isEscaped = false;

        if (!isInsideString) {
            if (char === '{') {
                stack.push('}');
            } else if (char === '[') {
                stack.push(']');
            } else if (char === '}' || char === ']') {
                if (stack.length > 0 && stack[stack.length - 1] === char) {
                    stack.pop();
                }
            }
        }
    }

    // Append missing closing characters in reverse order
    while (stack.length > 0) {
        trimmed += stack.pop();
    }

    return trimmed;
}

export function repairInvalidEscapes(jsonString: string): string {
    // Escapes backslashes that are NOT part of a valid JSON escape sequence
    return jsonString.replace(/\\(?![bfnrtu"\\/]|u[0-9a-fA-F]{4})/g, '\\\\');
}

export function safeJSONParse<T>(jsonString: string, fallback: T): T {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        // Attempt 1: Repair invalid escapes (common in AI LaTeX output)
        try {
            const escaped = repairInvalidEscapes(jsonString);
            return JSON.parse(escaped);
        } catch (escapeError) {
            // Attempt 2: Repair truncation on the ORIGINAL string
            try {
                const repaired = repairTruncatedJSON(jsonString);
                return JSON.parse(repaired);
            } catch (repairError) {
                // Attempt 3: Repair truncation on the ESCAPED string
                try {
                    const escaped = repairInvalidEscapes(jsonString);
                    const repairedEscaped = repairTruncatedJSON(escaped);
                    return JSON.parse(repairedEscaped);
                } catch (finalError) {
                    console.error("JSON Repair Failed:", finalError);
                    return fallback;
                }
            }
        }
    }
}
