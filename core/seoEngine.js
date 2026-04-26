// core/seoEngine.js

export function analyzeKeyword(input) {
    const traffic = computeTraffic(input);
    const value = computeValue(input);
    const difficulty = computeDifficulty(input);
    const feasibility = computeFeasibility(input);

    const score = computeScore({
        traffic,
        value,
        feasibility
    });

    const decision = getDecision({ score, difficulty, value, traffic });
    const reasons = getReasoning({ traffic, difficulty, value });
    const action = getAction(decision.decision);

    return {
        score,
        traffic,
        difficulty,
        value,
        decision,
        reasons,
        action
    };
}