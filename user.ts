import express, { Request, Response, NextFunction } from "express";
import { client } from "./db";
import { hashPassword, checkPassword } from "./hash";
import fetch from "node-fetch";
import "./session";
// import formidable from "formidable";
// import fs from "fs";
import {form} from "./form"


export const userRoutes = express.Router();
userRoutes.post("/signup", createUser);
userRoutes.post("/login/password", loginPassword);
userRoutes.get("/login/google", loginGoogle);
userRoutes.post("/logout", logout);
userRoutes.get("/session", session);
userRoutes.get("/member", getMemberList)


// let uploadDir = "uploads";
// fs.mkdirSync(uploadDir, { recursive: true });
// let counter = 0;
// const form = formidable({
//     uploadDir,
//     keepExtensions: true,
//     maxFiles: 1,
//     maxFileSize: 200 * 1024 ** 2, // the default limit is 200KB
//     filter: (part) =>
//         part.mimetype?.startsWith("image/") ||
//         false,
//     filename: (originalName, originalExt, part, form) => {
//         counter++
//         let fieldName = part.name
//         let timestamp = new Date().toJSON().slice(0, 10)
//         let ext = part.mimetype?.split('/').pop()
//         return `${fieldName}-${timestamp}-${counter}.${ext}`
//     }
// });


export type User = {
    username: string;
    password: string;
    password2?: string;
};

export type GoogleProfile = {
    email: string;
    picture: string;
};

function translateGender(input: string) {
    switch (input) {
        case "男":
            return "M"
        case "女":
            return "F"
        case "不顯示":
            return "U"
        default:
            return input;
    }
}


