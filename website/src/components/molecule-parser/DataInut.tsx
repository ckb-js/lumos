import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import { BytesCodec } from '@ckb-lumos/codec/lib/base';
import  { deepHexifyBI } from '@ckb-lumos/molecule/lib/utils'

const Label = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.h5,
  padding: theme.spacing(1),
  textAlign: 'center',
  marginLeft: '20%',
  marginRight: '20%',
  color: theme.palette.text.secondary,
}));
const InputArea = styled(TextareaAutosize)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body1,
  marginTop: '1rem',
  marginLeft: '20%',
  marginRight: '20%',
  width: '60%',
  color: theme.palette.text.secondary,
}));

type Props = {
  codec: BytesCodec | undefined,
}

const formatInput = (input: string): string => {
  if(!input.startsWith('0x')){
    return '0x' + input
  }
  return input
}

export const DataInput: React.FC<Props> = (props) => {
  const [inputData, setInputData] = useState<string>("")
  const [result, setResult] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("")
  const handleDecode = () => {
    if(!props.codec){
      setErrorMsg("please select codec")
      return
    }
    try {
      const result = props.codec.unpack(formatInput(inputData))
      setResult(JSON.stringify(deepHexifyBI(result)))
      setErrorMsg("")
    } catch (error: any) {
      setErrorMsg((error as Error).message)
    }
    
  }
  const handleChange = (e: any) => {
    setInputData(e.target.value)
  }
  return (
    <div>
      <Label>please input your data here:</Label>
      <br></br>
      <InputArea
        minRows={3}
        maxRows={10}
        value={inputData}
        onChange={handleChange}
        placeholder="Input data here."
      />
      <br></br>
      <Button variant="contained" style={{ margin: 'auto', display: 'block' }} onClick={handleDecode}>Decode!</Button>  
      <Paper style={{ marginLeft: '20%', marginRight: '20%'}}>{result}</Paper>
      {errorMsg && <Paper style={{ marginLeft: '20%', marginRight: '20%', color: 'red'}}>{"error: " + errorMsg}</Paper>}
    </div>
  );
}


