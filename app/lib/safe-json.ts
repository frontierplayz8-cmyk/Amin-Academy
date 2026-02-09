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

export function safeJSONParse<T>(jsonString: string, fallback: T): T {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        try {
            const repaired = repairTruncatedJSON(jsonString);
            return JSON.parse(repaired);
        } catch (repairError) {
            console.error("JSON Repair Failed:", repairError);
            return fallback;
        }
    }
}
