from fastapi import FastAPI, Request, Depends, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi_sessions import SessionMiddleware
from fastapi_sessions.backends.implementations import InMemoryBackend
from fastapi_sessions.frontends.implementations import CookieParameters
from fastapi_sessions.session_verifier import SessionVerifier
from uuid import UUID, uuid4
from sqlite3 import connect
import os

# 初始化 FastAPI 應用
app = FastAPI()

# Session 設定
cookie_params = CookieParameters()
backend = InMemoryBackend[UUID, dict]()
session_cookie_name = "session_id"

class BasicVerifier(SessionVerifier[UUID, dict]):
    def __init__(self):
        super().__init__(identifier=session_cookie_name, auto_error=True)

    async def verify_session(self, model: UUID, session_data: dict) -> bool:
        return "user" in session_data

verifier = BasicVerifier()

# 加入 Session Middleware
app.add_middleware(
    SessionMiddleware,
    backend=backend,
    cookie_name=session_cookie_name,
    identifier=session_cookie_name,
    auto_error=True,
    secret_key="your-secret-key",
    cookie_params=cookie_params,
)

# 模板路徑
templates = Jinja2Templates(directory="templates")

# 資料庫初始化
def get_db():
    db_path = "blog.db"
    if not os.path.exists(db_path):
        conn = connect(db_path)
        conn.execute("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, title TEXT, body TEXT)")
        conn.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, email TEXT)")
        conn.commit()
    return connect(db_path)

# 執行 SQL 指令
def sqlcmd(sql, params=()):
    db = get_db()
    cursor = db.cursor()
    cursor.execute(sql, params)
    db.commit()
    return cursor.fetchall()

# 渲染模板
async def render_template(request: Request, template_name: str, **kwargs):
    return templates.TemplateResponse(template_name, {"request": request, **kwargs})

# 註冊
@app.get("/signup", response_class=HTMLResponse)
async def signup_ui(request: Request):
    return await render_template(request, "signup.html")

@app.post("/signup")
async def signup(username: str = Form(...), password: str = Form(...), email: str = Form(...)):
    user_check = sqlcmd("SELECT id FROM users WHERE username=?", (username,))
    if user_check:
        return {"message": "Username already exists"}
    sqlcmd("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", (username, password, email))
    return RedirectResponse(url="/", status_code=303)

# 登入
@app.get("/login", response_class=HTMLResponse)
async def login_ui(request: Request):
    return await render_template(request, "login.html")

@app.post("/login")
async def login(request: Request, username: str = Form(...), password: str = Form(...)):
    user = sqlcmd("SELECT id, username, password FROM users WHERE username=?", (username,))
    if user and user[0][2] == password:
        session_id = uuid4()
        await backend.create(session_id, {"user": username})
        response = RedirectResponse(url="/", status_code=303)
        response.set_cookie(session_cookie_name, str(session_id), httponly=True)
        return response
    return {"message": "Invalid username or password"}

# 登出
@app.get("/logout")
async def logout(request: Request, session_id: UUID = Depends(verifier)):
    await backend.delete(session_id)
    response = RedirectResponse(url="/", status_code=303)
    response.delete_cookie(session_cookie_name)
    return response

# 發表新文章頁面
@app.get("/post/new", response_class=HTMLResponse)
async def add_post(request: Request, session_data: dict = Depends(verifier)):
    return await render_template(request, "new_post.html")

@app.post("/post")
async def create_post(title: str = Form(...), body: str = Form(...), session_data: dict = Depends(verifier)):
    username = session_data["user"]
    sqlcmd("INSERT INTO posts (username, title, body) VALUES (?, ?, ?)", (username, title, body))
    return RedirectResponse(url="/", status_code=303)

# 顯示單篇貼文
@app.get("/post/{id}", response_class=HTMLResponse)
async def show_post(request: Request, id: int):
    post = sqlcmd("SELECT id, username, title, body FROM posts WHERE id=?", (id,))
    if post:
        return await render_template(request, "show_post.html", post=post[0])
    raise HTTPException(status_code=404, detail="Post not found")

# 刪除貼文
@app.post("/post/{id}/delete")
async def delete_post(id: int, session_data: dict = Depends(verifier)):
    username = session_data["user"]
    post = sqlcmd("SELECT username FROM posts WHERE id=?", (id,))
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post[0][0] != username:
        raise HTTPException(status_code=403, detail="You can only delete your own posts")
    sqlcmd("DELETE FROM posts WHERE id=?", (id,))
    return RedirectResponse(url="/", status_code=303)

# 首頁
@app.get("/", response_class=HTMLResponse)
async def list_posts(request: Request):
    posts = sqlcmd("SELECT id, username, title, body FROM posts")
    return await render_template(request, "list.html", posts=posts)
