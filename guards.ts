import type { Request, Response, NextFunction } from "express";

export function isLoggedIn(req: Request, res: Response, next: NextFunction) {
  if (req.session?.["user"]) {
    next();
  } else {
    res.redirect("/login.html");
  }
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.["user"]) {
    next();
  } else {
    res.status(401).send(`This resources is only accessible by admin <a href="http://localhost:8080/login.html">Login</a>`)
  }
}