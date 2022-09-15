import React, { useState } from "react";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import  { CodecMap } from '@ckb-lumos/molecule'

const Label = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.h5,
  padding: theme.spacing(1),
  textAlign: "center",
  marginLeft: "20%",
  marginRight: "20%",
  color: theme.palette.text.secondary,
}));

type Props = {
  codecMap: CodecMap,
  onSelectCodec: (name: string) => void;
}

export const SchemaSelect: React.FC<Props> = (props) => {
  const [selected, setSelected] = useState<string>("none");
  const codecMapIterator = props.codecMap.keys()
 
  const handleChange = (event: SelectChangeEvent) => {
    const value = event.target.value as string
    setSelected(value)
    props.onSelectCodec(value);
  };
  return (
    <div>
      <Label>Choose one schema to decode:</Label>
      <br></br>
      <Select
        labelId="simple-select-label"
        id="simple-select"
        placeholder="please select one codec"
        label="Codec"
        value={selected}
        onChange={handleChange}
        style={{ display: "block", width: "60%", marginLeft: "20%" }}
      >
        <MenuItem value="none"> </MenuItem>
        {
          (() => {
            let nextCodec = codecMapIterator.next()
            let items: JSX.Element[] = []
            while(!nextCodec.done){
              const element = <MenuItem key= {nextCodec.value} value={nextCodec.value}>{nextCodec.value}</MenuItem>
              nextCodec = codecMapIterator.next()
              items.push(element)
            }
            return items
          })()
        }
      </Select>
      <br></br>
    </div>
  );
};
