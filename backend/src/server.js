require("dotenv").config();
const app = require("./app");
const { testConnection } = require("./config/db");

const port = Number(process.env.PORT || 5000);

const bootstrap = async () => {
  try {
    await testConnection();
    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
};

bootstrap();
