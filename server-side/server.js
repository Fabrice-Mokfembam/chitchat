const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const sequelize = require("./database");
const User = require("./models/user");
const Message = require("./models/messages");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

// ...
const app = express();
const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: ["http://127.0.0.1:5500"],
  },
});
const myUuid = uuidv4();
console.log("Generated UUID:", myUuid);

io.on("connection", (socket) => {
  console.log("connection established");

  socket.emit("send-uuid", myUuid);

  socket.on("send-registration-data", (registrationDetails) => {
    console.log(registrationDetails);
    createUser(registrationDetails);
  });

  socket.on("send-login-data", (loginDetails) => {
    console.log(loginDetails);
    authenticateUser(loginDetails);
  });

  socket.on("send-message", (message) => {
    console.log(message);
    createMessage(message);

    io.to(message.ReceiverId).emit("received-message", message.Message);
  });

  socket.on("retrieve-messages", async (sender, receiver) => {
    try {
      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            {
              SenderId: sender,
              ReceiverId: receiver,
            },
            {
              SenderId: receiver,
              ReceiverId: sender,
            },
          ],
        },
      });

      // Display the retrieved messages on the console
      console.log("Retrieved Messages:");
      messages.forEach((message) => {
        console.log("Message:", message.Message);
      });

      socket.emit("retrieved-messages", messages);
    } catch (error) {
      console.error("Error retrieving messages:", error);
      socket.emit(
        "retrieve-messages-error",
        "An error occurred while retrieving messages"
      );
    }
  });

  function authenticateUser(loginDetails) {
    const { email, password } = loginDetails;

    User.findOne({
      where: {
        UserEmail: email,
        UserPassword: password,
      },
    })
      .then((user) => {
        if (user) {
          console.log("User authenticated:", user.UserEmail);
          io.to(user.UserId).emit("login-success");
          socket.emit("login-success");

          socket.on("login-success", () => {
            console.log("Login successful");
          });
        } else {
          console.log("User not found or invalid credentials");
          io.to(loginDetails.id).emit("login-error", "Invalid credentials");
        }
      })
      .catch((error) => {
        console.error("Error authenticating user:", error);
        io.to(loginDetails.id).emit("login-error", "An error occurred");
      });
  }





  async function fetchAllUsers(socket) {
    try {
      await sequelize.authenticate();
      console.log(
        "Connection to the database has been established successfully."
      );

      const users = await User.findAll();
      socket.emit("send-allUsers", users);
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
  }

  fetchAllUsers(socket);
});

try {
  sequelize.authenticate();
  console.log("Connection has been established successfully.");

  // Sync models with the database
  sequelize.sync().then(() => {
    console.log("Models synchronized with the database.");
  });
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

function createUser(registrationDetails) {
  const { id, email, password } = registrationDetails;

  User.findOne({
    where: {
      UserEmail: email,
    },
  })
    .then((existingUser) => {
      if (existingUser) {
        io.to(id).emit(
          "registration-error",
          "User with this email already exists"
        );
      } else {
        User.create({
          UserId: id,
          UserEmail: email,
          UserPassword: password,
        })
          .then((createdUser) => {
            console.log("User created:", createdUser);
            io.to(id).emit("registration-success");
          })
          .catch((error) => {
            console.error("Error creating user:", error);
            io.to(id).emit(
              "registration-error",
              "An error occurred while creating the user"
            );
          });
      }
    })
    .catch((error) => {
      console.error("Error checking existing user:", error);
      // Emit an error event to the client
      io.to(id).emit(
        "registration-error",
        "An error occurred while checking existing user"
      );
    });
}

function createMessage(message) {
  const newMessage = Message.create({
    ReceiverId: message.receiverId,
    Message: message.message,
    SenderId: message.senderId,
    MessageId: message.messageId,
  })
    .then((createdMessage) => {
      console.log("User created:", createdMessage);
    })
    .catch((error) => {
      console.error("Error creating message:", error);
    });
}

app.use(express.static(path.join(__dirname, "../client-side")));

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
