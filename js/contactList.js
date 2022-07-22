let contactList = document.querySelector(".contactList");
let contactBoxTemplate = document.querySelector(".contactBox");
contactBoxTemplate.remove();

let blockList = document.querySelector(".blockList");
let blockedUsernameTemplate = document.querySelector(".blocked-usernames");
blockedUsernameTemplate.remove();

let followList = document.querySelector(".followList");
let followListUsernameTemplate = document.querySelector(".follow-usernames");
followListUsernameTemplate.remove();

let fansList = document.querySelector(".fansList");
let fansListUsernameTemplate = document.querySelector(".fans-usernames");
fansListUsernameTemplate.remove();

async function getFollowerList() {
  const res = await fetch("/followerList", {
    method: "GET",
  });
  const data = await res.json();
  let followerLists = data.followerLists.rows;
  console.log("followerLists", followerLists);
  followerLists.forEach((follower) => showFollowers(follower));
}

function showFollowers(follower) {
  const showFollowerContainer = createFollowers(follower);
  followList.appendChild(showFollowerContainer);
}

function createFollowers(follower) {
  console.log("fanList", follower.username);
  const showFollowerContainer = followListUsernameTemplate.cloneNode(true);
  showFollowerContainer.querySelector(
    ".follow-username"
  ).innerHTML = `<li>${follower.username.split("@", 1)}</li>`;
  showFollowerContainer.querySelector("a.follower-link").href =
    "/profile.html?id=" + follower.target_user_id;
  return showFollowerContainer;
}

async function getFansList() {
  const res = await fetch("/fansList", {
    method: "GET",
  });
  const data = await res.json();
  let fansLists = data.fansLists.rows;
  console.log("fansLists", fansLists);
  fansLists.forEach((fan) => showFans(fan));
}

function showFans(fan) {
  const showFansContainer = createFans(fan);
  fansList.appendChild(showFansContainer);
}

function createFans(fan) {
  console.log("fanList", fan.username);
  const showFansContainer = fansListUsernameTemplate.cloneNode(true);
  showFansContainer.querySelector(
    ".fan-username"
  ).innerHTML = `<li>${fan.username.split("@", 1)}</li>`;
  showFansContainer.querySelector("a.fan-link").href =
    "/profile.html?id=" + fan.origin_user_id;
  return showFansContainer;
}

async function getContactList() {
  const res = await fetch("/contactList", {
    method: "GET",
  });
  const data = await res.json();
  if (data.error) {
    Swal.fire("fail to connect", data.error, "fail to connect");
    return;
  }

  let contactLists = data.contactList.rows;
  let user = data;
  //   console.log("contactList", contactLists);
  //   console.log("blockList", data.blockList.rows);

  contactLists.forEach((contact) => showContact(contact, user));

  console.log("contactList", contactList);
}

async function getBlockList() {
  const res = await fetch("/blockList", {
    method: "GET",
  });
  const data = await res.json();
  if (data.error) {
    Swal.fire("fail to connect", data.error, "fail to connect");
    return;
  }
  let blockLists = data.blockLists.rows;
  console.log("blockList", blockLists);
  blockLists.forEach((blockedContact) => showBlockList(blockedContact));
}

function showBlockList(blockedContact) {
  const blockedUsernameContainer = createBlockList(blockedContact);
  blockList.appendChild(blockedUsernameContainer);
}

function createBlockList(blockedContact) {
  console.log("blockedContact", blockedContact.username);
  const blockedUsernameContainer = blockedUsernameTemplate.cloneNode(true);
  blockedUsernameContainer.querySelector(
    ".blocked-username"
  ).innerHTML = `<li>${blockedContact.username.split("@", 1)}</li>`;
  //
  blockedUsernameContainer
    .querySelector(".unblock-button")
    .addEventListener("click", () => {
      Swal.fire({
        title: `你確認要解除封鎖 "${blockedContact.username}"嗎?`,
        text: `解除後可以遊覽關於"${blockedContact.username}"的訊息及帖子`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#333",
        confirmButtonText: "確定解鎖",
        cancelButtonText: "取消",
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`/unblockContact/` + blockedContact.target_user_id, {
            method: "delete",
          })
            .then((res) => res.json())
            .catch((err) => ({ error: String(err) }))
            .then((json) => {
              if (json.error) {
                Swal.fire("不能解除封鎖", json.error, "error");
              } else {
                Swal.fire(
                  "解除封鎖!",
                  `可遊覽關於${blockedContact.username}的訊息`,
                  "success"
                );
              }
              location.reload();
            });
        }
      });
    });
  //r

  return blockedUsernameContainer;
}

