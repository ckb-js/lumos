import express from 'express'

const app = express();

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.json());

app.post('/', (req, res) => {
  setTimeout(() => {
    console.log(req.body);
    res.send({
      "jsonrpc": "2.0",
      "result": "0x10639e0895502b5688a6be8cf69460d76541bfa4821629d86d62ba0aae3f9606",
      "id": req.body.id
    })
  }, 3000)
});


app.listen(8080)