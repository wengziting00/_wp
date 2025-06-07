from fastapi import FastAPI, Request, Response, Depends, HTTPException, Form, status
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from uuid import UUID, uuid4
from typing import Optional
from fastapi_sessions.frontends.implementations import SessionCookie
from fastapi_sessions.backends.implementations import InMemoryBackend

# 資料庫設定
SQLALCHEMY_DATABASE_URL = "sqlite:///./blog.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# 資料模型
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    email = Column(String)

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True)
    username = Column(String, index=True)
    title = Column(String)
    body = Column(String)

Base.metadata.create_all(bind=engine)

# Session 模型
class SessionData(BaseModel):
    username: str

# Session 管理
cookie_name = "blog_session"
cookie = SessionCookie(
    cookie_name=cookie_name,
    identifier="general_verifier",
    auto_error=True,
    secret_key="SUPER_SECRET_CHANGE_ME",
)
backend = InMemoryBackend[UUID, SessionData]()

# FastAPI 應用程式
app = FastAPI()

# Dependency - 資料庫連線
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 簡化的 HTML 回傳
def render_template(template: str, **context):
    if template == "list.html":
        posts = context.get("posts", [])
        user = context.get("user")
        result = "<h1>文章列表</h1>"
        if user:
            result += f"<p>歡迎，{user.username}</p><a href='/logout'>登出</a><br><a href='/post/new'>新增文章</a>"
        else:
            result += "<a href='/login'>登入</a> | <a href='/signup'>註冊</a>"
        for post in posts:
            result += f"<div><a href='/post/{post.id}'>{post.title}</a> - by {post.username}</div>"
        return result
    elif template == "signup.html":
        return "<form method='post'>帳號: <input name='username'><br>密碼: <input name='password'><br>Email: <input name='email'><br><button>註冊</button></form>"
    elif template == "login.html":
        return "<form method='post'>帳號: <input name='username'><br>密碼: <input name='password'><br><button>登入</button></form>"
    elif template == "new_post.html":
        return "<form method='post'>標題: <input name='title'><br>內文: <textarea name='body'></textarea><br><button>發表</button></form>"
    elif template == "show_post.html":
        post = context.get("post")
        owner = context.get("owner")
        html = f"<h1>{post.title}</h1><p>{post.body}</p><p>作者：{post.username}</p>"
        if owner:
            html += f"<form method='post' action='/post/{post.id}/delete'><button>刪除</button></form>"
        return html
    return "<p>404 頁面不存在</p>"

# 首頁
@app.get("/", response_class=HTMLResponse)
def list_posts(request: Request, db: Session = Depends(get_db)):
    posts = db.query(Post).all()
    session_id = request.cookies.get(cookie_name)
    user_data = None
    if session_id:
        try:
            user_data = backend.read(UUID(session_id))
        except:
            pass
    return render_template("list.html", posts=posts, user=user_data)

# 註冊
@app.get("/signup", response_class=HTMLResponse)
def signup_ui():
    return render_template("signup.html")

@app.post("/signup")
def signup(username: str = Form(...), password: str = Form(...), email: str = Form(...), db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="使用者名稱已存在")
    db.add(User(username=username, password=password, email=email))
    db.commit()
    return RedirectResponse(url="/login", status_code=303)

# 登入
@app.get("/login", response_class=HTMLResponse)
def login_ui():
    return render_template("login.html")

@app.post("/login")
def login(response: Response, username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or user.password != password:
        raise HTTPException(status_code=400, detail="帳號或密碼錯誤")
    session_id = uuid4()
    backend.create(session_id, SessionData(username=username))
    cookie.attach_to_response(response, session_id)
    return RedirectResponse(url="/", status_code=303)

# 登出
@app.get("/logout")
def logout(response: Response):
    response.delete_cookie(cookie_name)
    return RedirectResponse(url="/", status_code=303)

# 新增貼文頁面
@app.get("/post/new", response_class=HTMLResponse)
def new_post(request: Request):
    session_id = request.cookies.get(cookie_name)
    if not session_id:
        raise HTTPException(status_code=401, detail="請先登入")
    return render_template("new_post.html")

# 發表貼文
@app.post("/post")
def create_post(request: Request, title: str = Form(...), body: str = Form(...), db: Session = Depends(get_db)):
    session_id = request.cookies.get(cookie_name)
    if not session_id:
        raise HTTPException(status_code=401, detail="請先登入")
    try:
        user_data = backend.read(UUID(session_id))
        db.add(Post(username=user_data.username, title=title, body=body))
        db.commit()
        return RedirectResponse(url="/", status_code=303)
    except:
        raise HTTPException(status_code=401, detail="登入無效")

# 顯示單篇貼文
@app.get("/post/{post_id}", response_class=HTMLResponse)
def show_post(post_id: int, request: Request, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="文章不存在")
    session_id = request.cookies.get(cookie_name)
    owner = False
    if session_id:
        try:
            user_data = backend.read(UUID(session_id))
            if user_data.username == post.username:
                owner = True
        except:
            pass
    return render_template("show_post.html", post=post, owner=owner)

# 刪除貼文
@app.post("/post/{post_id}/delete")
def delete_post(post_id: int, request: Request, db: Session = Depends(get_db)):
    session_id = request.cookies.get(cookie_name)
    if not session_id:
        raise HTTPException(status_code=401, detail="未登入")
    try:
        user_data = backend.read(UUID(session_id))
        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="貼文不存在")
        if post.username != user_data.username:
            raise HTTPException(status_code=403, detail="只能刪除自己的文章")
        db.delete(post)
        db.commit()
        return RedirectResponse(url="/", status_code=303)
    except:
        raise HTTPException(status_code=401, detail="登入過期")
