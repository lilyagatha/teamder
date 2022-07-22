import express from "express";
import formidable from "formidable";
import fs from "fs";
import { client } from "./db";
import { extractSingleFile } from "./postskill";
import { Request, Response } from "express";

export let profileRoutes = express.Router();
profileRoutes.put("/profile", editProfile);
profileRoutes.get("/profile", getProfile);
profileRoutes.get("/profile/:user_id", getTargetProfile);
profileRoutes.post("/follower/:id", follow);
profileRoutes.delete("/unfollow/:id", unfollow);
profileRoutes.get("/learn-card/:user_id", getLearnCards);
profileRoutes.get("/teach-card/:user_id", getTeachCards);

let uploadDir = "uploads";
fs.mkdirSync(uploadDir, { recursive: true });
profileRoutes.use("/uploads", express.static(uploadDir));

export type Profile = {
    // id: number
    user_id: number;
    nickname: string;
    gender: string;
    district: string;
    aboutMeContent: string | null;
    iconImage: string | null;
};


let form = formidable({
    uploadDir,
    allowEmptyFiles: false,
    maxFiles: 1,
    maxFileSize: 200 * 1024 ** 2,
    keepExtensions: true,
    filter: (part) => part.mimetype?.startsWith("image/") || false,
    
});

async function editProfile(req: Request, res: Response) {
    let user_id = req.session.user?.id || null;
    form.parse(req, async (err, fields, files) => {
        // console.log("profile put", { err, fields, files, user_id })
        if (err) {
            res.status(400).json({ error: String(err) });
            return;
        }
        let nickname = fields.nickname;
        let gender = fields.gender;
        let age = (((fields.age == null) || (fields.age == "")) ? null : +fields.age);
        console.log(age)
        let district = fields.district;
        let aboutMeContent = fields.aboutMeContent;
        //upload file
        let file = extractSingleFile(files.iconImage);

        if (typeof nickname !== "string") {
            res.status(400).json({ error: "請輸入正確的名稱" });
            return;
        }
        // if (!Number.isInteger(age) || (age != null)) {
        //     res.status(400).json({ error: "年齡請輸入數字" });
        //     return;
        // } checked by FE
        const dbIconImage = (
            await client.query(
        /*sql*/ `
            SELECT iconimage from users where id = $1`,
                [user_id]
            )
        ).rows[0].iconimage;
        // console.log('dbIconImage', dbIconImage)
        let iconImage = file?.newFilename || dbIconImage;
        const userId = await client.query(
      /*sql*/ `
        UPDATE users 
        SET nickname = $1, age = $2, gender = $3, district = $4, description = $5, iconimage = $6  
        where id = $7 
        returning id;`,
            [nickname, age, gender, district, aboutMeContent, iconImage, user_id]
        );

        if (userId) {
            res.json({ message: "save" });
        }
    });
}

