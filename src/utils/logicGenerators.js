// ─── Helpers ────────────────────────────────────────────────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function simplifyFraction(n, d) {
  if (d === 0) throw new Error('Division by zero');
  const g = gcd(Math.abs(n), Math.abs(d));
  let sn = n / g;
  let sd = d / g;
  if (sd < 0) { sn = -sn; sd = -sd; }
  return [sn, sd];
}

function fractionString(n, d) {
  const [sn, sd] = simplifyFraction(n, d);
  if (sd === 1) return String(sn);
  return `${sn}/${sd}`;
}

function fractionValue(n, d) {
  return n / d;
}

// ─── Arithmetic ─────────────────────────────────────────────────────────────

function generateArithmetic(difficulty) {
  const ops = {
    easy:   ['+', '-'],
    medium: ['+', '-', '×', '÷'],
    hard:   ['+', '-', '×', '÷'],
    expert: ['+', '-', '×', '÷'],
  };

  function numRange(op, difficulty) {
    if (difficulty === 'easy') return [1, 9];
    if (difficulty === 'medium') {
      if (op === '×' || op === '÷') return [2, 9];
      return [10, 99];
    }
    if (difficulty === 'hard') {
      if (op === '×' || op === '÷') return [10, 99];
      return [100, 999];
    }
    // expert
    if (op === '×' || op === '÷') return [10, 99];
    return [100, 9999];
  }

  const allowedOps = ops[difficulty] || ops['medium'];

  // Expert: compound expression a + b × c
  if (difficulty === 'expert' && Math.random() < 0.4) {
    const op1 = shuffle(['+', '-'])[0];
    const op2 = shuffle(['×', '÷'])[0];
    let a, b, c, answer;
    let attempts = 0;
    do {
      a = randInt(10, 999);
      b = randInt(2, 99);
      if (op2 === '÷') {
        c = randInt(2, 99);
        b = b * c; // ensure divisible
      } else {
        c = randInt(2, 99);
      }
      const part2 = op2 === '×' ? b * c : b / c;
      answer = op1 === '+' ? a + part2 : a - part2;
      attempts++;
    } while (!Number.isInteger(answer) || answer < 0 && attempts < 50);

    const part2 = op2 === '×' ? b * c : b / c;
    const prompt = `${a} ${op1} ${b} ${op2} ${c} = ?`;
    const explanation = op2 === '÷'
      ? `${b} ${op2} ${c} = ${part2}, then ${a} ${op1} ${part2} = ${answer}`
      : `${b} ${op2} ${c} = ${part2}, then ${a} ${op1} ${part2} = ${answer}`;

    return {
      type: 'arithmetic',
      prompt,
      correctAnswer: answer,
      explanation,
    };
  }

  const op = allowedOps[randInt(0, allowedOps.length - 1)];
  const [rMin, rMax] = numRange(op, difficulty);
  let a, b, answer;
  let attempts = 0;

  do {
    a = randInt(rMin, rMax);
    b = randInt(rMin, rMax);
    if (op === '+') {
      answer = a + b;
    } else if (op === '-') {
      // ensure non-negative result
      if (a < b) [a, b] = [b, a];
      answer = a - b;
      if (answer === 0) { a = b + randInt(1, rMax - rMin || 1); answer = a - b; }
    } else if (op === '×') {
      answer = a * b;
    } else {
      // division: pick divisor and quotient independently, ensure a ≠ b and quotient ≠ 1
      const divisor = randInt(2, Math.max(2, rMax));
      let quotient = randInt(2, Math.max(2, Math.floor(rMax / divisor) || 2));
      if (quotient === divisor) quotient = quotient === 2 ? 3 : quotient - 1;
      a = divisor * quotient;
      b = divisor;
      answer = quotient;
    }
    attempts++;
  } while (!Number.isInteger(answer) && attempts < 100);

  return {
    type: 'arithmetic',
    prompt: `${a} ${op} ${b} = ?`,
    correctAnswer: answer,
    explanation: `${a} ${op} ${b} = ${answer}`,
  };
}

// ─── Fractions & Percentages ─────────────────────────────────────────────────

