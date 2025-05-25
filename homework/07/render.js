export function list(articles) {
  return `
    <html>
      <head><title>My Blog</title></head>
      <body>
        <h1>Article List</h1>
        <a href="/article/new">➕ New Article</a>
        <ul>
          ${articles.map(article => `
            <li>
              <a href="/article/${article.id}">${article.title}</a><br>
              <small>Posted on: ${formatDate(article.created_at)}</small>
            </li>
          `).join("")}
        </ul>
      </body>
    </html>
  `;
}

export function detail(article) {
  return `
    <html>
      <head><title>${article.title}</title></head>
      <body>
        <h1>${article.title}</h1>
        <p>${article.body}</p>
        <p><small>Posted on: ${formatDate(article.created_at)}</small></p>
        <a href="/">← Back</a>
      </body>
    </html>
  `;
}
export function newArticle() {
  return `
    <html>
      <head><title>New Article</title></head>
      <body>
        <h1>Create a New Article</h1>
        <form action="/article" method="POST">
          <input type="text" name="title" placeholder="Title" required><br>
          <textarea name="body" placeholder="Content" required></textarea><br>
          <button type="submit">Save</button>
        </form>
        <a href="/">← Back</a>
      </body>
    </html>
  `;
}
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: '2-digit',
    minute: '2-digit'
  });
}