async function createUser(req: Request, res: Response) {
    form.parse(req, async (err, fields, files: any) => {
        if (err) {
            res.status(400).json({ error: String(err) })
            return
        }
        //  console.log('fields:',fields, 'files:', files)

        try {
            //check missing values
            const { username, password, password2, email} = fields;
            // console.log(req.body);
            if (!username || typeof username != "string") {
                res.status(400).json({ error: "用戶名稱不能為空" });
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
            if (!email) {
                res.status(400).json({ error: "靖輸入電郵" });
                return;
            }

            //check duplicated users
            const duplicatedUsernameCount = await client.query(
      /* SQL */ `
        SELECT COUNT(*) as count FROM users WHERE username = $1`,
                [username]
            );
            let result;
            if (duplicatedUsernameCount.rows[0]["count"] != 0) {
                res.status(400).json({ error: "用戶名稱以被使用" });
                return;
            } else {
                // console.log(files.iconimage.newFilename)
                console.log(files);
                const hashedPassword = await hashPassword(password);
                let profilePic = files.iconimage?.newFilename || null;
                result = await client.query(
        /* SQL */ `
            INSERT INTO users (username, password, nickname, age, district, gender, iconimage, email) VALUES ($1,$2, $3, $4, $5, $6, $7, $8) returning id`,
                    [username, hashedPassword, fields.nickname, fields.age || null, fields.district, translateGender(fields.gender as string), profilePic, fields.email]
                );
                let id = result.rows[0]["id"];
                let isAdmin = result.rows[0]["is_admin"]
                req.session.user = {
                    id,
                    username,
                    isAdmin
                };
                console.log("session:", req.session);
                res.json({ id, username , isAdmin});

            }
        } catch (error: any) {
            console.error(error.message);
            res.status(500).json({ message: "伺服器錯誤，請聯絡 Beeno" });
        }
    });
}

async function loginPassword(req: Request, res: Response) {
    try {
        const { username, password } = req.body;
        //check if missing values
        if (!username) {
            res.status(400).json({ error: "用戶名稱不能為空" });
            return;
        }
        if (!password) {
            res.status(400).json({ error: "請輸入密碼" });
            return;
        }
        //check if password is matched
        const user = (
            await client.query(
        /* SQL */ `
        SELECT * FROM users WHERE username = $1
        `,
                [username]
            )
        ).rows[0];
        if (!user) {
            res.status(400).json({ error: "用戶帳號或密碼錯誤" });
            return;
        }
        const match = await checkPassword(password, user.password);
        if (!match) {
            res.status(400).json({ error: "用戶帳號或密碼錯誤" });
            return;
        }
        let id = user.id;
        let isAdmin = user.is_admin;

        req.session.user = {
            id,
            username,
            isAdmin,
        };

        res.json({ id, username });
    } catch (error: any) {
        res.status(500).json({ message: "伺服器錯誤，請聯絡 Beeno" });
    }
}

async function loginGoogle(req: Request, res: Response) {
    // 檢查是否有 token 返回，如否，Google 登入失敗
    let access_token = req.session?.grant?.response?.access_token;
    if (!access_token) {
        res.status(400).json({ error: "missing access_token in grant session" });
        return;
    }

    let profile: GoogleProfile;
    try {
        let googleRes = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo`,
            {
                method: "GET",
                headers: { Authorization: "Bearer " + access_token },
            }
        );
        profile = await googleRes.json();
    } catch (error) {
        res.status(502).json({ error: "Failed to get user info from Google" });
        return;
    }
    //檢查資料庫有冇果個 profile 既 email 資料，如果冇就自動登記 ＝＞ 會員
    try {
        // try to lookup existing users
        let result = await client.query(
      /* sql */ `
select * from users
where username = $1
`,
            [profile.email]
        );
        let user = result.rows[0];

        // auto register if this is a new user
        if (!user) {
            result = await client.query(
        /* sql */ `
insert into users
(username, email) values ($1, $1)
returning id
`,
                [profile.email]
            );
            user = result.rows[0];
        }

        let id = user.id;
        let isAdmin = user.is_admin;
        req.session.user = {
            id,
            username: profile.email,
            isAdmin,
        };
        // res.json({ id })
        console.log(profile);
        console.log(`Login success with Google, id: ${id}, username: ${profile.email}`);
        res.redirect("/");
    } catch (error) {
        res.status(500).json({ error: "Database Error: " + String(error) });
    }
}

async function logout(req: Request, res: Response) {
    console.log('just before logout:', req.session);
    req.session.destroy((error) => {
        if (error) {
            console.error("failed to destroy session:", error);
        }
        console.log('Session destroyed: Logged out, redirect to "/"');
        return res.redirect("/");
        // return
    });
}

async function session(req: Request, res: Response) {
    if (req.session?.user) {
        console.log('/session:',req.session);
        res.json(req.session.user);
        return
    } else {
        res.json({ id: null });
        return
    }
}


async function getMemberList(req: Request, res: Response) {

    try {
        let memberList = await client.query(
            /* SQL */`
    select id,
    '<tr><td>' 
    || string_agg(concat_ws('</td><td>','<button class="admin">OP</button><button class="member">M</button> ',id, COALESCE(is_admin, '0'), COALESCE(username, '0'), COALESCE(nickname, '0'), COALESCE(age,'0'), COALESCE(gender,'0'), COALESCE(district,'0'), COALESCE(join_date,'1900-1-1 00:00:00')), '</td></tr><tr><td>')
    || '</td></tr>' html
    from users
    group by id
    order by 1;
            `)
        res.json({ memberList })
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
}

userRoutes.put("/role/admin/:id", giveAdminRole)
async function giveAdminRole(req: Request, res: Response) {
    try {
        await client.query(
            /* SQL */`
            UPDATE users SET is_admin = true WHERE id = $1
            `, [req.params.id]
        )
        console.log('give admin:', req.params);
        res.json()
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
}

userRoutes.put("/role/member/:id", removeAdminRole)

async function removeAdminRole(req: Request, res: Response) {
    try {
        await client.query(
            /* SQL */`
            UPDATE users SET is_admin = false WHERE id = $1
            `, [req.params.id]
        )
        console.log('remove admin role:', req.params);
        res.status(200).json();
        // res.redirect('/admin/member.html') not work / blocking 
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
}


// userRoutes.get("/abc", abc)

// async function abc(req: Request, res: Response) {
//     try {
        
//         res.redirect('/')
//     } catch (error) {
//         res.status(500).json({ error: String(error) });
//     }
// }