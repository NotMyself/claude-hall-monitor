import { type UserPromptSubmitHookInput } from "@anthropic-ai/claude-agent-sdk";

const input = (await Bun.stdin.json()) as UserPromptSubmitHookInput;
const { cwd, prompt } = input;

const message = `The prompt was: ${prompt} in ${cwd}`;

Bun.write(".claude/hooks/prompt-log.txt", JSON.stringify(message, null, 2));
