import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import * as render from './render.js';
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { Session } from "https://deno.land/x/oak_sessions/mod.ts";

// 初始化 SQLite 資料庫
const db = new DB("blog.db");
db.query("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, title TEXT, body TEXT)");
db.query("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, email TEXT)");

// 初始化 Router
const router = new Router();
router
  .get('/', list)
  .get('/signup', signupUi)
  .post('/signup', signup)
  .get('/login', loginUi)
  .post('/login', login)
  .get('/logout', logout)
  .get('/post/new', add)
  .post('/post', create)
  .get('/post/:id', show)
  .get('/post/:id/delete', deleteConfirm)
  .post('/post/:id/delete', deletePost);

// 初始化 App
const app = new Application();
app.use(Session.initMiddleware());
app.use(router.routes());
app.use(router.allowedMethods());

// 資料庫查詢封裝
function sqlcmd(sql, arg1) {
  try {
    return db.query(sql, arg1);
  } catch (error) {
    console.log('SQL Error:', error);
    throw error;
  }
}

// 資料解析
function postQuery(sql) {
  let list = [];
  for (const [id, username, title, body] of sqlcmd(sql)) {
    list.push({ id, username, title, body });
  }
  return list;
}

function userQuery(sql) {
  let list = [];
  for (const [id, username, password, email] of sqlcmd(sql)) {
    list.push({ id, username, password, email });
  }
  return list;
}

// 解析表單
async function parseFormBody(body) {
  const pairs = await body.form();
  const obj = {};
  for (const [key, value] of pairs) {
    obj[key] = value;
  }
  return obj;
}

// 頁面功能
async function signupUi(ctx) {
  ctx.response.body = await render.signupUi();
}

async function signup(ctx) {
  const body = ctx.request.body;
  if (body.type() === "form") {
    const user = await parseFormBody(body);
    const dbUsers = userQuery(`SELECT * FROM users WHERE username='${user.username}'`);
    if (dbUsers.length === 0) {
      sqlcmd("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", [user.username, user.password, user.email]);
      ctx.response.body = render.success();
    } else {
      ctx.response.body = render.fail("帳號已存在");
    }
  }
}

async function loginUi(ctx) {
  ctx.response.body = await render.loginUi();
}

async function login(ctx) {
  const body = ctx.request.body;
  if (body.type() === "form") {
    const user = await parseFormBody(body);
    const dbUsers = userQuery(`SELECT * FROM users WHERE username='${user.username}'`);
    const dbUser = dbUsers[0];
    if (dbUser && dbUser.password === user.password) {
      ctx.state.session.set('user', { username: dbUser.username });
      ctx.response.redirect('/');
    } else {
      ctx.response.body = render.fail("帳號或密碼錯誤");
    }
  }
}

async function logout(ctx) {
  await ctx.state.session.set('user', null);
  ctx.response.redirect('/');
}

async function list(ctx) {
  const posts = postQuery("SELECT * FROM posts");
  const user = await ctx.state.session.get('user');
  ctx.response.body = await render.list(posts, user);
}

async function add(ctx) {
  const user = await ctx.state.session.get('user');
  if (user) {
    ctx.response.body = await render.newPost();
  } else {
    ctx.response.body = render.fail("請先登入");
  }
}

async function show(ctx) {
  const pid = ctx.params.id;
  const posts = postQuery(`SELECT * FROM posts WHERE id = ${pid}`);
  const post = posts[0];
  const user = await ctx.state.session.get('user');
  if (!post) ctx.throw(404, '找不到文章');
  ctx.response.body = await render.show(post, user);
}

async function create(ctx) {
  const body = ctx.request.body;
  const user = await ctx.state.session.get('user');
  if (!user) ctx.throw(401, '未登入');
  if (body.type() === "form") {
    const post = await parseFormBody(body);
    sqlcmd("INSERT INTO posts (username, title, body) VALUES (?, ?, ?)", [user.username, post.title, post.body]);
    ctx.response.redirect('/');
  }
}

async function deleteConfirm(ctx) {
  const pid = ctx.params.id;
  const posts = postQuery(`SELECT * FROM posts WHERE id = ${pid}`);
  const post = posts[0];
  const user = await ctx.state.session.get('user');
  if (!post) ctx.throw(404, '找不到文章');
  if (!user || user.username !== post.username) ctx.throw(403, '無權限刪除');
  ctx.response.body = await render.deleteConfirm(post);
}

async function deletePost(ctx) {
  const pid = ctx.params.id;
  const posts = postQuery(`SELECT * FROM posts WHERE id = ${pid}`);
  const post = posts[0];
  const user = await ctx.state.session.get('user');
  if (!post) ctx.throw(404, '找不到文章');
  if (!user || user.username !== post.username) ctx.throw(403, '無權限刪除');
  sqlcmd("DELETE FROM posts WHERE id = ?", [pid]);
  ctx.response.redirect('/');
}

// 啟動伺服器
console.log('Server run at http://127.0.0.1:8000');
await app.listen({ port: 8000 });
