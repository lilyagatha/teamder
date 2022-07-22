import { client } from "./db";
import express, { Request, Response, NextFunction } from "express";
// import { AnyNsRecord } from 'dns';

export let matchRoutes = express.Router();
matchRoutes.use(express.urlencoded({ extended: true }));
matchRoutes.use(express.json());
matchRoutes.use(express.static("uploads"));

matchRoutes.get("/matching", getTitles);
matchRoutes.post("/dislike/:id", dislikeUser);
matchRoutes.delete("/dislike", resetMatch);
matchRoutes.get("/matching", checkPremission);


async function checkPremission(req: Request, res: Response) {
  console.log(req.session.user?.id)
  try {
    if (req.session.user?.id === undefined) {
      res.status(400).json({ error: "請先登入" });
    }
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

matchRoutes.get("/startmatch", (req, res) => {
  client
    .query(
      /* sql */ `
          select
          posts.id
          , creator_id
    from posts 
    WHERE creator_id = $1
    and type = 'learn'
    `,
      [req.session.user?.id]
    )
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => {
      res.status(500).json({ error: String(error) });
    });
});

// select title from posts where (creator_id = $1 and type = learn)

// select creator_id from posts where type = teach and title = select title from posts where (creator_id = $1 and type = learn)

// select creator_id from posts inner join users on users.id = creator_id where title like $1 or $2

// select creator_id from posts where title = '鋼琴'or title = '網球';

async function getTitles(req: Request, res: Response) {
  try {
    const findTitles = await client.query(
      /* sql */ `
      select array_agg(distinct title) as titles from posts where type='learn' AND creator_id = $1`,
      [req.session.user?.id]
    );
    console.log(findTitles.rows[0].titles);

    const findCreatorIds = await client.query(
      /* sql */ `
      select array_agg(distinct creator_id) as creator_ids 
      from posts 
      where type='teach' AND title ilike any($1)
      AND creator_id != $2
      AND creator_id NOT IN (
        select target_user_id
        from followlists 
        WHERE origin_user_id = $2)
        AND creator_id NOT IN (
          select matching_id
          from dislikes 
          WHERE searching_id = $2)
      `,
      [
        findTitles.rows[0].titles.map((title: string) => "%" + title + "%"),
        req.session.user?.id,
      ]
    );

    console.log(findCreatorIds.rows);

    const creatorInfo = await client.query(
      /* sql */ `
      select distinct users.id, username, age, district, gender, iconimage 
      from users 
      join posts on users.id = posts.creator_id  
      where creator_id = any($1)`,
      [findCreatorIds.rows[0].creator_ids]
    );
    console.log(creatorInfo.rows);

    const getTeach = await client.query(
      /* sql */ `
      select distinct creator_id, array_agg(title) as titles 
      from posts 
      where type='teach' 
      AND creator_id = any($1) 
      GROUP BY creator_id`,
      [findCreatorIds.rows[0].creator_ids]
    );
    console.log(getTeach.rows);

    const getLearn = await client.query(
      /* sql */ `
      select distinct creator_id, array_agg(title) as titles 
      from posts 
      where type='learn' 
      AND creator_id = any($1) 
      GROUP BY creator_id`,
      [findCreatorIds.rows[0].creator_ids]
    );
    console.log(getLearn.rows);

    let users = creatorInfo.rows.map((user) => ({
      user,
      teach: getTeach.rows
        .filter((row) => row.creator_id === user.id)
        .flatMap((row) => row.titles),
      learn: getLearn.rows
        .filter((row) => row.creator_id === user.id)
        .flatMap((row) => row.titles),
    }));

    res.json({
      users,
      // user: creatorInfo.rows,
      // teach: getTeach.rows,
      // learn: getLearn.rows
    });
  } catch (e) {
    // console.error("fail to get titles", e);
    res.status(500).json({ error: String(e) });
  }
}

// matchRoutes.get("/matching", (req, res) => {
//   client
//     .query(
//       /* sql */ `
//       select creator_id from posts where title = select title from posts where creator_id = $1
//   `,
//       [req.session.user?.id]
//     )
//     .then((result) => {
//         console.log(result.rows)
//       res.json(result.rows);
//     })
//     .catch((error) => {
//       res.status(500).json({ error: String(error) });
//     });
// });

async function dislikeUser(req: Request, res: Response) {
  let searching_id = req.session.user?.id;
  let matching_id = +req.params.id;

  try {
    await client.query(
      /* sql */ `
      INSERT INTO dislikes (searching_id, matching_id) VALUES ($1, $2)`,
      [searching_id, matching_id]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

async function resetMatch(req: Request, res: Response) {
  let searching_id = req.session.user?.id;

  try {
    await client.query(
      /* sql */ `
      DELETE FROM dislikes where searching_id=$1`,
      [searching_id]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
