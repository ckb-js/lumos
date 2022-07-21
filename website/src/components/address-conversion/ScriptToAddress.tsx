import React, { useMemo, useState } from "react";
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import {
  parseMultiVersionAddress,
  ParseResult,
} from "@site/src/components/address-conversion/parseMultiVersionAddress";
import { HashType } from "@ckb-lumos/base";
import { MAINNET_CONFIG, TESTNET_CONFIG } from "@site/src/constants";
import { MultiVersionAddress } from "@site/src/components/address-conversion/MultiVersionAddress";
import { isMultiVersionAddress } from "@site/src/types";

export const ScriptToAddress: React.FC = () => {
  const [codeHash, setCodeHash] = useState("");
  const [args, setArgs] = useState("");
  const [hashType, setHashType] = useState<HashType>("type");

  const parsed = useMemo<{ mainnet: ParseResult; testnet: ParseResult }>(() => {
    const mainnet = parseMultiVersionAddress(
      { code_hash: codeHash, hash_type: hashType, args },
      MAINNET_CONFIG
    );

    const testnet = parseMultiVersionAddress(
      { code_hash: codeHash, hash_type: hashType, args },
      TESTNET_CONFIG
    );

    return { mainnet, testnet };
  }, [codeHash, hashType, args]);

  return (
    <Box>
      <FormControl fullWidth>
        <TextField
          label={"Code Hash"}
          fullWidth
          value={codeHash}
          onChange={(e) => setCodeHash(e.target.value)}
        />

        <Box my={1}>
          <FormLabel id={"hash-type"}>Hash Type</FormLabel>
          <RadioGroup
            row
            aria-labelledby={"hash-type"}
            name="hashType"
            value={hashType}
            onChange={(e) => setHashType(e.target.value as HashType)}
          >
            <FormControlLabel value="type" control={<Radio />} label="type" />
            <FormControlLabel value="data" control={<Radio />} label="data" />
            <FormControlLabel value="data1" control={<Radio />} label="data1" />
          </RadioGroup>
        </Box>

        <TextField
          label={"Args"}
          fullWidth
          value={args}
          onChange={(e) => setArgs(e.target.value)}
        />
      </FormControl>

      <Box>
        <Box mt={2}>
          <h2>Mainnet</h2>
          {isMultiVersionAddress(parsed.mainnet) && (
            <MultiVersionAddress multiVersionAddr={parsed.mainnet} />
          )}
        </Box>

        <Box mt={2}>
          <h2>Testnet</h2>
          {isMultiVersionAddress(parsed.testnet) && (
            <MultiVersionAddress multiVersionAddr={parsed.testnet} />
          )}
        </Box>
      </Box>
    </Box>
  );
};
