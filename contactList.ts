import express from "express";
import { Request, Response } from "express";
import { client } from "./db";


export let contactListRoutes = express.Router();

contactListRoutes.get('/contactList', getContactList)
contactListRoutes.get('/blockList', getBlockList)
contactListRoutes.get('/fansList', getFansList)
contactListRoutes.get('/followerList', getFollowerList)


async function getFollowerList(req: Request, res: Response) {
    let user_id = req.session.user?.id || null;
    if (!user_id) {
        res.status(400).json({ error: "Missing user_id" });
        return;
    }
    try {
        const followerLists = await client.query(
                /*sql*/`
                select 
                target_user_id ,
                username
                from followlists join users on target_user_id = users.id where origin_user_id = $1;
            
    `,
            [user_id])


        res.json({ followerLists })
    } catch (e) {
        res.status(500).json({ error: String(e) });

    }

}

async function getFansList(req: Request, res: Response) {
    let user_id = req.session.user?.id || null;
    if (!user_id) {
        res.status(400).json({ error: "Missing user_id" });
        return;
    }
    try {
        const fansLists = await client.query(
                /*sql*/`
                select 
                origin_user_id,
                username
                from followlists join users on origin_user_id = users.id where target_user_id = $1;
            
    `,
            [user_id])


        res.json({ fansLists })
    } catch (e) {
        res.status(500).json({ error: String(e) });

    }

}


async function getContactList(req: Request, res: Response) {
    let user_id = req.session.user?.id || null;
    if (!user_id) {
        res.status(400).json({ error: "Missing user_id" });
        return;
    }
    try {

        const contactList = await client.query(
            /*sql*/`
            select 
            t1.id as record_id,
            messages,
            sender_id,
            username,
            iconimage
            from (select max(id) as id
            from chat_room_records where receiver_id = $1 group by sender_id) as t1 
            join chat_room_records as crr on t1.id = crr.id 
            join users on crr.sender_id = users.id
            order by record_id desc;
`,
            [user_id])
        const blockList = await client.query(
                /* sql */ `
                select 
                target_user_id,
                username
                from blocklists join users on target_user_id = users.id where origin_user_id = $1
                      `,
            [user_id]
        );

        res.json({ contactList, blockList })

    }

    catch (e) {
        res.status(500).json({ error: String(e) });

    }
}

async function getBlockList(req: Request, res: Response) {
    let user_id = req.session.user?.id || null;

    if (!user_id) {
        res.status(400).json({ error: "Missing user_id" });
        return;
    }
    try {
        const blockLists = await client.query(
            /*sql*/`
            select 
            target_user_id,
            username
            from blocklists join users on target_user_id = users.id where origin_user_id = $1
`,
            [user_id])



        res.json({ blockLists })

    }

    catch (e) {
        res.status(500).json({ error: String(e) });

    }
}
contactListRoutes.delete('/deleteContact/:id', async (req, res) => {
    let user_id = req.session.user?.id;
    let contact_id = +req.params.id

    if (!user_id) {
        res.status(400).json({ error: "Missing user_id" });
        return;
    }
    try {
        await client.query(
            /*sql*/`
            DELETE FROM chat_room_records 
            where chat_room_records.receiver_id = $1 and chat_room_records.sender_id = $2 
`,
            [user_id, contact_id])
        await client.query(
                /*sql*/`
                DELETE FROM chat_room_records 
                where chat_room_records.receiver_id = $2 and chat_room_records.sender_id = $1 
    `,
            [user_id, contact_id])
    }
    catch (e) {
        res.status(500).json({ error: String(e) });

    }
    res.json({ ok: true })
})

contactListRoutes.post('/blockContact/:id', async (req, res) => {
    let user_id = req.session.user?.id;
    let contact_id = +req.params.id
    console.log('user_id', user_id);
    console.log('contact_id', contact_id);

    if (!user_id) {
        res.status(400).json({ error: "Missing user_id" });
        return;
    }
    try {
        await client.query(
            /*sql*/`
            INSERT INTO blocklists (origin_user_id , target_user_id) VALUES
            ($1,$2)
`,
            [user_id, contact_id])
    }
    catch (e) {
        res.status(500).json({ error: String(e) });

    }
    res.json({ ok: true })

})

contactListRoutes.delete('/unblockContact/:id', async (req, res) => {
    let user_id = req.session.user?.id;
    let contact_id = +req.params.id
    console.log('user_id', user_id);
    console.log('contact_id', contact_id);

    if (!user_id) {
        res.status(400).json({ error: "Missing user_id" });
        return;
    }
    try {
        await client.query(
            /*sql*/`
            DELETE FROM blocklists where origin_user_id = $1 and target_user_id =$2;
`,
            [user_id, contact_id])
    }
    catch (e) {
        res.status(500).json({ error: String(e) });

    }
    res.json({ ok: true })

})