function generateFraction(difficulty) {
  const variants = ['percentage', 'simplify', 'compare'];
  const variant = variants[randInt(0, 2)];

  if (variant === 'percentage') {
    let percent, base, answer;
    let attempts = 0;
    do {
      if (difficulty === 'easy') {
        percent = randInt(1, 9) * 10; // 10,20,...,90
        base = randInt(1, 10) * 10;   // 10,20,...,100
      } else if (difficulty === 'medium') {
        percent = randInt(1, 19) * 5; // multiples of 5
        base = randInt(1, 20) * 5;
      } else if (difficulty === 'hard') {
        percent = randInt(1, 99);
        base = randInt(1, 200);
      } else {
        percent = randInt(1, 999);
        base = randInt(1, 1000);
      }
      answer = (percent / 100) * base;
      attempts++;
    } while (
      (difficulty === 'easy' || difficulty === 'medium') &&
      !Number.isInteger(answer) &&
      attempts < 200
    );

    return {
      type: 'fraction',
      variant: 'percentage',
      prompt: `What is ${percent}% of ${base}?`,
      correctAnswer: answer,
      options: null,
      explanation: `${percent}% of ${base} = (${percent} ÷ 100) × ${base} = ${answer}`,
    };
  }

  if (variant === 'simplify') {
    let n, d, sn, sd;
    let attempts = 0;
    do {
      const maxDenom = difficulty === 'easy' ? 12
        : difficulty === 'medium' ? 30
        : difficulty === 'hard' ? 60
        : 120;
      d = randInt(2, maxDenom);
      n = randInt(1, d - 1);
      [sn, sd] = simplifyFraction(n, d);
      attempts++;
      // Ensure fraction isn't already fully simplified (make question interesting)
    } while (sd === d && n === sn && attempts < 100);

    const answerStr = sd === 1 ? String(sn) : `${sn}/${sd}`;
    return {
      type: 'fraction',
      variant: 'simplify',
      prompt: `Simplify ${n}/${d}`,
      correctAnswer: answerStr,
      options: null,
      explanation: `GCD(${n}, ${d}) = ${gcd(n, d)}, so ${n}/${d} = ${answerStr}`,
    };
  }

  // compare
  let n1, d1, n2, d2;
  let attempts = 0;
  do {
    const maxDenom = difficulty === 'easy' ? 8
      : difficulty === 'medium' ? 16
      : difficulty === 'hard' ? 30
      : 50;
    d1 = randInt(2, maxDenom);
    n1 = randInt(1, d1 - 1);
    d2 = randInt(2, maxDenom);
    n2 = randInt(1, d2 - 1);
    attempts++;
    // Ensure they are not equivalent
  } while (n1 * d2 === n2 * d1 && attempts < 200);

  const larger = fractionValue(n1, d1) > fractionValue(n2, d2)
    ? fractionString(n1, d1)
    : fractionString(n2, d2);

  const optA = fractionString(n1, d1);
  const optB = fractionString(n2, d2);

  const v1 = fractionValue(n1, d1).toFixed(4);
  const v2 = fractionValue(n2, d2).toFixed(4);

  return {
    type: 'fraction',
    variant: 'compare',
    prompt: `Which is larger: ${optA} or ${optB}?`,
    correctAnswer: larger,
    options: [optA, optB],
    explanation: `${optA} ≈ ${v1}, ${optB} ≈ ${v2}. The larger is ${larger}.`,
  };
}

// ─── Number Sequences ────────────────────────────────────────────────────────

function generateSequence(difficulty) {
  const ruleTypes = ['arithmetic-step', 'geometric', 'alternating-two-series'];
  if (difficulty === 'medium' || difficulty === 'hard' || difficulty === 'expert') {
    ruleTypes.push('fibonacci-style');
  }

  let result;
  let attempts = 0;

  do {
    const ruleType = ruleTypes[randInt(0, ruleTypes.length - 1)];
    result = tryBuildSequence(ruleType, difficulty);
    attempts++;
  } while (result === null && attempts < 200);

  if (result === null) {
    // Fallback: simple arithmetic
    const start = randInt(1, 10);
    const step = randInt(1, 5);
    const terms = Array.from({ length: 6 }, (_, i) => start + i * step);
    result = {
      terms: terms.slice(0, 5),
      correctAnswer: terms[5],
      rule: 'arithmetic-step',
      explanation: `Each term increases by ${step}.`,
    };
  }

  const options = difficulty === 'easy'
    ? buildSequenceOptions(result.correctAnswer)
    : null;

  return {
    type: 'sequence',
    terms: result.terms,
    correctAnswer: result.correctAnswer,
    rule: result.rule,
    explanation: result.explanation,
    options,
  };
}

