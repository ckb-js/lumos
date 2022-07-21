import React, { useMemo, useState } from "react";
import { Box, Divider, TextField } from "@mui/material";
import { helpers, Script } from "@ckb-lumos/lumos";
import {
  parseMultiVersionAddress,
  ParseResult,
} from "./parseMultiVersionAddress";
import { MultiVersionAddress } from "./MultiVersionAddress";
import { MAINNET_CONFIG, TESTNET_CONFIG } from "@site/src/constants";
import { isErr, isMultiVersionAddress } from "@site/src/types";

export const AddressToScript: React.FC = () => {
  const [address, setAddress] = useState("");

  const parsed = useMemo<ParseResult | null>(() => {
    if (!address) return null;
    const prefix = address.substring(0, 3);

    const config = prefix === "ckb" ? MAINNET_CONFIG : TESTNET_CONFIG;

    let script: Script;
    try {
      script = helpers.parseAddress(address, { config });
    } catch {
      return { error: "Invalid address" };
    }

    return parseMultiVersionAddress(script, config);
  }, [address]);

  return (
    <Box>
      <Box mb={2}>
        <TextField
          fullWidth
          label="Address"
          variant="outlined"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          error={isErr(parsed)}
          helperText={isErr(parsed) ? parsed.error : ""}
        />
      </Box>

      {isMultiVersionAddress(parsed) && (
        <Box component={"div"} my={2}>
          <MultiVersionAddress multiVersionAddr={parsed} />
          <Box my={2}>
            <Divider />
          </Box>

          <div>Code Hash: {parsed.script.code_hash}</div>
          <div>Hash Type: {parsed.script.hash_type}</div>
          <div>Args: {parsed.script.args}</div>
        </Box>
      )}
    </Box>
  );
};
