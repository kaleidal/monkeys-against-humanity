import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (_, res) => {
    res.send("Server’s alive ⚡");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
