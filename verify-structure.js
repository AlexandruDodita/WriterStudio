// Run this script to verify your project structure
const fs = require('fs');
const path = require('path');

const requiredDirectories = [
    'src',
    'src/renderer',
    'src/renderer/components',
    'src/renderer/styles',
];

const requiredFiles = [
    {
        path: 'src/renderer/home.html',
        content: fs.existsSync('src/renderer/home.html') ?
            fs.readFileSync('src/renderer/home.html', 'utf8') :
            `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'">
  <link rel="stylesheet" href="styles/home.css">
  <title>Writer's Studio - Home</title>
</head>
<body>
  <div class="home-container">
    <header>
      <h1 id="app-name">Writer's Studio</h1>
    </header>

    <div class="home-content">
      <div class="welcome-section">
        <h2>Welcome to Writer's Studio</h2>
        <p>Your creative writing workspace</p>
      </div>

      <div class="actions-section">
        <div class="action-card" id="create-project">
          <div class="card-icon">📝</div>
          <h3>Create New Project</h3>
          <p>Start a new writing project</p>
        </div>
        
        <div class="action-card" id="open-project">
          <div class="card-icon">📂</div>
          <h3>Open Existing Project</h3>
          <p>Continue working on a project</p>
        </div>
      </div>

      <div class="recent-projects">
        <h3>Recent Projects</h3>
        <div id="recent-projects-list">
          <!-- Recent projects will be populated here -->
          <p class="empty-message">No recent projects found</p>
        </div>
      </div>
    </div>

    <footer>
      <p>Writer's Studio v0.1.0</p>
    </footer>
  </div>

  <div id="create-project-modal" class="modal">
    <div class="modal-content">
      <span class="close-btn">&times;</span>
      <h2>Create New Project</h2>
      <div class="form-group">
        <label for="project-name">Project Name:</label>
        <input type="text" id="project-name" placeholder="My Amazing Novel">
      </div>
      <div class="form-group">
        <label for="project-location">Location:</label>
        <div class="location-input">
          <input type="text" id="project-location" readonly>
          <button id="browse-location">Browse</button>
        </div>
      </div>
      <div class="form-actions">
        <button id="cancel-create">Cancel</button>
        <button id="confirm-create">Create Project</button>
      </div>
    </div>
  </div>

  <script src="home.js"></script>
</body>
</html>`
    },
    {
        path: 'src/renderer/styles/home.css',
        content: fs.existsSync('src/renderer/styles/home.css') ?
            fs.readFileSync('src/renderer/styles/home.css', 'utf8') :
            `/* Home Screen Styles */
:root {
  --bg-color: #fff;
  --text-color: #333;
  --card-bg: #f5f5f5;
  --header-bg: #eee;
  --border-color: #ddd;
  --accent-color: #4a9eff;
  --hover-color: #e0e0e0;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.home-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

header {
  background-color: var(--header-bg);
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
  text-align: center;
}

.home-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 30px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.welcome-section {
  text-align: center;
  margin-bottom: 40px;
}

.welcome-section h2 {
  font-size: 28px;
  margin-bottom: 10px;
}

.welcome-section p {
  font-size: 16px;
  color: #666;
}

.actions-section {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 40px;
}

.action-card {
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 25px;
  width: 250px;
  text-align: center;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.action-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 32px;
  margin-bottom: 15px;
}

.action-card h3 {
  margin-bottom: 10px;
}

.action-card p {
  color: #666;
  font-size: 14px;
}

.recent-projects {
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--border-color);
}

.recent-projects h3 {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.recent-project-item {
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 5px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-project-item:hover {
  background-color: var(--hover-color);
}

.empty-message {
  color: #888;
  text-align: center;
  padding: 20px;
}

footer {
  text-align: center;
  padding: 15px;
  font-size: 12px;
  color: #888;
  border-top: 1px solid var(--border-color);
}

/* Modal Styles */
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background-color: var(--bg-color);
  margin: 10% auto;
  padding: 25px;
  border-radius: 8px;
  width: 500px;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
  position: relative;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 24px;
  cursor: pointer;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  font-size: 14px;
}

.location-input {
  display: flex;
  gap: 10px;
}

.location-input input {
  flex: 1;
  background-color: #f9f9f9;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-color);
  cursor: pointer;
  font-size: 14px;
}

#confirm-create {
  background-color: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

#browse-location {
  white-space: nowrap;
}`
    }
];

console.log('Verifying project structure...');

// Create required directories
for (const dir of requiredDirectories) {
    if (!fs.existsSync(dir)) {
        console.log(`Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Create or update required files
for (const file of requiredFiles) {
    const dirname = path.dirname(file.path);
    if (!fs.existsSync(dirname)) {
        console.log(`Creating directory: ${dirname}`);
        fs.mkdirSync(dirname, { recursive: true });
    }

    console.log(`Writing file: ${file.path}`);
    fs.writeFileSync(file.path, file.content, 'utf8');
}

console.log('Project structure verification complete!');