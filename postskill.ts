import { mkdirSync } from "fs";
import formidable from "formidable";
import { client } from "./db";
import express, { Request, Response, NextFunction } from "express";
import { AnyNsRecord } from "dns";
import { io } from "./io";

export let postsRoutes = express.Router();
postsRoutes.use(express.urlencoded({ extended: true }));
postsRoutes.use(express.json());
postsRoutes.use(express.static("uploads"));


postsRoutes.get("/postskillupdate", checkPremission);
postsRoutes.post("/comment/:id", leaveComment);
postsRoutes.post("/gettitles", getthetitles);


let uploadDir = "uploads";
mkdirSync(uploadDir, { recursive: true });

const form = formidable({
  uploadDir,
  keepExtensions: true,
  maxFiles: 1,
  maxFileSize: 200 * 1024 ** 2, // the default limit is 200KB
  filter: (part) => part.mimetype?.startsWith("image/") || false,
});

export function extractSingleFile(
  file: formidable.File[] | formidable.File
): formidable.File {
  return Array.isArray(file) ? file[0] : file;
}

// export type Post = {
//   id: number
//   creator: number
//   skillid: number,
//   categoryid: number
//   title: string
//   content: string
//   attachment: string | null
//   createdate: string
// }

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

async function getthetitles(req: Request, res: Response) {
  try {
  const { userinput } = req.body;
    let inputresult = await client.query(
      /* SQL */ `
      INSERT INTO comments (user_id,content,post_id) VALUES ($1,$2,$3)
      returning user_id,content`,
      [id,comment,post_id]
    );
    let username = await client.query(
      /* SQL */ `
      select username from users where id=$1`,
      [id]
    );

    username = username.rows[0].username
    let content = saveComment.rows[0].content
    console.log(saveComment.rows[0])
    io.emit('new notification', {content, username} )
    res.json({ ok: true });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ message: "伺服器錯誤，請聯絡 Beeno" });
  }
}

async function leaveComment(req: Request, res: Response) {
  try {
  const { comment } = req.body;
    let id = req.session.user?.id;
    let post_id = +req.params.id;
    let saveComment = await client.query(
      /* SQL */ `
      INSERT INTO comments (user_id,content,post_id) VALUES ($1,$2,$3)
      returning user_id,content`,
      [id,comment,post_id]
    );
    let username = await client.query(
      /* SQL */ `
      select username from users where id=$1`,
      [id]
    );

    username = username.rows[0].username
    let content = saveComment.rows[0].content
    console.log(saveComment.rows[0])
    io.emit('new notification', {content, username} )
    res.json({ ok: true });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ message: "伺服器錯誤，請聯絡 Beeno" });
  }
}

postsRoutes.get("/showcomment/:id", async (req, res) => {
  // const login_id = req.session.user?.id;
  let id = +req.params.id;
  try {
    const result = (await client
      .query(
        /* sql */ `
          select
          comments.id
          , user_id
          , content
          , comment_date
          , username
          , iconimage
    from comments join users on users.id = comments.user_id where post_id=$1
    order by comments.id desc;
    `,[id]
      )).rows
    res.json({ result });

  } catch (e) {
    res.status(500).json({ error: String(e) });

  }
});


