
The aplication is building in VScode, are used tecnoligies like HTML5, CSS3, SQLServer, JavaScript, Note.js and Express.


# TourColombia - Tourism Platform

This project is a full-stack web solution designed for managing tourism services in Colombia. Developed as a core project during my technical training at SENA, it integrates a dynamic frontend with a scalable backend and a relational database.

---

## Features
* **User Management:** Functional Registration and Login system.
* **Dynamic Interaction:** Contact and booking forms validated with Vanilla JavaScript.
* **Data Persistence:** Architecture connected to SQL Server for secure information storage.
* **Security:** Implementation of environment variables (`.env`) to protect database credentials.

## Tech Stack
* **Frontend:** HTML5, CSS3, JavaScript (ES6+).
* **Backend:** Node.js with Express.
* **Database:** Microsoft SQL Server.
* **Version Control:** Git / GitHub.

---

## Database Configuration

To run the project, you need to set up **SQL Server** by following these steps:

Copy and paste script sql server saved how --> Base_datos.sql

## Access Security

The system is configured to connect using a specific user. It is recommended to create a login that matches the .env file configuration:

SQL
CREATE LOGIN [turismo_login] WITH PASSWORD = 'sena@tour!23';
CREATE USER [turismo_login] FOR LOGIN [turismo_login];
ALTER ROLE [db_owner] ADD MEMBER [turismo_login];
🔧 Installation and Setup
Clone the repository:

Bash
git clone [https://github.com/your-username/tour-colombia.git](https://github.com/your-username/tour-colombia.git)

cd TourColombia
Install dependencies:

Bash
npm install
Configure Environment Variables:
Ensure you have a .env file in the root directory with the following content:

Bash
npm start
Visit: http://localhost:3000

👤 Author
RafaeL Jose Avila Arrieta
Role: Software Programming Apprentice - SENA.

This project was developed as part of my technical training, demonstrating skills in FullStack development and relational database management.
