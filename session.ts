import expressSession, { Session } from "express-session";
import { GrantSession } from "grant";
import { env } from "./env";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      isAdmin?: boolean;
    };
    grant?: GrantSession;
  }
}

export let sessionMiddleware = expressSession({
  secret: env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
});