postsRoutes.post("/postskillupdate", async (req: Request, res: Response) => {
  // const {title,category,content} = req.body;
  // console.log(title)
  form.parse(req, async (err, fields, files: any) => {
    const file: any = extractSingleFile(files);
    if (Object.keys(file).length > 0) {
      const keys = Object.keys(file);
      await client.query(
        `INSERT INTO posts (creator_id,title,category_id,content,attachment,type) VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          req.session.user?.id,
          fields.title,
          fields.category,
          fields.content,
          file[keys[0]].newFilename,
          fields["skill-radio"],
        ]
      );
      res.json({ success: true });
    } else {
      res.json({ error: "You must upload an attachment" });
    }
  });
});

postsRoutes.get("/skills/:id", (req, res) => {
  let id = +req.params.id;

  if (!id) {
    res.status(400).json({ error: "頁面不存在" });
    return;
  }

  client
    .query(
      /* sql */ `
  select
    posts.id
  , posts.creator_id
  , posts.title
  , posts.category_id
  , posts.content
  , posts.attachment
  , posts.created_at
  , username
  , iconimage
  , cat_name
  from posts 
  join users on users.id = posts.creator_id 
  join categories on categories.id = posts.category_id
  where posts.id = $1
  `,
      [id]
    )
    .then((result) => {
      let post = result.rows[0];
      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }
      let userId = req.session.user?.id;
      let isAdmin = req.session.user?.isAdmin;
      res.json({ post, userId, isAdmin });
    })
    .catch((error) => {
      res.status(500).json({ error: String(error) });
    });
});

postsRoutes.get("/postskill/:id", (req, res) => {
  let id = +req.params.id;
  if (!id) {
    res.status(400).json({ error: "Page not found" });
    return;
  }
  client
    .query(
      /* sql */ `
  select
    posts.id
  , posts.creator_id
  , posts.title
  , posts.category_id
  , posts.content
  , posts.type
  , posts.attachment
  from posts
  where posts.id = $1
  `,
      [id]
    )
    .then((result) => {
      let post = result.rows[0];
      if (result.rows[0].creator_id != req.session.user?.id) {
        res.status(404).json({ error: "喂你做咩改人地個POST！" });
        return;
      }
      if (!post) {
        res.status(404).json({ error: "頁面不存在" });
        return;
      }
      res.json(result.rows[0]);
    })
    .catch((error) => {
      res.status(500).json({ error: "頁面不存在" });
    });
});

postsRoutes.post("/postskillupdate/:id", (req: Request, res: Response) => {
  let user_id = req.session.user?.id;
  let id = +req.params.id;
  if (!id) {
    res.status(400).json({ error: "Missing id in req.params" });
    return;
  }
  // const {title,category,content} = req.body;
  form.parse(req, async (err, fields, files: any) => {
    const file: any = extractSingleFile(files);
    const keys = Object.keys(file);

    if (keys.length == 0) {
      await client
        .query(
          `UPDATE posts set title = $1, category_id = $2, content = $3, type=$4 WHERE id = $5 and creator_id = $6`,
          [
            fields.title,
            fields.category,
            fields.content,
            fields["skill-radio"],
            id,
            user_id,
          ]
        )
        .then((result) => {
          if (result.rowCount) {
            res.json({ ok: true });
          } else {
            res.status(400).json({
              error:
                "Failed to delete, only the creator of post can delete this post",
            });
          }
        })
        .catch((error) => {
          res.status(500).json({ error: String(error) });
        });
    } else {
      let uploadedImage = file[keys[0]]?.newFilename || null;
      await client
        .query(
          `UPDATE posts set title = $1, category_id = $2, content = $3, type=$4, attachment = $5 WHERE id = $6 and creator_id = $7`,
          [
            fields.title,
            fields.category,
            fields.content,
            fields["skill-radio"],
            uploadedImage,
            id,
            user_id,
          ]
        )
        .then((result) => {
          if (result.rowCount) {
            res.json({ ok: true });
          } else {
            res.status(400).json({
              error:
                "Failed to delete, only the creator of post can delete this post",
            });
          }
        })
        .catch((error) => {
          res.status(500).json({ error: String(error) });
        });
    }
  });
});

postsRoutes.delete("/postskill/:id", (req, res) => {
  let post_id = +req.params.id;
  let user_id = req.session.user?.id;
  let isAdmin = req.session.user?.isAdmin;
  if (!post_id) {
    res.status(400).json({ error: "Missing id in req.params" });
    return;
  }
  client
    .query(
      /* sql */ `
delete from posts
where id = $1
and (creator_id = $2 or $3)
`,
      [post_id, user_id, isAdmin]
    )
    .then((result) => {
      if (result.rowCount) {
        res.json({ ok: true });
      } else {
        res.status(400).json({
          error:
            "Failed to delete, only the creator of post can delete this post",
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error: String(error) });
    });
});
