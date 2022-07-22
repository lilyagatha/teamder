import express from "express"
import formidable from "formidable";
import { extractSingleFile } from "./postskill";
import { Request, Response } from "express";
import fs from "fs";
import { client } from "./db";
import { io } from "./io";




export let chatRoomRoutes = express.Router();

let chatRoomUpload = "chatRoomUpload";
fs.mkdirSync(chatRoomUpload, { recursive: true });
chatRoomRoutes.use("/chatRoomUpload", express.static(chatRoomUpload));
let form = formidable({
    uploadDir: chatRoomUpload,
    allowEmptyFiles: false,
    maxFiles: 1,
    maxFileSize: 200 * 1024 ** 2,
    keepExtensions: true,
    filter: (part) => part.mimetype?.startsWith("image/") || false,
});


chatRoomRoutes.get("/chatRoom/:id", getRecord)
chatRoomRoutes.post("/sendMessage/:id", sendMessage)





async function getRecord(req: Request, res: Response) {
    const login_id = req.session.user?.id;
    //bug
    const target_id = +req.params.id;
    console.log('login_id', login_id)
    console.log('target_id', target_id)

    try {
        //if in blocked list , cannot read the chat records with this contact
        const blockList = (await client.query(
            /*sql*/`
            select 
            target_user_id,
            username
            from blocklists join users on target_user_id = users.id where origin_user_id = $1
`,
            [login_id])).rows
        console.log('blockList', blockList);
        for (let blockedContact of blockList) {
            if (target_id == blockedContact.target_user_id) {
                return
            }

        }

        const target_user = (await client.query(
            /*sql*/`
            select 
            nickname,
            username,
            id
            from users where id = $1 `,
            [target_id]
        )).rows[0];
        const login_user = (await client.query(
            /*sql*/`
            select 
            nickname,
            username,
            id
            from users where id = $1 `,
            [login_id]
        )).rows[0];
        const messages = (await client.query(
            /*sql*/`
            select 
            sender_id,
            receiver_id,
            messages,
            created_at
            from chat_room_records
            where (chat_room_records.sender_id = $1 and chat_room_records.receiver_id = $2)
            or (chat_room_records.sender_id = $2 and chat_room_records.receiver_id = $1)
            order by created_at asc
            `,

            [login_id, target_id]
        )).rows;

        res.json({ messages, target_user, login_user })


    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
}

async function sendMessage(req: Request, res: Response) {
    try {

        const sender_id = +req.session.user?.id!;
        if (!sender_id) {
            res.status(400).json({ error: "please login" });
            return
        }
        const receiver_id = +req.params.id;
        if (!receiver_id) {
            res.status(400).json({ error: "missing receiver_id" });
            return
        }
        form.parse(req, async (err, fields, files) => {
            // console.log("profile put", { err, fields, files, user_id })
            if (err) {
                res.status(400).json({ error: String(err) });
                return;
            }
            const messages = fields.inputField;
            console.log({ messages, sender_id, receiver_id })

            await client.query(
            /*sql*/ `
             INSERT INTO chat_room_records(sender_id,receiver_id,messages) VALUES ($1,$2,$3);`,
                [sender_id, receiver_id, messages]
            );
            res.json({});
            let room = sender_id < receiver_id ? sender_id + ':' + receiver_id : receiver_id + ':' + sender_id
            io.to(room).emit('new message', { messages, sender_id, receiver_id })

        })

    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
}

