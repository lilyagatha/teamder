let postList = document.querySelector(".post-list");
let postSearchList = document.querySelector(".post-search-list");
let postTemplate = postList.querySelector(".post-inner");

let categoriesList = document.querySelector(".categories-list");
let categoryTemplate = categoriesList.querySelector(".category-item");
let categoryHidden = categoriesList.querySelector(".category-inner");

let categoriesSearchId = document.querySelector(".category-link");

let noResult = document.querySelector(".no-result");
noResult.style.display = "none";

postTemplate.remove();

// logoutEventListener();

fetch("/index/cards")
  .then((res) => res.json())
  .catch((error) => ({
    error: String(error),
  }))
  .then((json) => {
    if (json.error) {
      Swal.fire({
        icon: "error",
        title: "撈唔到啲文章喎！",
        text: json.error,
      });
      return;
    }
    let posts = json.result;
    let blockList = json.blockList;
    console.log(blockList);
    posts.forEach((post) => showPost(post, blockList));
  });

function createPost(post) {
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

function showPost(post, blockList) {
  const postContainer = createPost(post);
  // let img = postContainer.querySelector('img')
  // if (memo.image) {
  //   img.src = '/uploads/' + memo.image
  // } else {
  //   img.remove()
  // }
  console.log(blockList);

  for (let blockedContact of blockList) {
    if (post.creator_id == blockedContact.target_user_id) {
      return;
    }
  }

  postList.appendChild(postContainer);
}

fetch("/index/category")
  .then((res) => res.json())
  .catch((error) => ({
    error: String(error),
  }))
  .then((json) => {
    if (json.error) {
      Swal.fire({
        icon: "error",
        title: "撈唔到個分類",
        text: json.error,
      });
      return;
    }
    json.forEach(showCategory);
  });

function showCategory(categoryItems) {
  let categoryContainer = categoryTemplate.cloneNode(true);
  categoryContainer.querySelector(".category-name").textContent =
    categoryItems.cat_name;
  categoryContainer.querySelector(".category-image").src =
    categoryItems.cat_img;
  categoryContainer.querySelector(".category-link").href =
    "/search/" + categoryItems.id;
  categoriesList.appendChild(categoryContainer);
}

function searchCat(event) {
  noResult.style.display = "none";
  event.preventDefault();
  postList.remove();
  fetch(event.currentTarget.href)
    .then((res) => res.json())
    .catch((error) => ({
      error: String(error),
    }))
    .then((json) => {
      if (json.error) {
        Swal.fire({
          icon: "error",
          title: "撈唔到啲文章喎！",
          text: json.error,
        });
        return;
      }
      postSearchList.textContent = "";

      if (json.length == 0) {
        noResult.style.display = "block";
      } else {
        json.forEach(showSearchPost);
      }
    });
}

function searchCat(event) {
  noResult.style.display = "none";
  event.preventDefault();
  postList.remove();
  fetch(event.currentTarget.href)
    .then((res) => res.json())
    .catch((error) => ({
      error: String(error),
    }))
    .then((json) => {
      if (json.error) {
        Swal.fire({
          icon: "error",
          title: "撈唔到啲文章喎！",
          text: json.error,
        });
        return;
      }
      postSearchList.textContent = "";

      if (json.length == 0) {
        noResult.style.display = "block";
      } else {
        json.forEach(showSearchPost);
      }
    });
}

function showSearchPost(post) {
  const postContainer = createPost(post);
  postSearchList.appendChild(postContainer);
}

function searchTitle(event) {
  noResult.style.display = "none";
  event.preventDefault();
  let form = event.target;
  let params = new URLSearchParams();
  params.set("title", form.title.value);
  postList.remove();
  fetch(form.action + "?" + params)
    .then((res) => res.json())
    .catch((error) => ({
      error: String(error),
    }))
    .then((json) => {
      if (json.error) {
        Swal.fire({
          icon: "error",
          title: "撈唔到啲文章喎！",
          text: json.error,
        });
        return;
      }
      postSearchList.textContent = "";

      if (json.length == 0) {
        noResult.style.display = "block";
      } else {
        json.forEach(showSearchPost);
      }
    });
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
