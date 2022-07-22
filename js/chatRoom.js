let submitBtn = document.querySelector("#submitBtn");
let inputField = document.getElementById("inputField");
let messageList = document.querySelector(".messageList");
let messageContent = document.querySelector(".messageContent");
let receiveBoxTemplate = messageList.querySelector(".receiveBox");
let sendBoxTemplate = messageList.querySelector(".sendBox");
receiveBoxTemplate.remove();
sendBoxTemplate.remove();

function createReceiveBox(message, user) {
  let receiveBoxContainer = receiveBoxTemplate.cloneNode(true);
  receiveBoxContainer.querySelector(".receiverName").textContent =
    user.nickname || user.username.split("@", 1);
  receiveBoxContainer.querySelector(".receiverContent").textContent =
    message.messages;
  return receiveBoxContainer;
}
function createSendBox(message, user) {
  let sendBoxContainer = sendBoxTemplate.cloneNode(true);
  sendBoxContainer.querySelector(".senderName").textContent =
    user.nickname || user.username.split("@", 1);
  sendBoxContainer.querySelector(".senderContent").textContent =
    message.messages;
  return sendBoxContainer;
}

function showMessages(message, users) {
  if (message.sender_id === users.login_user.id) {
    const sendBoxContainer = createSendBox(message, users.login_user);
    messageList.appendChild(sendBoxContainer);
  } else {
    const receiveBoxContainer = createReceiveBox(message, users.target_user);
    messageList.appendChild(receiveBoxContainer);
  }
}

let params = new URLSearchParams(location.search);
let users;
let id = params.get("id");
console.log(id);
async function getMessages() {
  const res = await fetch("/chatRoom/" + id, {
    method: "GET",
  });
  const data = await res.json();
  if (data.error) {
    Swal.fire("fail to connect", data.error, "fail to connect");

    return;
  }

  let messages = data.messages;
  users = data;

  messages.forEach((message) => showMessages(message, data));
  messageContent.scrollTop = messageContent.scrollHeight;
}
getMessages();

inputField.addEventListener("keydown", function (event) {
  // Get the code of pressed key
  const keyCode = event.which || event.keyCode;
  // 13 represents the Enter key
  if (keyCode === 13 && !event.shiftKey) {
    // Don't generate a new line
    event.preventDefault();
    if (keyCode === 13) {
      submitOnEnter(event);
    }
    // Do something else such as send the message to back-end
    // ...
  }
});

function submitOnEnter(event) {
  if (event.which === 13) {
    event.target.form.dispatchEvent(new Event("submit", { cancelable: true }));
    event.preventDefault(); // Prevents the addition of a new line in the text field (not needed in a lot of cases)
  }
}

function auto_grow(element) {
  element.style.height = "5px";
  element.style.height = element.scrollHeight + "px";
}

document
  .querySelector("#sendingForm")
  .addEventListener("submit", async function submit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData();
    formData.append("inputField", form.inputField.value);
    const res = await fetch("/sendMessage/" + id, {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (result.error) {
      sweetAlertError(result.error);
    }
    document.querySelector("#inputField").value = "";
    messageContent.scrollTop = messageContent.scrollHeight;

    // form.inputField.value = "";
  });
// document.querySelector("#submitBtn").addEventListener("click", () => {
// });

//socket connect
let socket = io.connect();
socket.on("connect", () => {
  console.log("connect");
  socket.emit("join room", id);
});
socket.on("new message", (message) => {
  console.log(message);
  showMessages(message, users);
  // getMessages();
  messageContent.scrollTop = messageContent.scrollHeight;
});
