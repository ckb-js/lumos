import React, { useState } from "react"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import InputLabel from "@mui/material/InputLabel"
import { styled } from "@mui/material/styles"
import TextareaAutosize from "@mui/material/TextareaAutosize"
import { BytesCodec } from "@ckb-lumos/codec"
import { SectionContainer } from "./SectionContainer"
import { JSONTree } from "react-json-tree"

export type UnpackType =
  | string
  | number
  | undefined
  | { [property: string]: UnpackType }
  | UnpackType[];

const InputArea = styled(TextareaAutosize)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body1,
  width: "100%",
  marginTop: "0.5rem",
  color: theme.palette.text.secondary,
}))

type Props = {
  codec: BytesCodec | undefined
}

const formatInput = (input: string): string => {
  if (!input.startsWith("0x")) {
    return "0x" + input
  }
  return input
}

const isBlank = (data: UnpackType): boolean => {
  if (!data) {
    return true
  }
  return false
}

export const DataInput: React.FC<Props> = (props) => {
  const [inputData, setInputData] = useState<string>("")
  const [result, setResult] = useState<UnpackType>(undefined)
  const [errorMsg, setErrorMsg] = useState<string>("")
  const handleDecode = () => {
    if (!props.codec) {
      setErrorMsg("please select codec")
      return
    }
    try {
      const result = props.codec.unpack(formatInput(inputData))
      setResult(result)
      setErrorMsg("")
    } catch (error: unknown) {
      setResult(undefined)
      setErrorMsg((error as Error).message)
    }
  }
  const handleChange = (e: any) => {
    setInputData(e.target.value)
  }
  return (
    <SectionContainer>
      <InputLabel style={{ fontSize: "20px", fontWeight: "700" }}>Input data: </InputLabel>
      <InputArea minRows={3} maxRows={10} value={inputData} onChange={handleChange} placeholder="0x..." />
      <Button
        variant="contained"
        style={{ margin: "auto", display: "block", marginBottom: "0.5rem" }}
        onClick={handleDecode}
      >
        Decode!
      </Button>
      {!isBlank(result) && (
        <Paper>
          {typeof result === "object" ? (
            <JSONTree data={result} shouldExpandNode={() => true} hideRoot={true} />
          ) : (
            result
          )}
        </Paper>
      )}
      {errorMsg && <Paper style={{ color: "red" }}>{"error: " + errorMsg}</Paper>}
    </SectionContainer>
  )
}
