import React, { useState } from "react"
import Button from "@mui/material/Button"
import InputLabel from "@mui/material/InputLabel"
import { styled } from "@mui/material/styles"
import TextareaAutosize from "@mui/material/TextareaAutosize"
import { CodecMap, createParser, createCodecMap } from "@ckb-lumos/molecule"
import Snackbar from "@mui/material/Snackbar"
import MuiAlert, { AlertProps } from "@mui/material/Alert"
import { SectionContainer } from "./SectionContainer"
import { primitiveSchema } from "@site/src/constants/primitiveSchema"
import { builtinCodecs, mergeBuiltinCodecs } from "@site/src/constants/builtinCodecs"

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

const InputArea = styled(TextareaAutosize)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body1,
  width: "100%",
  marginTop: "0.5rem",
  color: theme.palette.text.secondary,
}))

type Props = {
  updateCodecMap: (token: CodecMap) => void
}

export const Molecule: React.FC<Props> = (props) => {
  const [showAlert, setShowAlert] = React.useState(false)
  const [inputMol, setInputMol] = useState("")
  const [parseSuccess, setParseSuccess] = useState(false)
  const handleCloseAlert = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return
    }
    setShowAlert(false)
  }

  const handleConfirm = () => {
    const parser = createParser()
    try {
      // get user input schema, and append with primitive schema
      const userMolTypes = parser.parse(primitiveSchema + inputMol, { skipDependenciesCheck: true })
      
      // get user input codecs(including primitive codedcs), and append with builtin codecs
      const userCodecMap = createCodecMap(userMolTypes, builtinCodecs)
      const codecMap = mergeBuiltinCodecs(userCodecMap)
      
      setParseSuccess(true)
      setShowAlert(true)
      props.updateCodecMap(codecMap)
    } catch (error: any) {
      setParseSuccess(false)
      setShowAlert(true)
    }
  }
  const handleChange = (e: any) => {
    setInputMol(e.target.value)
  }

  return (
    <SectionContainer>
      <Snackbar
        open={showAlert}
        autoHideDuration={3000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseAlert} severity={parseSuccess ? "success" : "error"} sx={{ width: "100%" }}>
          {parseSuccess
            ? "Molecule successfully parsed! You can select a schema now."
            : "Molecule parse error! Please check input mol."}
        </Alert>
      </Snackbar>
      <InputLabel style={{ fontSize: "20px", fontWeight: "700" }}>Input schema(mol): </InputLabel>
      <InputArea
        minRows={5}
        maxRows={10}
        value={inputMol}
        onChange={handleChange}
        placeholder="eg: vector String <byte>;..."
      />
      <div style={{ marginLeft: "20%", marginRight: "20%", display: "flex", justifyContent: "space-around" }}>
        <Button variant="contained" onClick={handleConfirm}>
          Parse!
        </Button>
      </div>
    </SectionContainer>
  )
}
