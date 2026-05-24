import { HTTPEnumState, ICommonResponse } from "../src/core/types";

function isMergeCompleted(response: ICommonResponse): boolean {
  return !!response.success;
}

const mergeResponseWithoutSuccess: ICommonResponse = {
  data: true,
  code: HTTPEnumState.OK,
  message: null,
};

if (!isMergeCompleted(mergeResponseWithoutSuccess)) {
  throw new Error("merge response without success flag should still be accepted");
}
