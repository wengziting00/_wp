function formatDate(date) {
  return new Date(date).toLocaleString("zh-TW", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export async function list(articles) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Articles</title>
    </head>
    <body>
      <h1>All Articles</h1>
      <ul>
        ${articles.map(a => `
          <li>
            <a href="/article/${a.id}">${a.title}</a> - 
            <small>${formatDate(a.created_at)}</small>
          </li>`).join("")}
      </ul>
      <p><a href="/article/new">Write a new article</a></p>
    </body>
    </html>
  `;
}

export async function newArticle() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>New Article</title>
    </head>
    <body>
      <h1>New Article</h1>
      <form action="/article" method="POST">
        <p>Title: <input type="text" name="title" required></p>
        <p>Body:<br><textarea name="body" rows="10" cols="50" required></textarea></p>
        <p><button type="submit">Submit</button></p>
      </form>
      <p><a href="/">Back to list</a></p>
    </body>
    </html>
  `;
}

export async function detail(article) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${article.title}</title>
    </head>
    <body>
      <h1>${article.title}</h1>
      <p>${article.body}</p>
      <small>Posted on: ${formatDate(article.created_at)}</small>
      <p><a href="/">Back to list</a></p>
    </body>
    </html>
  `;
}