function tryBuildSequence(ruleType, difficulty) {
  if (ruleType === 'arithmetic-step') {
    const maxStart = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 50 : 200;
    const maxStep = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 15 : 50;
    const start = randInt(1, maxStart);
    const step = randInt(1, maxStep) * (Math.random() < 0.3 ? -1 : 1);
    const terms = Array.from({ length: 6 }, (_, i) => start + i * step);
    if (!terms.every(t => Number.isInteger(t) && t > 0)) return null;
    return {
      terms: terms.slice(0, 5),
      correctAnswer: terms[5],
      rule: 'arithmetic-step',
      explanation: `Each term ${step >= 0 ? 'increases' : 'decreases'} by ${Math.abs(step)}.`,
    };
  }

  if (ruleType === 'geometric') {
    const maxStart = difficulty === 'easy' ? 3 : 5;
    const maxRatio = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    const start = randInt(1, maxStart);
    const ratio = randInt(2, maxRatio);
    const terms = Array.from({ length: 6 }, (_, i) => start * Math.pow(ratio, i));
    if (!terms.every(t => Number.isInteger(t) && t > 0 && t < 1e9)) return null;
    return {
      terms: terms.slice(0, 5),
      correctAnswer: terms[5],
      rule: 'geometric',
      explanation: `Each term is multiplied by ${ratio}.`,
    };
  }

  if (ruleType === 'alternating-two-series') {
    // Two interleaved arithmetic sequences
    const a0 = randInt(1, 20);
    const stepA = randInt(1, 10);
    const b0 = randInt(1, 20);
    const stepB = randInt(1, 10);
    // positions: a0, b0, a0+stepA, b0+stepB, a0+2*stepA, b0+2*stepB
    const terms = [a0, b0, a0 + stepA, b0 + stepB, a0 + 2 * stepA, b0 + 2 * stepB];
    if (!terms.every(t => Number.isInteger(t) && t > 0)) return null;
    return {
      terms: terms.slice(0, 5),
      correctAnswer: terms[5],
      rule: 'alternating-two-series',
      explanation: `Two interleaved sequences: odd positions increase by ${stepA}, even positions increase by ${stepB}. The 6th term continues the even-position sequence: ${b0 + stepB} + ${stepB} = ${b0 + 2 * stepB}.`,
    };
  }

  if (ruleType === 'fibonacci-style') {
    const a = randInt(1, 5);
    const b = randInt(1, 5);
    const terms = [a, b];
    for (let i = 2; i < 6; i++) {
      terms.push(terms[i - 1] + terms[i - 2]);
    }
    if (!terms.every(t => Number.isInteger(t) && t > 0)) return null;
    return {
      terms: terms.slice(0, 5),
      correctAnswer: terms[5],
      rule: 'fibonacci-style',
      explanation: `Each term is the sum of the two preceding terms. ${terms[3]} + ${terms[4]} = ${terms[5]}.`,
    };
  }

  return null;
}

function buildSequenceOptions(correct) {
  const offsets = shuffle([1, 2, 3, 4, 5, 6, 7, 8, -1, -2, -3, -4]);
  const distractors = [];
  for (const off of offsets) {
    const val = correct + off;
    if (val > 0 && !distractors.includes(val) && val !== correct) {
      distractors.push(val);
      if (distractors.length === 3) break;
    }
  }
  return shuffle([correct, ...distractors]);
}

// ─── Angle ───────────────────────────────────────────────────────────────────

function generateAngle(difficulty) {
  let degrees;
  if (difficulty === 'easy') {
    degrees = randInt(1, 11) * 15; // 15, 30, ..., 165
  } else if (difficulty === 'medium') {
    degrees = randInt(1, 35) * 5; // 5, 10, ..., 175
  } else if (difficulty === 'hard') {
    degrees = randInt(5, 355);
  } else {
    degrees = randInt(1, 359);
  }

  const tolerance = difficulty === 'easy' ? 8
    : difficulty === 'medium' ? 5
    : difficulty === 'hard' ? 3
    : 2;

  return {
    type: 'angle',
    degrees,
    tolerance,
  };
}

// ─── Algebra ─────────────────────────────────────────────────────────────────

function generateAlgebra(difficulty) {
  // Pick x first, then build equation around it
  let x, prompt, steps, explanation;
  let attempts = 0;

  do {
    x = randInt(-20, 20);
    const built = buildAlgebraEquation(difficulty, x);
    if (built) {
      ({ prompt, steps, explanation } = built);
      attempts = 999; // success
    }
    attempts++;
  } while (attempts < 200);

  return {
    type: 'algebra',
    prompt,
    correctAnswer: x,
    steps,
    explanation,
  };
}

