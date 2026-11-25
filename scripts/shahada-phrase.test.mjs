import test from "node:test";
import assert from "node:assert/strict";
import {recognizeCompleteShahada} from "../lib/shahada-phrase.ts";

test("Arabic full Shahada and Arabic vowel marks", () => {
  assert.equal(recognizeCompleteShahada("أشهد أن لا إله إلا الله وأشهد أن محمدا رسول الله"), "ar");
  assert.equal(recognizeCompleteShahada("أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللَّهِ"), "ar");
});
test("English full declaration and common ASR variations", () => {
  assert.equal(recognizeCompleteShahada("I bear witness that there is no deity worthy of worship except Allah and I bear witness that Muhammad is the Messenger of Allah"), "en");
  assert.equal(recognizeCompleteShahada("I testify there is no God but Allah and I testify Mohammed is the prophet of Allah"), "en");
});
test("Do not accept fragments or mere name mentions", () => {
  for (const s of ["Allah Muhammad", "اشهد ان لا اله الا الله", "محمد رسول الله",
    "I bear witness there is no God but Allah", "I heard Muhammad is the messenger of Allah",
    "I bear witness that Muhammad is the messenger of Allah", ""]) {
    assert.equal(recognizeCompleteShahada(s), null, s);
  }
});
