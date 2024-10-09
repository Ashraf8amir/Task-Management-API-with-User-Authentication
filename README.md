 <h1>Task Management API</h1>
    <h2>Overview</h2>
    <p>This is a task management API built using Node.js, Express, SQLite3, and JWT for authentication. The API allows user registration, login, task management (CRUD operations), and role-based access control (Admin and Normal User).</p>
    <h2>Features</h2>
    <ul>
        <li><strong>User Registration</strong>: New users can register by providing a username, password, email, and phone number.</li>
        <li><strong>Login</strong>: Users can log in using their email and password to receive a JWT token.</li>
        <li><strong>Task Management</strong>: 
            <ul>
                <li>Admins can create, read, update, and delete tasks.</li>
                <li>Normal users can mark tasks as <code>pending</code> or <code>done</code>.</li>
            </ul>
        </li>
        <li><strong>Role-Based Access Control</strong>: Admins have higher privileges than normal users.</li>
        <li><strong>JWT Authentication</strong>: Secures API routes and allows only authenticated users to perform actions.</li>
    </ul>
    <h2>Technologies Used</h2>
    <ul>
        <li><strong>Node.js</strong>: JavaScript runtime.</li>
        <li><strong>Express.js</strong>: Web framework for Node.js.</li>
        <li><strong>SQLite3</strong>: Database for storing users and tasks.</li>
        <li><strong>JWT</strong>: JSON Web Token for authentication and securing routes.</li>
        <li><strong>bcryptjs</strong>: For hashing and verifying passwords.</li>
    </ul>
    <h2>Demonstration Video</h2>
    <img src="/Demonstration Video/2024-10-09-17-22-39-_1_.gif" alt="Project Overview" width="700">
    <h2>Installation</h2>
    <p>To get started with the project, follow these steps:</p>
    <ol>
        <li>Clone the repository:
            <pre><code>git clone &lt;repository-url&gt;</code></pre>
        </li>
        <li>Navigate to the project directory:
            <pre><code>cd task-management-api</code></pre>
        </li>
        <li>Install the dependencies:
            <pre><code>npm install</code></pre>
        </li>
        <li>Create a <code>.env</code> file in the root directory and add the following environment variables:
            <pre><code>PORT=6060
DB_PATH=./database/db.sqlite3
JWT_SECRET=your_jwt_secret_key</code></pre>
        </li>
        <li>Run the database migration to create the necessary tables:
            <pre><code>npm run migrate</code></pre>
        </li>
        <li>Start the server:
            <pre><code>npm start</code></pre>
        </li>
    </ol>
    <p>The API should now be running at <code>http://localhost:6060</code>.</p>
    <h2>Authentication & Authorization</h2>
    <p><strong>JWT Token</strong> is required for all endpoints except <code>/register</code> and <code>/login</code>. Admins can perform CRUD operations on tasks. Normal users can only mark tasks as <code>pending</code> or <code>done</code>.</p>
    <h2>Database</h2>
    <p>The API uses <strong>SQLite3</strong> to store user and task data. You can modify the database path in the <code>.env</code> file as needed.</p>
    <h3>User Table Schema</h3>
    <table border="1">
        <thead>
            <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>id</td>
                <td>INT</td>
                <td>Primary Key (Auto Increment)</td>
            </tr>
            <tr>
                <td>username</td>
                <td>TEXT</td>
                <td>Unique Username</td>
            </tr>
            <tr>
                <td>password</td>
                <td>TEXT</td>
                <td>Hashed password</td>
            </tr>
            <tr>
                <td>email</td>
                <td>TEXT</td>
                <td>Unique Email</td>
            </tr>
            <tr>
                <td>phone</td>
                <td>TEXT</td>
                <td>Unique Phone Number</td>
            </tr>
            <tr>
                <td>role</td>
                <td>TEXT</td>
                <td>User role (admin/normal user)</td>
            </tr>
        </tbody>
    </table>
    <h3>Task Table Schema</h3>
    <table border="1">
        <thead>
            <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>id</td>
                <td>INT</td>
                <td>Primary Key (Auto Increment)</td>
            </tr>
            <tr>
                <td>title</td>
                <td>TEXT</td>
                <td>Task title</td>
            </tr>
            <tr>
                <td>description</td>
                <td>TEXT</td>
                <td>Task description</td>
            </tr>
            <tr>
                <td>status</td>
                <td>TEXT</td>
                <td>Task status (<code>pending</code>/<code>done</code>)</td>
            </tr>
        </tbody>
    </table>
    <h2>Future Improvements</h2>
    <ul>
        <li>Add pagination for tasks.</li>
        <li>Implement search and filtering by task status.</li>
        <li>Improve error handling and validation.</li>
    </ul>
    <h2>License</h2>
    <p>This project is open-source and available under the <a href="LICENSE">MIT License</
