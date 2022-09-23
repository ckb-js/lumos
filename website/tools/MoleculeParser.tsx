import React, { useState } from "react"
import { DataInput } from "@site/src/components/molecule-parser/DataInut"
import { Molecule } from "@site/src/components/molecule-parser/Molecule"
import { SchemaSelect } from "@site/src/components/molecule-parser/SchemaSelect"
import Stack from "@mui/material/Stack"
import Box from "@mui/material/Box"
import { CodecMap } from "@ckb-lumos/molecule"
import { withThemed } from "@site/src/components/ThemedWrapper"

const STEP = {
  // step 1 for parse schema
  fisrt: 1,
  // step 2 for choose codec
  second: 2,
  // step 3 for decode!
  third: 3,
}

const _MoleculeParser: React.FC = () => {
  const [step, setStep] = useState<number>(STEP.fisrt)
  const [codecMap, setCodecMap] = useState<CodecMap>({})
  const [selectedCodecName, setSelectedCodecName] = useState<string>("")
  const handleCodecMap = (codecMap: CodecMap) => {
    setCodecMap(codecMap)
  }
  const handleSelectCodec = (name: string) => {
    setSelectedCodecName(name)
  }
  return (
    <Box sx={{ width: "100%" }}>
      <Stack spacing={2}>
        <Molecule updateCodecMap={handleCodecMap} onNextStep={() => setStep(STEP.second)} />
        {step > STEP.fisrt && (
          <SchemaSelect codecMap={codecMap} onSelectCodec={handleSelectCodec} onNextStep={() => setStep(STEP.third)} />
        )}
        {step > STEP.second && <DataInput codec={codecMap[selectedCodecName]} />}
      </Stack>
    </Box>
  )
}

export const MoleculeParser = withThemed(_MoleculeParser)
