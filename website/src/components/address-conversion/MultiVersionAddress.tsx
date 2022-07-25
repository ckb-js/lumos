import React from "react";
import { Stack } from "@mui/material";
import { MultiVersionAddress as MultiVersionAddressType } from "../../types";

export const MultiVersionAddress: React.FC<{
  multiVersionAddr: MultiVersionAddressType;
  displayName?: boolean;
}> = ({ multiVersionAddr, displayName }) => {
  return (
    <Stack spacing={1} component={"div"}>
      {displayName && multiVersionAddr.name && (
        <div>Lock: {multiVersionAddr.name}</div>
      )}
      <div>CKB2021: {multiVersionAddr.ckb2021FullFormat}</div>
      {multiVersionAddr.ckb2019ShortFormat && (
        <div>CKB2019(short format): {multiVersionAddr.ckb2019ShortFormat}</div>
      )}
      {multiVersionAddr.ckb2019FullFormat && (
        <div>CKB2019(full format): {multiVersionAddr.ckb2019FullFormat}</div>
      )}
    </Stack>
  );
};
