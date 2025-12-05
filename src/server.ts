import express, { urlencoded } from "express"
import "dotenv/config"
import router from "./routes/index.route";
import cors from "cors";

const PORT = process.env.PORT;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded())

app.use("/api/v1", router);

app.listen(PORT, ()=>{
    console.log(`Server is running at ${PORT}`);
})