function showContact(contact, user) {
  const contactBoxContainer = createContactBox(contact, user);
  let blockList = user.blockList.rows;

  for (let blockedContact of blockList) {
    if (contact.sender_id == blockedContact.target_user_id) {
      return;
    }
  }
  contactList.appendChild(contactBoxContainer);
}

function createContactBox(contact, user) {
  let contactBoxContainer = contactBoxTemplate.cloneNode(true);
  contactBoxContainer.querySelector(".username").textContent =
    contact.nickname || contact.username.split("@", 1);
  contactBoxContainer.querySelector(".latestMessage").textContent =
    contact.messages;
  contactBoxContainer.querySelector("a.chatroom-link").href =
    "/chatRoom.html?id=" + contact.sender_id;
  //delete-contact
  contactBoxContainer
    .querySelector(".delete-button")
    .addEventListener("click", () => {
      console.log("sender_id", contact.sender_id);
      Swal.fire({
        title: "你肯定?",
        text: `你確認要刪除你跟 "${contact.username.split(
          "@",
          1
        )}" 的所有聊天記錄嗎？`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#333",
        confirmButtonText: "確定刪除",
        cancelButtonText: "取消",
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`/deleteContact/` + contact.sender_id, { method: "DELETE" })
            .then((res) => res.json())
            .catch((err) => ({ error: String(err) }))
            .then((json) => {
              if (json.error) {
                Swal.fire("不能刪除", json.error, "error");
              } else {
                Swal.fire(
                  "刪除成功!",
                  `已刪除"${contact.username.split("@", 1)}的對話紀錄"`,
                  "success"
                );
                contactBoxContainer.remove();
              }
              location.reload();
            });
        }
      });
    });
  //block-contact
  contactBoxContainer
    .querySelector(".block-button")
    .addEventListener("click", () => {
      console.log("sender_id", contact.sender_id);

      Swal.fire({
        title: `你確認要封鎖 "${contact.username.split("@", 1)}"嗎?`,
        text: `封鎖後不能遊覽關於"${contact.username.split(
          "@",
          1
        )}"的訊息及帖子`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#333",
        confirmButtonText: "確定封鎖",
        cancelButtonText: "取消",
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`/blockContact/` + contact.sender_id, { method: "post" })
            .then((res) => res.json())
            .catch((err) => ({ error: String(err) }))
            .then((json) => {
              if (json.error) {
                Swal.fire("不能封鎖", json.error, "error");
              } else {
                Swal.fire(
                  "封鎖!",
                  `已封鎖${contact.username.split("@", 1)}`,
                  "success"
                );
                contactBoxContainer.querySelector(
                  ".block-button"
                ).style.display = "none";
                contactBoxContainer.querySelector(
                  ".unblock-button"
                ).style.display = "block";
              }
              location.reload();
            });
        }
      });
    });
  // unblock-contact
  contactBoxContainer
    .querySelector(".unblock-button")
    .addEventListener("click", () => {
      Swal.fire({
        title: `你確認要解除封鎖 "${contact.username.split("@", 1)}"嗎?`,
        text: `解除後可以遊覽"${contact.username.split("@", 1)}"的訊息及帖子`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#333",
        confirmButtonText: "確定解鎖",
        cancelButtonText: "取消",
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(`/unblockContact/` + contact.sender_id, {
            method: "delete",
          })
            .then((res) => res.json())
            .catch((err) => ({ error: String(err) }))
            .then((json) => {
              if (json.error) {
                Swal.fire("不能解除封鎖", json.error, "error");
              } else {
                Swal.fire(
                  "解除封鎖!",
                  `可接收${contact.username.split("@", 1)}的訊息`,
                  "success"
                );
                contactBoxContainer.querySelector(
                  ".block-button"
                ).style.display = "block";
                contactBoxContainer.querySelector(
                  ".unblock-button"
                ).style.display = "none";
              }
              location.reload();
            });
        }
      });
    });
  //
  let blockList = user.blockList.rows;
  console.log("user", blockList);
  //   blockList.map(blockedContact.target_user_id == contact.sender_id);

  for (let blockedContact of blockList) {
    if (blockedContact.target_user_id == contact.sender_id) {
      contactBoxContainer.querySelector(".block-button").style.display = "none";
      contactBoxContainer.querySelector(".unblock-button").style.display =
        "block";
    }
  }

  if (contact.iconimage != null) {
    contactBoxContainer.querySelector(".sample-pic").src = contact.iconimage;
  } else {
    contactBoxContainer.querySelector(".sample-pic").src =
      "https://pbs.twimg.com/media/Efx2L8BX0AADc8d.jpg";
  }

  return contactBoxContainer;
}
getFollowerList();
getFansList();
getBlockList();
getContactList();
