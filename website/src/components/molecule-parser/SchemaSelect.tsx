import React, { SyntheticEvent, useState } from "react"
import InputLabel from "@mui/material/InputLabel"
import { CodecMap } from "@ckb-lumos/molecule"
import { SectionContainer } from "./SectionContainer"
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

type Props = {
  codecMap: CodecMap,
  onSelectCodec: (name: string) => void,
  onNextStep: () => void
}

const creatCodecOptionsFromMap = (codecMap: CodecMap): string[] =>{
  return Object.keys(codecMap)
}

export const SchemaSelect: React.FC<Props> = (props) => {
  const [selected, setSelected] = useState<string | null>(null)

  const handleChange = (event: SyntheticEvent<Element, Event>, newValue: string | null) => {
    setSelected(newValue as string)
    props.onSelectCodec(newValue as string)
    props.onNextStep()
  }
  const top100Films = creatCodecOptionsFromMap(props.codecMap)
  return (
    <SectionContainer>
      <InputLabel style={{ fontSize: "20px", fontWeight: "700" }}>Input schema(mol): </InputLabel>
      <Autocomplete
      disablePortal
      id="combo-box"
      style={{ marginTop: '0.5rem'}}
      options={top100Films}
      value={selected}
      onChange={handleChange}
      sx={{ width: 300 }}
      renderInput={(params) => <TextField {...params} label="Codec" />}
    />
    </SectionContainer>
  )
}
