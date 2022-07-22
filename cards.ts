import { client } from "./db";
import express, { Request, Response, NextFunction } from "express";
// import { AnyNsRecord } from 'dns';

export let cardsRoutes = express.Router();
cardsRoutes.use(express.urlencoded({ extended: true }));
cardsRoutes.use(express.json());
cardsRoutes.use(express.static("uploads"));




cardsRoutes.get("/search", (req, res) => {
  let title = req.query.title;
  if (typeof title !== "string") {
    res.status(400).json({ error: "Missing title in req.query" });
    return;
  }
  client
    .query(
      /* sql */ `
        select
        posts.id
        , title
        , category_id
        , attachment
        , created_at
        ,cat_name
        ,type
  from posts join categories on categories.id = posts.category_id
  WHERE ((posts.title ilike $1) AND (type = 'teach'))
  order by id desc
  `,
      [`%${title}%`]
    )
    .then((result) => {
      // console.log(result);
      res.json(result.rows);
    })
    .catch((error) => {
      res.status(500).json({ error: String(error) });
    });
});

cardsRoutes.get("/search/:category", (req, res) => {
  let searchId = +req.params.category;
  if (searchId == 0) {
    // res.status(400).json({ error: "Missing id in req.params" });
    // return;
    client
      .query(
        /* sql */ `
        select
        posts.id
        , title
        , category_id
        , attachment
        , created_at
        ,cat_name
        ,type
  from posts join categories on categories.id = posts.category_id
  where type = 'teach'
  order by id desc
  `
      )
      .then((result) => {
        // console.log(result)
        res.json(result.rows);
      })
      .catch((error) => {
        res.status(500).json({ error: String(error) });
      });
  } else {
    client
      .query(
        /* sql */ `
        select
        posts.id
        , title
        , category_id
        , attachment
        , created_at
        ,cat_name
        ,type
  from posts join categories on categories.id = posts.category_id
  WHERE ((posts.category_id = $1) AND (type = 'teach'))
  order by id desc
  `,
        [searchId]
      )
      .then((result) => {
        // console.log(result)
        res.json(result.rows);
      })
      .catch((error) => {
        res.status(500).json({ error: String(error) });
      });
  }
});

cardsRoutes.get("/index/cards", async (req, res) => {
  const login_id = req.session.user?.id;

  try {
    const blockList = (await client.query(
      /*sql*/`
      select 
      target_user_id,
      username
      from blocklists join users on target_user_id = users.id where origin_user_id = $1
`,
      [login_id])).rows
    const result = (await client
      .query(
        /* sql */ `
          select
          posts.id
          ,posts.creator_id
          , title
          , category_id
          , attachment
          , created_at
          , cat_name
          , type
    from posts join categories on categories.id = posts.category_id
    where type = 'teach'
    order by id desc;
    `
      )).rows
    res.json({ result, blockList });

  } catch (e) {
    res.status(500).json({ error: String(e) });

  }
});

cardsRoutes.get("/index/category", (req, res) => {
  client
    .query(
      /* sql */ `
        select
        id
        , cat_name
        , cat_img
  from categories
  order by id asc
  `
    )
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => {
      res.status(500).json({ error: String(error) });
    });
});

//teach version
cardsRoutes.get("/teach/search", (req, res) => {
  let title = req.query.title;
  if (typeof title !== "string") {
    res.status(400).json({ error: "Missing title in req.query" });
    return;
  }
  client
    .query(
      /* sql */ `
        select
        posts.id
        , title
        , category_id
        , attachment
        , created_at
        ,cat_name
        ,type
  from posts join categories on categories.id = posts.category_id
  WHERE ((posts.title ilike $1) AND (type = 'learn'))
  order by id desc
  `,
      [`%${title}%`]
    )
    .then((result) => {
      console.log(result);
      res.json(result.rows);
    })
    .catch((error) => {
      res.status(500).json({ error: String(error) });
    });
});

cardsRoutes.get("/teach/search/:category", (req, res) => {
  let searchId = +req.params.category;
  if (searchId == 0) {
    // res.status(400).json({ error: "Missing id in req.params" });
    // return;
    client
      .query(
        /* sql */ `
        select
        posts.id
        , title
        , category_id
        , attachment
        , created_at
        ,cat_name
        ,type
  from posts join categories on categories.id = posts.category_id
  where type = 'learn'
  order by id desc
  `
      )
      .then((result) => {
        res.json(result.rows);
      })
      .catch((error) => {
        res.status(500).json({ error: String(error) });
      });
  } else {
    client
      .query(
        /* sql */ `
        select
        posts.id
        , title
        , category_id
        , attachment
        , created_at
        ,cat_name
        ,type
  from posts join categories on categories.id = posts.category_id
  WHERE ((posts.category_id = $1) AND (type = 'learn'))
  order by id desc
  `,
        [searchId]
      )
      .then((result) => {
        res.json(result.rows);
      })
      .catch((error) => {
        res.status(500).json({ error: String(error) });
      });
  }
});



cardsRoutes.get("/teach/cards", (req, res) => {
  client
    .query(
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
  where type = 'learn'
  order by id desc;
  `
    )
    .then((result) => {
      // console.log(result);
      res.json(result.rows);
    })
    .catch((error) => {
      res.status(500).json({ error: String(error) });
    });
});

cardsRoutes.get("/teach/category", (req, res) => {
  client
    .query(
      /* sql */ `
        select
        id
        , cat_name
        , cat_img
  from categories
  order by id asc
  `
    )
    .then((result) => {
      res.json(result.rows);
    })
    .catch((error) => {
      res.status(500).json({ error: String(error) });
    });
});



