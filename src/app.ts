import express from "express";
import morgan from "morgan";
import InventoryRoutes from "./routes/InventoryRoutes";
import { errorHandler } from "./middleware/errorHandler";



const app = express();

app.use(express.json());
app.use(morgan("combined"));

app.use("/inventory", InventoryRoutes);

app.use(errorHandler);

export default app;