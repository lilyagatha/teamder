import { client } from "./db";
import express, { Request, Response, NextFunction } from "express";
import { hashPassword } from "./hash";
import nodemailer from "nodemailer";
import { uuid } from 'uuidv4';

export let forgetPasswordRoutes = express.Router();
forgetPasswordRoutes.use(express.urlencoded({ extended: true }));
forgetPasswordRoutes.use(express.json());

forgetPasswordRoutes.get("/resetpassword/:id", loadUser);
forgetPasswordRoutes.get("/forgetpassword", passwordForget);
forgetPasswordRoutes.post("/resetpassword", passwordReset);

async function main(emailAddress: string, userid: string, token: string) {
  const hostname = "smtp.gmail.com";
  const username = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASS;

  const transporter = nodemailer.createTransport({
    host: hostname,
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: username,
      pass: password,
    },
    logger: true,
  });

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: "teamderhk@gmail.com",
    to: emailAddress,
    subject: "Teamder - 密碼重設",
    //   text: "Hello worlod?",
    html: `Hi ${userid}, 都估到你唔記得密碼啦~ 去 http://192.168.1.71:8080/resetpassword.html?id=${token} reset啦！`,
    //   headers: { 'x-myheader': 'test header' }
  });

  // http://192.168.1.71:8080/resetpassword.html?id=${token}

  console.log("Message sent: %s", info.response);
}

async function passwordForget(req: Request, res: Response) {
  // let id = +req.params.user_id
  let userId = req.query.userid;
  console.log("user_id:", userId);

  try {
    const searchUserName = await client.query(
      /* sql */ `
              SELECT id from users WHERE username=$1`,
      [userId]
    );

    if (searchUserName.rows.length > 0) {
      console.log(1);


      const generateToken = await client.query(
        /* sql */ `
        UPDATE users SET token=$1 WHERE username=$2 RETURNING token`,
        [uuid(), userId]
      );

      const getUserInfo = await client.query(
        /* sql */ `
        SELECT username, email, token from users WHERE username=$1`,
        [userId]
      );

      main(
        getUserInfo.rows[0].email,
        getUserInfo.rows[0].username,
        getUserInfo.rows[0].token
      );

      res.json(generateToken.rows[0]);
    } else {
      console.log(2);
      res.status(400).json({ error: "用戶名稱不存在" });
    }
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

async function loadUser(req: Request, res: Response) {
  let token = req.params.id;
  console.log(token)
  try {
    const result = await client.query(
      /* sql */ `
  select
  id,
  username
  from users
  where token = $1
  `,
      [token]
    );

    if (result.rows.length == 0) {
      res.status(400).json({ error: "無效操作" });
      return;
    } else{
      res.json(result.rows[0]);
    }
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

async function passwordReset(req: Request, res: Response) {
  try {
    let password = req.body.password;
    let password2 = req.body.password2;
    let token = req.query.id;

    let checkUser = await client.query(
      /* SQL */ `
              SELECT id FROM users WHERE token=$1`,
      [token]
    );

    if (checkUser.rows.length == 0) {
      res.status(400).json({ error: "無效操作" });
      return;
    }

    if (!password || typeof password != "string") {
      res.status(400).json({ error: "請輸入密碼" });
      return;
    }
    if (!password2 || typeof password2 != "string") {
      res.status(400).json({ error: "請重新輸入密碼" });
      return;
    }
    if (password != password2) {
      res.status(400).json({ error: "兩次輸入密碼不符，請重新輸入" });
      return;
    }

    const hashedPassword = await hashPassword(password);

    let result = await client.query(
      /* SQL */ `
            UPDATE users SET password=$1 WHERE token=$2`,
      [hashedPassword, token]
    );

    let deleteToken = await client.query(
      /* SQL */ `
        UPDATE users SET token=null WHERE token=$1`,
      [token]
    );

    res.json({ ok: true });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ message: "伺服器錯誤，請聯絡 Beeno" });
  }
}