async function getProfile(req: Request, res: Response) {
    // let id = +req.params.user_id
    let user_id = req.session.user?.id || null;
    console.log("user_id:", user_id);

    try {
        //   let user_id = req.session || null
        const target_user_id = user_id;
        const origin_user_id = user_id;
        const users = await client.query(
      /* sql */ `
        select id, nickname, age, gender, district, description, iconimage, username from users where id = $1`,
            [user_id]
        );

        const fansNumbers = await client.query(
      /* sql */ `
        select count(*) as count from followlists where target_user_id = $1`,
            [target_user_id]
        );
        const followingNumbers = await client.query(
      /* sql */ `
        select count(*) as count from followlists where origin_user_id = $1`,
            [origin_user_id]
        );
        res.json({
            user: users.rows[0],
            fansNumbers: fansNumbers.rows[0].count,
            followingNumbers: followingNumbers.rows[0].count,
        });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
}

async function getTargetProfile(req: Request, res: Response) {
    let user_id = +req.params.user_id || req.session.user?.id;
    console.log("user_id", user_id);
    if (!user_id) {
        res.status(400).json({ error: "Missing user_id in req.params" });
        return;
    }

    try {
        const target_user_id = +req.params.user_id;
        const origin_user_id = req.session.user?.id;
        console.log("target_user_id", target_user_id);
        console.log("origin_user_id", origin_user_id);
        const users = await client.query(
      /* sql */ `
        select nickname, age, gender, district, description, iconimage, username from users where id = $1`,
            [user_id]
        );

        const fansNumbers = await client.query(
      /* sql */ `
        select count(*) as count from followlists where target_user_id = $1`,
            [target_user_id]
        );
        const followingNumbers = await client.query(
      /* sql */ `
        select count(*) as count from followlists where origin_user_id = $1`,
            [origin_user_id]
        );

        const hasFollow = await client.query(
      /* sql */ `
        select count(*) as count from followlists where target_user_id = $1 AND origin_user_id = $2`,
            [target_user_id, origin_user_id]
        );

        res.json({
            user: users.rows[0],
            fansNumbers: fansNumbers.rows[0].count,
            followingNumbers: followingNumbers.rows[0].count,
            hasFollow: parseInt(hasFollow.rows[0].count),
            origin_user_id
        });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
}

async function follow(req: Request, res: Response) {
    let target_user_id = +req.params.id;
    let origin_user_id = req.session.user?.id;
    console.log("target_user_id", target_user_id);
    console.log("origin_user_id", origin_user_id);

    try {
        await client.query(
      /* sql */ `
        INSERT INTO followlists (origin_user_id, target_user_id) VALUES ($1, $2)`,
            [origin_user_id, target_user_id]
        );

        const fansNumbers = await client.query(
      /* sql */ `
        select count(*) as count from followlists where target_user_id = $1`,
            [target_user_id]
        );

        const followingNumbers = await client.query(
      /* sql */ `
        select count(*) as count from followlists where origin_user_id = $1`,
            [origin_user_id]
        );
        res.json({
            fansNumbers: fansNumbers.rows[0].count,
            followingNumbers: followingNumbers.rows[0].count,
        });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
}

async function unfollow(req: Request, res: Response) {
    let target_user_id = +req.params.id;
    let origin_user_id = req.session.user?.id;
    console.log("target_user_id", target_user_id);
    console.log("origin_user_id", origin_user_id);

    try {
        await client.query(
      /* sql */ `
        DELETE from followlists where target_user_id = $1 and origin_user_id = $2;`,
            [target_user_id, origin_user_id]
        );
        const fansNumbers = await client.query(
      /* sql */ `
        select count(*) as count from followlists where target_user_id = $1`,
            [target_user_id]
        );
        const followingNumbers = await client.query(
      /* sql */ `
        select count(*) as count from followlists where origin_user_id = $1`,
            [origin_user_id]
        );
        res.json({
            fansNumbers: fansNumbers.rows[0].count,
            followingNumbers: followingNumbers.rows[0].count,
        });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
}

async function getLearnCards(req: Request, res: Response) {
    // let user_id = req.session.user?.id || null;
    let user_id = +req.params.user_id || req.session.user?.id
    
    if (req.session.user?.id == null) {
        res.json({ message: 'login first!' })
        return
    }
    try {
        const learnCards = await client.query(
      /* sql */ `
        select 
        posts.id
        , title
        , category_id
        , attachment
        , created_at
        , cat_name
        , type
        from posts join categories on categories.id = posts.category_id 
        where ((creator_id = $1) AND (type = 'learn'))
        order by created_at desc
        `,
            [user_id]
        );

        // console.log('result', learnCards.rows);


        res.json({
            result: learnCards.rows
        });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
}

//而家係拎目標既teach-cards
async function getTeachCards(req: Request, res: Response) {
    // let user_id = req.session.user?.id || null;
    let user_id = +req.params.user_id || req.session.user?.id
    console.log('get cards:', user_id);
    if (+req.params.user_id == null) {
        res.json({ message: 'login first!' })
        return
    }
    try {
        const teachCards = await client.query(
      /* sql */ `
        select 
        posts.id
        , title
        , category_id
        , attachment
        , created_at
        , cat_name
        , type
        from posts join categories on categories.id = posts.category_id 
        where ((creator_id = $1) AND (type = 'teach'))
        order by created_at desc
        `,
            [user_id]
        );

        // console.log('result', teachCards.rows);


        res.json({
            result: teachCards.rows
        });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
}