function buildAlgebraEquation(difficulty, x) {
  if (difficulty === 'easy') {
    // One-step: x+a=b, x-a=b, a*x=b, x/a=b
    const form = randInt(0, 3);
    if (form === 0) {
      // x + a = b
      const a = randInt(1, 20);
      const b = x + a;
      return {
        prompt: `x + ${a} = ${b}`,
        steps: [`x = ${b} − ${a}`, `x = ${x}`],
        explanation: `Subtract ${a} from both sides: x = ${b} − ${a} = ${x}`,
      };
    }
    if (form === 1) {
      // x - a = b
      const a = randInt(1, 20);
      const b = x - a;
      return {
        prompt: `x − ${a} = ${b}`,
        steps: [`x = ${b} + ${a}`, `x = ${x}`],
        explanation: `Add ${a} to both sides: x = ${b} + ${a} = ${x}`,
      };
    }
    if (form === 2) {
      // a*x = b — need a ≠ 0, b integer
      const a = randInt(2, 10);
      const b = a * x;
      return {
        prompt: `${a}x = ${b}`,
        steps: [`x = ${b} ÷ ${a}`, `x = ${x}`],
        explanation: `Divide both sides by ${a}: x = ${b} ÷ ${a} = ${x}`,
      };
    }
    // x/a = b — need a ≠ 0, x divisible by a
    const a = randInt(2, 10);
    if (x === 0 || x % a !== 0) return null;
    const b = x / a;
    return {
      prompt: `x ÷ ${a} = ${b}`,
      steps: [`x = ${b} × ${a}`, `x = ${x}`],
      explanation: `Multiply both sides by ${a}: x = ${b} × ${a} = ${x}`,
    };
  }

  if (difficulty === 'medium') {
    // ax + b = c  or  ax - b = c
    const a = randInt(2, 10);
    const b = randInt(1, 15);
    const useAdd = Math.random() < 0.5;
    const c = useAdd ? a * x + b : a * x - b;
    if (!Number.isInteger(c)) return null;
    const op = useAdd ? '+' : '−';
    const bSigned = b;
    return {
      prompt: `${a}x ${op} ${bSigned} = ${c}`,
      steps: [
        `${a}x = ${c} ${useAdd ? '−' : '+'} ${bSigned}`,
        `${a}x = ${a * x}`,
        `x = ${a * x} ÷ ${a}`,
        `x = ${x}`,
      ],
      explanation: `${useAdd ? 'Subtract' : 'Add'} ${bSigned} ${useAdd ? 'from' : 'to'} both sides, then divide by ${a}: x = ${x}`,
    };
  }

  if (difficulty === 'hard') {
    // ax + b = cx + d  (a ≠ c)
    let a, b, c, d;
    let tries = 0;
    do {
      a = randInt(1, 10);
      c = randInt(1, 10);
      tries++;
    } while (a === c && tries < 50);
    if (a === c) return null;
    b = randInt(-15, 15);
    // d = ax + b - cx = (a-c)x + b
    d = (a - c) * x + b;
    if (!Number.isInteger(d)) return null;
    const bStr = b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`;
    const dStr = d >= 0 ? String(d) : String(d);
    return {
      prompt: `${a}x ${bStr} = ${c}x + ${d}`,
      steps: [
        `${a}x − ${c}x = ${d} − (${b})`,
        `${a - c}x = ${d - b}`,
        `x = ${(d - b) / (a - c)}`,
      ],
      explanation: `Move x terms to left: (${a}−${c})x = ${d}−(${b}), so ${a - c}x = ${d - b}, x = ${x}`,
    };
  }

  // expert: a(x + b) = cx + d
  const a = randInt(2, 8);
  const b = randInt(-10, 10);
  const c = randInt(1, 8);
  // a(x+b) = ax + ab; set equal to cx + d => d = ax + ab - cx = (a-c)x + ab
  if (a === c) return null; // would have no unique solution
  const ab = a * b;
  const d = (a - c) * x + ab;
  if (!Number.isInteger(d)) return null;
  const bStr = b >= 0 ? `x + ${b}` : `x − ${Math.abs(b)}`;
  return {
    prompt: `${a}(${bStr}) = ${c}x + ${d}`,
    steps: [
      `${a}x ${ab >= 0 ? '+' : '−'} ${Math.abs(ab)} = ${c}x + ${d}`,
      `${a}x − ${c}x = ${d} − ${ab}`,
      `${a - c}x = ${d - ab}`,
      `x = ${(d - ab) / (a - c)}`,
    ],
    explanation: `Expand: ${a}x ${ab >= 0 ? '+' : ''}${ab} = ${c}x + ${d}. Collect x terms: ${a - c}x = ${d - ab}, x = ${x}`,
  };
}

// ─── Round Builder ────────────────────────────────────────────────────────────

const GENERATORS = {
  arithmetic: generateArithmetic,
  fractions:  generateFraction,
  sequences:  generateSequence,
  angle:      generateAngle,
  algebra:    generateAlgebra,
};

const MIXED_TYPES = ['arithmetic', 'fractions', 'sequences', 'angle', 'algebra'];

export function buildLogicRound({ mode, difficulty = 'medium', count = 10 }) {
  const questions = [];

  for (let i = 0; i < count; i++) {
    let type;
    if (mode === 'logic-mixed') {
      type = MIXED_TYPES[randInt(0, MIXED_TYPES.length - 1)];
    } else {
      type = mode;
    }

    const generator = GENERATORS[type];
    if (!generator) {
      throw new Error(`Unknown logic mode: "${type}"`);
    }

    questions.push(generator(difficulty));
  }

  return questions;
}
