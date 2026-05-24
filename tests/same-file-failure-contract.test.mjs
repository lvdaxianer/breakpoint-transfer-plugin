import assert from "node:assert/strict";

function sameFileNeedProceedHandler(state, uniqueCode) {
  const calculationHashName = state.globalInfoMapping[uniqueCode].calculationHashName;
  const uniqueCodeValues = state.sameFileUploadStateMapping.get(calculationHashName);
  if (!uniqueCodeValues || uniqueCodeValues.length === 0) return [];

  const newUniqueCodeValues = uniqueCodeValues.filter((code) => code !== uniqueCode);
  state.sameFileUploadStateMapping.delete(calculationHashName);
  return newUniqueCodeValues.map((code) => ({ code, nextState: "QuickUpload" }));
}

function sameFileNeedFailHandler(state, uniqueCode) {
  const calculationHashName = state.globalInfoMapping[uniqueCode].calculationHashName;
  const uniqueCodeValues = state.sameFileUploadStateMapping.get(calculationHashName);
  if (!uniqueCodeValues || uniqueCodeValues.length === 0) return [];

  const waitingUniqueCodes = uniqueCodeValues.filter((code) => code !== uniqueCode);
  state.sameFileUploadStateMapping.delete(calculationHashName);
  return waitingUniqueCodes.map((code) => ({ code, nextState: "RequestError" }));
}

const state = {
  globalInfoMapping: {
    first: { calculationHashName: "hash.bin" },
    second: { calculationHashName: "hash.bin" },
  },
  sameFileUploadStateMapping: new Map([["hash.bin", ["first", "second"]]]),
};

const successFollowUp = sameFileNeedProceedHandler(state, "first");

assert.deepEqual(successFollowUp, [{ code: "second", nextState: "QuickUpload" }]);

const failureState = {
  globalInfoMapping: {
    first: { calculationHashName: "hash.bin" },
    second: { calculationHashName: "hash.bin" },
  },
  sameFileUploadStateMapping: new Map([["hash.bin", ["first", "second"]]]),
};
const failureFollowUp = sameFileNeedFailHandler(failureState, "first");

assert.deepEqual(
  failureFollowUp,
  [{ code: "second", nextState: "RequestError" }],
  "waiting same-file uploads should be released on failure as well",
);
