import { Application } from "https://deno.land/x/oak/mod.ts";

const app = new Application();

app.use((ctx) => {

  console.log('url=', ctx.request.url)
  let pathname = ctx.request.url.pathname
  if (pathname == '/') {
    ctx.response.body = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>自我介紹網頁</title>
  <style>
    body {
      background-color: #f0f4f8;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    }
    h1 {
      color: #2c7a7b;
      text-align: center;
      font-size: 42px;
      margin-top: 40px;
    }
    ul {
      list-style-type: none;
      padding: 0;
      max-width: 600px;
      margin: 30px auto;
    }
    li {
      background-color: #e6fffa;
      color: #234e52;
      padding: 15px 20px;
      margin-bottom: 12px;
      border-radius: 10px;
      font-size: 20px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    li a {
      color: #2c7a7b;
      text-decoration: none;
    }
    li a:hover {
      text-decoration: underline;
    }

    </style>
</head>
<body>
<h1>自我介紹網頁</h1>
<ul>
<li><a href="/name">姓名</a></li>
<li><a href="/age">年齡</a></li>
<li><a href="/gender">性別</a></li>
<h2></h2>
<li>作品：<a href="https://github.com/wengziting00">github</a></li>
</ul>

<table>
</table>
</body>
</html>
`
  } else if (pathname == '/name') {
    ctx.response.body = '翁芷婷'
  } else if(pathname == '/age'){
    ctx.response.body = '18歲'
  }else if(pathname == '/gender'){
    ctx.response.body = '女'
  }

});

console.log('start at : http://127.0.0.1:8000')
await app.listen({ port: 8000 })
