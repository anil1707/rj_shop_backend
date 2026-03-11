
import app from "./index.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;
// console.log("Port: ", process.env)

app.listen(PORT, (error) => {
    if(error){
        console.log("Error: ", error);
        return
    }
  console.log(`🚀 Server running on port ${PORT}`);
});