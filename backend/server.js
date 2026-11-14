
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const contactRoutes = require("./routes/contactRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/contacts", contactRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "CenDeli Backend đang hoạt động!"
    });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`CenDeli Backend: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Không thể khởi động Backend:", error.message);
        process.exit(1);
    }
}

startServer();
