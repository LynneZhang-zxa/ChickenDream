import { describe, expect, it } from "vitest";
import { CREAMY_GARLIC_CHICKEN, describeIngredient, formatAmount, spokenAmount } from "./recipe";
import {
  cancelTimer,
  currentStep,
  goToSleep,
  jumpToStep,
  newSession,
  nextStep,
  noteSubstitution,
  previousStep,
  setServings,
  startTimer,
} from "./session";

const T0 = 1_000_000;
const fresh = () => newSession(CREAMY_GARLIC_CHICKEN.id, "s1", "secret", T0);
const total = CREAMY_GARLIC_CHICKEN.steps.length;

describe("steps", () => {
  it("starts on step one", () => {
    const { result } = currentStep(fresh());
    expect(result.stepNumber).toBe(1);
    expect(result.spoken).toContain("Step one of");
    expect(result.spoken).toContain(CREAMY_GARLIC_CHICKEN.steps[0].instruction);
  });

  it("advances and finishes", () => {
    let s = fresh();
    for (let i = 1; i < total; i++) {
      const t = nextStep(s, T0 + i);
      s = t.state;
      expect(t.result.stepNumber).toBe(i + 1);
      expect(s.status).toBe("cooking");
    }
    const done = nextStep(s, T0 + 100);
    expect(done.state.status).toBe("finished");
    expect(done.result.finished).toBe(true);
    expect(done.result.spoken).toContain("finished");
    const again = nextStep(done.state);
    expect(again.state).toBe(done.state);
    expect(again.result.spoken).toContain("already done");
  });

  it("will not go before the first step", () => {
    const t = previousStep(fresh());
    expect(t.state.stepIndex).toBe(0);
    expect(t.result.spoken).toContain("already on the first step");
  });

  it("goes back from finished to the last step", () => {
    let s = fresh();
    for (let i = 0; i < total; i++) s = nextStep(s).state;
    const t = previousStep(s);
    expect(t.state.stepIndex).toBe(total - 1);
    expect(t.state.status).toBe("cooking");
  });

  it("jumps within range and refuses out of range", () => {
    const ok = jumpToStep(fresh(), 3);
    expect(ok.state.stepIndex).toBe(2);
    const bad = jumpToStep(fresh(), 42);
    expect(bad.state.stepIndex).toBe(0);
    expect(bad.result.spoken).toContain("no step");
  });
});

describe("servings and amounts", () => {
  it("scales amounts to the nearest quarter", () => {
    const s = setServings(fresh(), 4).state;
    expect(s.servings).toBe(4);
    const cream = CREAMY_GARLIC_CHICKEN.ingredients.find((i) => i.name === "heavy cream")!;
    expect(describeIngredient(cream, 2, 4, "screen")).toBe("2 cups heavy cream");
    expect(describeIngredient(cream, 2, 3, "spoken")).toBe("one and a half cups heavy cream");
  });

  it("formats fractions for screen and voice", () => {
    expect(formatAmount(0.5, "cup")).toBe("½ cup");
    expect(formatAmount(2, "tablespoon")).toBe("2 tablespoons");
    expect(spokenAmount(0.5, "cup")).toBe("half a cup");
    expect(spokenAmount(0.25, "teaspoon")).toBe("a quarter of a teaspoon");
    expect(spokenAmount(6, "clove")).toBe("six cloves");
  });

  it("rejects silly servings", () => {
    const t = setServings(fresh(), 50);
    expect(t.state.servings).toBe(2);
  });
});

describe("timers and substitutions", () => {
  it("starts a timer with the step default when no length is given", () => {
    let s = fresh();
    s = jumpToStep(s, 4).state; // sear, 300s
    const t = startTimer(s, undefined, undefined, "t1", T0);
    expect(t.state.timers[0].seconds).toBe(300);
    expect(t.state.timers[0].endsAt).toBe(T0 + 300_000);
    expect(t.result.spoken).toContain("five minutes");
  });

  it("cancels the matching timer", () => {
    let s = startTimer(fresh(), "garlic", 45, "t1", T0).state;
    s = startTimer(s, "pasta", 600, "t2", T0).state;
    const t = cancelTimer(s, "garlic");
    expect(t.state.timers.find((x) => x.id === "t1")!.status).toBe("cancelled");
    expect(t.state.timers.find((x) => x.id === "t2")!.status).toBe("running");
  });

  it("records a substitution once per ingredient", () => {
    let s = noteSubstitution(fresh(), "heavy cream", "half and half").state;
    s = noteSubstitution(s, "Heavy Cream", "whole milk and butter").state;
    expect(s.substitutions).toHaveLength(1);
    expect(s.substitutions[0].substitute).toBe("whole milk and butter");
  });

  it("sleep sets a voice command", () => {
    const t = goToSleep(fresh(), T0 + 5);
    expect(t.state.voiceCommand).toEqual({ name: "sleep", at: T0 + 5 });
  });
});
