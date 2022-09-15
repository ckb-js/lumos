import React, { useState } from "react";
import { DataInput } from "@site/src/components/molecule-parser/DataInut";
import { Molecule } from "@site/src/components/molecule-parser/Molecule";
import { SchemaSelect } from "@site/src/components/molecule-parser/SchemaSelect";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { CodecMap } from "@ckb-lumos/molecule";

export const MoleculeParser: React.FC = () => {
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
        <Molecule updateCodecMap={handleCodecMap} />
        <SchemaSelect codecMap={codecMap} onSelectCodec={handleSelectCodec}/>
        <DataInput codec={codecMap.get(selectedCodecName)}/>
      </Stack>
    </Box>
  );
};
