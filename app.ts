import express from "express";
import type { Request, Response } from "express";
import { resolve, join } from "path";
import pg from "pg";
import dotenv from "dotenv";
import { profileRoutes } from "./profile";
import { postsRoutes } from "./postskill";
import { cardsRoutes } from "./cards";
import { matchRoutes } from "./match";
import { isAdmin } from "./guards";
import { sessionMiddleware } from "./session";
import { grantMiddleware } from "./grant";
// import 'hammerjs';

import { chatRoomRoutes } from "./chatRoom"
dotenv.config();

// export const client = new pg.Client({
//   database: process.env.DB_NAME,
//   user: process.env.DB_USERNAME,
//   password: process.env.DB_PASSWORD,
// });
// client.connect();
import { userRoutes } from "./user";
import { client } from "./db";
import { contactListRoutes } from "./contactList";
import { forgetPasswordRoutes } from "./forgetpassword";

export let app = express();

app.use(sessionMiddleware);

app.use(grantMiddleware);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/test", (req: Request, res: Response) => {
  res.end("Hello world! Neo");
});

app.post("/test", (req: Request, res: Response) => {
  res.json({ body: req.body });
});

app.use(express.static("public"));
app.use(express.static("asset"));
app.use('/admin',isAdmin, express.static('admin'))

app.use(userRoutes);
app.use(profileRoutes);
app.use(postsRoutes);
app.use(cardsRoutes);
app.use(matchRoutes);
app.use(chatRoomRoutes)
app.use(contactListRoutes)
app.use(forgetPasswordRoutes)

app.use((_, res) => {
  res.sendFile(resolve(join("public", "404.html")));
});

// const PORT = 8080;
// app.listen(PORT, () => {
//   console.log(`listening to localhost:${PORT}`);
// });
