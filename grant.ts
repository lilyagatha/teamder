import dotenv from "dotenv";
dotenv.config();
import grant from "grant";

export const grantMiddleware = grant.express({
  defaults: {
    origin: "http://localhost:8080",
    transport: "session",
    state: true,
  },
  google: {
    key: process.env.GOOGLE_CLIENT_ID || "",
    secret: process.env.GOOGLE_CLIENT_SECRET || "",
    scope: ["profile", "email"],
    callback: "/login/google",
  },
});

// app.use(grantExpress as express.RequestHandler);
