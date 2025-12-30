import express, { urlencoded } from "express"
import "dotenv/config"
import router from "./routes/index.route";
import cors from "cors";
import { initSocket } from "./socket/socket";
import http from "http";

// import { upload } from "./middleware/upload";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));


app.use("/api/v1", router);

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, ()=>{
    console.log(`Server is running at ${PORT}`);
})