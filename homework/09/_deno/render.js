export function layout(title, content) {
  return `
  <html>
  <head>
    <title>${title}</title>
    <style>
      body {
        padding: 80px;
        font: 16px Helvetica, Arial;
        background-color: #f8f8f8;
      }
      h1 {
        font-size: 2em;
      }
      h2 {
        font-size: 1.2em;
      }
      a {
        color: #00f;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      #posts {
        margin: 0;
        padding: 0;
      }
      #posts li {
        margin: 40px 0;
        padding-bottom: 20px;
        border-bottom: 1px solid #ccc;
        list-style: none;
      }
      textarea {
        width: 500px;
        height: 300px;
      }
      input[type=text], input[type=password], textarea {
        border: 1px solid #ccc;
        padding: 15px;
        font-size: 1em;
        border-radius: 4px;
      }
      input[type=text], input[type=password] {
        width: 500px;
      }
      input[type=submit], button {
        padding: 10px 20px;
        font-size: 1em;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <section id="content">
      ${content}
    </section>
  </body>
  </html>
  `;
}

export function loginUi() {
  return layout('Login', `
    <h1>Login</h1>
    <form action="/login" method="post">
      <p><input type="text" placeholder="username" name="username" required></p>
      <p><input type="password" placeholder="password" name="password" required></p>
      <p><input type="submit" value="Login"></p>
      <p>New user? <a href="/signup">Create an account</a></p>
    </form>
  `);
}

export function signupUi() {
  return layout('Signup', `
    <h1>Signup</h1>
    <form action="/signup" method="post">
      <p><input type="text" placeholder="username" name="username" required></p>
      <p><input type="password" placeholder="password" name="password" required></p>
      <p><input type="text" placeholder="email" name="email" required></p>
      <p><input type="submit" value="Signup"></p>
    </form>
  `);
}

export function success() {
  return layout('Success', `
    <h1>Success!</h1>
    <p>You may <a href="/">read all posts</a> or <a href="/login">login again</a>.</p>
  `);
}

export function fail(msg = "Fail!") {
  return layout('Fail', `
    <h1>${msg}</h1>
    <p><a href="/">Home</a> or <a href="JavaScript:window.history.back()">Go back</a>.</p>
  `);
}

export function list(posts, user) {
  const list = posts.map(post => `
    <li>
      <h2>${post.title} — by ${post.username}</h2>
      <p><a href="/post/${post.id}">Read post</a></p>
    </li>
  `).join('\n');

  const userInfo = user
    ? `Welcome ${user.username}, you may <a href="/post/new">Create a Post</a> or <a href="/logout">Logout</a>`
    : `<a href="/login">Login</a> to create a post`;

  const content = `
    <h1>Posts</h1>
    <p>${userInfo}</p>
    <p>There are <strong>${posts.length}</strong> posts.</p>
    <ul id="posts">
      ${list}
    </ul>
  `;
  return layout('Posts', content);
}

export function newPost() {
  return layout('New Post', `
    <h1>New Post</h1>
    <form action="/post" method="post">
      <p><input type="text" name="title" placeholder="Title" required></p>
      <p><textarea name="body" placeholder="Contents" required></textarea></p>
      <p><input type="submit" value="Create"></p>
    </form>
  `);
}

export function show(post, user) {
  const ownerControls = user && user.username === post.username
    ? `<p><a href="/post/${post.id}/delete">Delete Post</a></p>`
    : '';

  return layout(post.title, `
    <h1>${post.title}</h1>
    <h3>by ${post.username}</h3>
    <p>${post.body}</p>
    ${ownerControls}
    <p><a href="/">Back to posts</a></p>
  `);
}

export function deleteConfirm(post) {
  return layout(`Delete: ${post.title}`, `
    <h1>Are you sure you want to delete this post?</h1>
    <h2>${post.title} — by ${post.username}</h2>
    <p>${post.body}</p>
    <form method="post" action="/post/${post.id}/delete">
      <button type="submit">Yes, delete it</button>
      <a href="/">Cancel</a>
    </form>
  `);
}
