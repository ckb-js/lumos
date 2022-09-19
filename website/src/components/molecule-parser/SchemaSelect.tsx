import React, { useState } from "react"
import InputLabel from "@mui/material/InputLabel"
import Select, { SelectChangeEvent } from "@mui/material/Select"
import MenuItem from "@mui/material/MenuItem"
import { CodecMap } from "@ckb-lumos/molecule"
import { SectionContainer } from "./SectionContainer"

type Props = {
  codecMap: CodecMap
  onSelectCodec: (name: string) => void
}

export const SchemaSelect: React.FC<Props> = (props) => {
  const [selected, setSelected] = useState<string>("none")
  const codecMapIterator = props.codecMap.keys()

  const handleChange = (event: SelectChangeEvent) => {
    const value = event.target.value as string
    setSelected(value)
    props.onSelectCodec(value)
  }
  return (
    <SectionContainer>
      <InputLabel style={{ fontSize: "20px", fontWeight: "700" }}>Input schema(mol): </InputLabel>
      <Select
        labelId="simple-select-label"
        id="simple-select"
        placeholder="please select one codec"
        label="Codec"
        value={selected}
        onChange={handleChange}
        style={{ display: "block", width: "60%", marginLeft: "20%", marginTop: "0.5rem" }}
      >
        <MenuItem value="none"> </MenuItem>
        {(() => {
          let nextCodec = codecMapIterator.next()
          let items: JSX.Element[] = []
          while (!nextCodec.done) {
            const element = (
              <MenuItem key={nextCodec.value} value={nextCodec.value}>
                {nextCodec.value}
              </MenuItem>
            )
            nextCodec = codecMapIterator.next()
            items.push(element)
          }
          return items
        })()}
      </Select>
      <br></br>
    </SectionContainer>
  )
}
