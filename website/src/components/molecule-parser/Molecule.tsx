import React, { useState } from "react"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import { styled } from "@mui/material/styles"
import TextareaAutosize from "@mui/material/TextareaAutosize"
import { CodecMap, createParser, createCodecMap, toMolTypeMap } from "@ckb-lumos/molecule"
import HelpIcon from "@mui/icons-material/HelpOutlineOutlined"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"
import Snackbar from "@mui/material/Snackbar"
import MuiAlert, { AlertProps } from "@mui/material/Alert"
import { defaultBlockchainMol } from "./blockchain"

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
})

const Label = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.h5,
  padding: theme.spacing(1),
  textAlign: "center",
  marginTop: "2rem",
  marginLeft: "20%",
  marginRight: "20%",
  color: theme.palette.text.secondary,
}))

const InputArea = styled(TextareaAutosize)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body1,
  marginTop: "1rem",
  marginLeft: "20%",
  marginRight: "20%",
  width: "60%",
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
      const molTypes = parser.parse(inputMol)
      const codecMap = createCodecMap(toMolTypeMap(molTypes))
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
  const handleDefaultMol = () => {
    setInputMol(defaultBlockchainMol)
  }
  return (
    <div>
      <Snackbar
        open={showAlert}
        autoHideDuration={3000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseAlert} severity={parseSuccess ? 'success' : 'error'} sx={{ width: "100%" }}>
          {parseSuccess ? 'Molecule successfully parsed! You can select a schema now.' : 'Molecule parse error! Please check input mol.'}
        </Alert>
      </Snackbar>
      <Label>please input your schemas(mol) here: </Label>
      <br></br>
      <InputArea minRows={5} maxRows={10} value={inputMol} onChange={handleChange} placeholder="Input schemas here." />
      <br></br>
      <div style={{ marginLeft: "20%", marginRight: "20%", display: "flex", justifyContent: "space-around" }}>
        <div>
          <Button variant="outlined" onClick={handleDefaultMol}>
            fill in default
          </Button>
          <Tooltip title="Click to fill in default blockchain.mol. Refer to: https://github.com/nervosnetwork/ckb/blob/5a7efe7a0b720de79ff3761dc6e8424b8d5b22ea/util/types/schemas/blockchain.mol">
            <IconButton>
              <HelpIcon color="primary" />
            </IconButton>
          </Tooltip>
        </div>
        <Button variant="contained" onClick={handleConfirm}>
          confirm
        </Button>
      </div>
    </div>
  )
}
