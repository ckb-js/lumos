import React, { useState } from "react";
import { DataInput } from "@site/src/components/molecule-parser/DataInut";
import { Molecule } from "@site/src/components/molecule-parser/Molecule";
import { SchemaSelect } from "@site/src/components/molecule-parser/SchemaSelect";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { CodecMap } from "@ckb-lumos/molecule";
import { withThemed } from "@site/src/components/ThemedWrapper";
// step 1 for parse, step 2 for choose codec, step 3 for decode!
const STEP = {
  fisrt: 1,
  second: 2,
  third: 3,
}

const _MoleculeParser: React.FC = () => {
  
  const [step, setStep] = useState<number>(STEP.fisrt);
  const [codecMap, setCodecMap] = useState<CodecMap>(new Map());
  const [selectedCodecName, setSelectedCodecName] = useState<string>("");
  const handleCodecMap = (codecMap: CodecMap) => {
    setCodecMap(codecMap)
  }
  const handleSelectCodec = (name: string) => {
    setSelectedCodecName(name)
  }
  return (
    <Box sx={{ width: '100%' }}>
      <Stack spacing={2}>
        <Molecule updateCodecMap={handleCodecMap} onNextStep={() => setStep(STEP.second)}/>
        { step > 1 && <SchemaSelect codecMap={codecMap} onSelectCodec={handleSelectCodec} onNextStep={() => setStep(STEP.third)}/>}
        { step > 2 && <DataInput codec={codecMap.get(selectedCodecName)}/>}
      </Stack>
    </Box>
  );
};

export const MoleculeParser = withThemed(_MoleculeParser)