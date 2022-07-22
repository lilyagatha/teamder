let displays = document.querySelectorAll(".display");
let editors = document.querySelectorAll(".editor");
let newImage = document.querySelector("#newImage");
let iconImageContent = document.querySelector("#iconImageContent");
let followBtn = document.querySelector("#followBtn");
let unfollowBtn = document.querySelector("#unfollowBtn");
let editButton = document.querySelector("#editButton");
let noResultLearn = document.querySelector(".no-result-learn");
let noResultTeach = document.querySelector(".no-result-teach");
let showMessageText = document.querySelector(".showMessage-text");
let editing = true;
editButton.addEventListener("click", () => {
  setEdit();
});

function setEdit() {
  if (editing === true) {
    for (let display of displays) {
      //nickname,gender,age,district,description
      display.classList.add("editing"); //display = none
    }
    for (let editor of editors) {
      //editor = input columns
      editor.classList.add("startEdit"); //display = block
    }
    editing = false;
  } else {
    for (let display of displays) {
      display.classList.remove("editing");
    }
    for (let editor of editors) {
      editor.classList.remove("startEdit");
    }
    editing = true;
  }
}
//submit form
document
  .querySelector("#personalContentForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData();
    formData.append("nickname", form.nickname.value);
    formData.append("gender", form.gender.value);
    formData.append("age", form.age.value);
    formData.append("district", form.district.value);
    formData.append("aboutMeContent", form.aboutMeContent.value);
    formData.append("iconImage", form.iconImage.files[0]);
    const res = await fetch("/profile", {
      method: "PUT",
      body: formData,
    });
    const result = await res.json();

    if (res.status == 400) {
      sweetAlertError(result.error);
    } else {
      sweetAlertSuccess(result.message);
      setTimeout(() => {
        location.reload();
      }, 1000);
    }

    // alert(result.error);
    if (!editing) {
      setEdit();
    }
    // loadProfile();
  });
let params = new URLSearchParams(location.search);
console.log(params);
let id = params.get("id");

async function loadProfile() {
  const res = await fetch("/profile/" + (id ? id : ""), {
    method: "GET",
  });
  const data = await res.json();
  if (data.error) {
    alert(data.error);
    return;
  }
  // if (id == data.origin_user_id) {
  //   followBtn.remove();
  //   unfollowBtn.remove();
  if (!id || id == data.origin_user_id) {
    followBtn.remove();
    unfollowBtn.remove();
  } else if (id) {
    editButton.remove();
    showMessageText.textContent = "發出訊息";
    document.querySelector("a.sendmessage-link").href =
      "/chatRoom.html?id=" + id;
  }
  getLearnCards();
  getTeachCards();
  // if (!data.login_id) {
  //   followBtn.remove();
  //   unfollowBtn.remove();
  //   editButton.remove();
  // }
  // console.log(data);
  console.log("data", data.user);
  document.querySelector("#nickname").textContent =
    data.user.nickname || data.user.username.split("@", 1);
  document.querySelector("#gender").textContent = translate(data.user.gender);
  document.querySelector("#district").textContent = data.user.district;
  document.querySelector("#age").textContent = data.user.age;
  document.querySelector("#description").textContent = data.user.description;
  if (data.user.iconimage == null) {
    document.querySelector(".iconImageContent img").src = "./default-icon.jpeg";
  } else {
    document.querySelector(".iconImageContent img").src =
      "/uploads/" + data.user.iconimage;
  }

  document.querySelector("#fansNumber").textContent = data.fansNumbers;
  document.querySelector("#followingNumbers").textContent =
    data.followingNumbers;

  //TODO: add default values
  document.querySelector("#nicknameContent").defaultValue =
    data.user.nickname || data.user.username.split("@", 1);
  // set gender default value to a select item :
  let genderSelectionList = document.querySelector("#genderContent");
  for (let i, j = 0; (i = genderSelectionList.options[j]); j++) {
    if (i.value == data.user.gender) {
      genderSelectionList.selectedIndex = j;
      break;
    }
  }
  // set district default value to a select item :
  let districtSelectionList = document.querySelector("#districtContent");
  for (let i, j = 0; (i = districtSelectionList.options[j]); j++) {
    if (i.value == data.user.district) {
      districtSelectionList.selectedIndex = j;
      break;
    }
  }
  document.querySelector("#ageContent").defaultValue = data.user.age || "";
  document.querySelector("#aboutMeContent").defaultValue =
    data.user.description || "";

  if (data.hasFollow) {
    followBtn.style.display = "none";
    unfollowBtn.style.display = "block";
  } else {
    followBtn.style.display = "block";
    unfollowBtn.style.display = "none";
  }
}

loadProfile();

followBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  // console.log(event.target);
  const res = await fetch("/follower/" + id, {
    method: "POST",
  });
  const data = await res.json();
  console.log("follow-button:", data);
  document.querySelector("#fansNumber").textContent = data.fansNumbers;
  followBtn.style.display = "none";
  unfollowBtn.style.display = "block";
});

unfollowBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  console.log("click-unfollow", event.target);
  const res = await fetch("/unfollow/" + id, {
    method: "DELETE",
  });
  const data = await res.json();
  console.log("click-unfollow", data);
  document.querySelector("#fansNumber").textContent = data.fansNumbers;
  followBtn.style.display = "block";
  unfollowBtn.style.display = "none";
});

let cardsPostList = document.querySelector(".cardsPostList");
let requestPostList = document.querySelector(".requestPostList");
let postTemplate = cardsPostList.querySelector(".post-inner");
let postTemplate2 = requestPostList.querySelector(".post-inner");

postTemplate.remove();
postTemplate2.remove();

async function getLearnCards() {
  const res = await fetch("/learn-card/" + id, {
    method: "GET",
  });
  const data = await res.json();
  // console.log(data)
  if (data.error) {
    alert(result.error);
    return;
  }
  // console.log("datalearn", data.result);
  if (data.result.length == 0) {
    noResultLearn.style.display = "block";
  } else {
    data.result.forEach(showPostLearn);
  }
}

async function getTeachCards() {
  const res = await fetch("/teach-card/" + id, {
    method: "GET",
  });
  const data = await res.json();
  if (data.error) {
    alert(result.error);
    return;
  }
  // console.log("FE_fetch/teach-card", data.result);
  // const
  console.log(data.result);
  if (data.result.length == 0) {
    noResultTeach.style.display = "block";
  } else {
    data.result.forEach(showPostTeach);
  }
}

function createPostForTeachCards(post) {
  let postContainer = postTemplate.cloneNode(true);
  let cardCategory = postContainer.querySelector(".card-category");
  let cardType = postContainer.querySelector(".card-type");
  postContainer.querySelector(".card-category").textContent = post.cat_name;
  postContainer.querySelector(".card-title").textContent = post.title;
  postContainer.querySelector(".card-createdate").textContent =
    post.created_at.substring(0, 10);
  postContainer.querySelector(".card-upload").src = post.attachment;
  postContainer.querySelector(".card-link").href = "/skills.html?id=" + post.id;
  cardType.textContent = post.type == "learn" ? "想學" : "想教";
  changeTypeColor(post.type, cardType);
  changeCatColor(post.category_id, cardCategory);

  return postContainer;
}

function createPostForLearnCards(post) {
  let postContainer = postTemplate2.cloneNode(true);
  let cardCategory = postContainer.querySelector(".card-category");
  let cardType = postContainer.querySelector(".card-type");
  postContainer.querySelector(".card-category").textContent = post.cat_name;
  postContainer.querySelector(".card-title").textContent = post.title;
  postContainer.querySelector(".card-createdate").textContent =
    post.created_at.substring(0, 10);
  postContainer.querySelector(".card-upload").src = post.attachment;
  postContainer.querySelector(".card-link").href = "/skills.html?id=" + post.id;
  cardType.textContent = post.type == "learn" ? "想學" : "想教";
  changeTypeColor(post.type, cardType);
  changeCatColor(post.category_id, cardCategory);

  return postContainer;
}

function showPostTeach(post) {
  const postContainer = createPostForTeachCards(post);
  // let img = postContainer.querySelector('img')
  // if (memo.image) {
  //   img.src = '/uploads/' + memo.image
  // } else {
  //   img.remove()
  // }
  // requestPostList.appendChild(postContainer);
  cardsPostList.appendChild(postContainer);
}

function showPostLearn(post) {
  const postContainer = createPostForLearnCards(post);
  requestPostList.appendChild(postContainer);
  // cardsPostList.appendChild(postContainer);
}

function changeCatColor(id, element) {
  let catColor = ["blue", "purple", "pink", "green", "orange", "red", "yellow"];
  let color = catColor[id - 2];
  switch (+id) {
    case id:
      element.classList.add("tag-" + color);
      break;
  }
}

function changeTypeColor(type, element) {
  switch (type) {
    case "learn":
      element.classList.add("type-tag-learn");
      break;
    case "teach":
      element.classList.add("type-tag-teach");
      break;
  }
}

function sweetAlertError(message) {
  Swal.fire({
    icon: "error",
    title: "發生錯誤！",
    timer: 2000,
    text: message,
  });
}
function sweetAlertSuccess(message) {
  Swal.fire({
    icon: "success",
    title: message,
    showConfirmButton: false,
    timer: 1000,
  });
}
