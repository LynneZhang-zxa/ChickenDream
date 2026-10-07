import { describe, expect, it } from "vitest";
import { CREAMY_GARLIC_CHICKEN } from "./recipe";
import { newSession } from "./session";
import { buildContext, buildTools, AGENT_PROMPT, KNOWLEDGE_BASE } from "./agent-config";

describe("agent config limits", () => {
  const s = newSession(CREAMY_GARLIC_CHICKEN.id, "s", "sec");
  it("context fits the 4,000 char limit and names the current step", () => {
    const c = buildContext(CREAMY_GARLIC_CHICKEN, s);
    expect(c.length).toBeLessThanOrEqual(4000);
    expect(c).toContain("step one of nine");
  });
  it("tools are 8 or fewer with valid names and descriptions", () => {
    const tools = buildTools("https://example.com", s);
    expect(tools.length).toBeLessThanOrEqual(8);
    for (const t of tools) {
      expect(t.name).toMatch(/^[a-z][a-z0-9_-]{0,63}$/);
      expect(t.description.length).toBeLessThanOrEqual(1024);
      expect(t.url).toBe("https://example.com/api/tools");
      expect(JSON.stringify(t.parameters)).not.toContain("spoken_line");
    }
  });
  it("prompt and knowledge base have no placeholders or exclamation marks", () => {
    for (const text of [AGENT_PROMPT, KNOWLEDGE_BASE]) {
      expect(text).not.toMatch(/\{\{|\[[A-Z ]+\]/);
      expect(text).not.toContain("!");
    }
  });
});
