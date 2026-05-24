import { HTTPEnumState, ICommonResponse } from "../src/core/types";

function acceptResponse(response: ICommonResponse<boolean>) {
  return response;
}

const backendSuccessResponse = acceptResponse({
  success: true,
  data: true,
  code: HTTPEnumState.OK,
  message: null,
});

if (backendSuccessResponse.code !== HTTPEnumState.OK) {
  throw new Error("response contract mismatch");
}
