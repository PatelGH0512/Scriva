export type SkillId =
  | "devilsAdvocate"
  | "connectTheDots"
  | "firstPrinciples"
  | "makeItAStory"
  | "whatsMissing";

export interface SkillPayload {
  userMessage: string;
  systemInjection: string;
}

export const SKILL_NAMES: Record<SkillId, string> = {
  devilsAdvocate: "Devil's Advocate",
  connectTheDots: "Connect the Dots",
  firstPrinciples: "First Principles",
  makeItAStory: "Make it a Story",
  whatsMissing: "What's Missing",
};

export const SKILL_ORDER: SkillId[] = [
  "devilsAdvocate",
  "connectTheDots",
  "firstPrinciples",
  "makeItAStory",
  "whatsMissing",
];

export const SKILL_DESCRIPTIONS: Record<SkillId, string> = {
  devilsAdvocate: "Challenge the core assumption",
  connectTheDots: "Find a cross-domain analogy",
  firstPrinciples: "Strip down to bedrock truth",
  makeItAStory: "Turn it into a human narrative",
  whatsMissing: "Name the absent dimension",
};

export const SKILL_PROMPTS: Record<SkillId, (text: string) => SkillPayload> = {
  devilsAdvocate: (text) => ({
    userMessage: `[Devil's Advocate] ${text}`,
    systemInjection: `The user has selected a piece of their notes and wants it challenged. Identify the single strongest assumption embedded in the following and argue against it directly and specifically. Be sharp, not exhaustive. One focused challenge, not a list. Do not be agreeable. Your job is to stress-test this idea.`,
  }),

  connectTheDots: (text) => ({
    userMessage: `[Connect the Dots] ${text}`,
    systemInjection: `The user wants a cross-domain parallel for their idea. Find one compelling analogy from a completely different field — biology, history, physics, military strategy, philosophy, architecture. The parallel should genuinely illuminate something new about their idea, not just sound clever. Explain the mapping clearly.`,
  }),

  firstPrinciples: (text) => ({
    userMessage: `[First Principles] ${text}`,
    systemInjection: `Strip the following down to its most fundamental truth using first principles thinking. Ask why repeatedly until you reach the bedrock assumption that cannot be reduced further. Identify what the entire idea rests on. Be direct and precise.`,
  }),

  makeItAStory: (text) => ({
    userMessage: `[Make it a Story] ${text}`,
    systemInjection: `Turn the following into a brief human narrative. Create a character who experiences exactly the situation, problem, or idea described. Show the moment of decision and its consequence. Keep it under 150 words. The story should make the idea viscerally real and immediately communicable to someone who has never thought about it before.`,
  }),

  whatsMissing: (text) => ({
    userMessage: `[What's Missing] ${text}`,
    systemInjection: `Read the following and identify the single most important dimension that is completely absent from this thinking. Not a weakness in what is there — a gap in what was never considered. Look for missing time dimension, human element, financial reality, second-order effects, competitive response, or the edge case that breaks everything. Name it specifically and explain why it matters.`,
  }),
};

const SKILL_MESSAGE_PATTERN =
  /^\[(Devil's Advocate|Connect the Dots|First Principles|Make it a Story|What's Missing)\] ([\s\S]*)$/;

export function parseSkillMessage(
  content: string,
): { skillName: string; selectedText: string } | null {
  const match = content.match(SKILL_MESSAGE_PATTERN);
  if (!match) return null;
  return { skillName: match[1], selectedText: match[2] };
}
