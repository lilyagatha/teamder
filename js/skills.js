let postSample = document.querySelector(".post-sample");
let loadingMessage = document.body.querySelector(`.loading-message`);
let errorMessage = document.body.querySelector(`.error-message`);
let sampleUpload = postSample.querySelector(".sample-upload");
let commentTemplate = document.querySelector(".comment-container");
let commentClone = document.querySelector(".comment-section-clone");
// let SampleCreatorPic = postSample.querySelector(".sample-creator-pic");

commentTemplate.remove()

let params = new URLSearchParams(location.search);
let id = params.get("id");


let leaveComment = document.querySelector(".leave-comment");

function submitComment(event) {
  event.preventDefault();
  let form = event.target;
  const formObject = {};

  formObject["comment"] = form.comment.value;

  fetch("/comment/" + id, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(formObject),
    })
    .then((res) => res.json())
    .catch((error) => ({
      error: String(error),
    }))
    .then((json) => {
      if (json.error) {
        Swal.fire({
          icon: "error",
          title: "用戶名稱不存在",
          text: json.error,
        });
        return;
      } else {
        // submitForm.remove()
        console.log(json);
        event.target.comment.value=""
        // sweetAlertSuccess("成功更改密碼");
        // setTimeout(function () {
        //   window.location = "./login.html";
        // }, 1000);
      }
    });
}

fetch("/showcomment/" + id)
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
    let comments = json.result;
    comments.forEach((comments) => showPost(comments));
  });


  function connectSocketIO() {
    socket = io.connect()
    
    socket.on('new notification', content => {
      // console.log('received greeting from socket.io:', content)
      console.log("show", content)
      showPost(content)
      // showNotification(savedMessage);
    })
  
  }
  
  connectSocketIO()


function showPost(comments) {
  let postContainer = commentTemplate.cloneNode(true);
  // let cardCategory = postContainer.querySelector(".card-category");
  // let cardType = postContainer.querySelector(".card-type");
  postContainer.querySelector(".comment-name").textContent = comments.username;
  postContainer.querySelector(".comment-content").textContent = comments.content;
  commentClone.prepend(postContainer);
}


fetch("/skills/" + id)
  .then((res) => res.json())
  .catch((err) => ({
    error: String(err),
  }))
  .then((json) => {
    loadingMessage.hidden = true;
    if (json.error) {
      sweetAlertError(json.error);
      setTimeout(function () {
        window.location = './'
      }, 1000)
      return;
    }

    let post = json.post;
    // document.querySelector(".post-id").textContent = "#" + id;
    document.querySelector(".sample-title").textContent = post.title;
    document.querySelector(".sample-header").textContent = post.title;
    postSample.querySelector(".sample-description").textContent = post.content;
    postSample.querySelector(".sample-creator-name").textContent =
      post.username;
    document.querySelector(".category").textContent = post.cat_name;
    postSample.querySelector(".sample-upload").src = post.attachment;
    postSample.querySelector(".sample-createdate").textContent =
      post.created_at.substring(0, 10);
    postSample.querySelector(".creator-profile").href =
      "/profile.html?id=" + post.creator_id;
    if (post.creator_id == json.userId || !json.userId) {
      postSample.querySelector(".createChatRoom").remove();
    } else {
      postSample.querySelector(".createChatRoom").href =
        "/chatRoom.html?id=" + post.creator_id;
    }

    if (post.iconimage != null) {
      postSample.querySelector(".sample-creator-pic").src = post.iconimage;
    } else {
      postSample.querySelector(".sample-creator-pic").src =
        "https://pbs.twimg.com/media/Efx2L8BX0AADc8d.jpg";
    }
    console.log(json)
    // if ((post.creator_id != json.userId) && (isAdmin == null)) {
    if (post.creator_id == json.userId) {
      document.querySelector(".edit-button").style.display = "flex";
      document.querySelector(".delete-button").style.display = "flex";
    }
    if (json.isAdmin == true) {
      document.querySelector(".delete-button").style.display = "flex";
    }

    postSample.hidden = false;
  });

postSample.hidden = false;

document.querySelector(".edit-button").addEventListener("click", () => {
  window.location = "/postskill.html?id=" + id;
});

document.querySelector(".delete-button").addEventListener("click", () => {
  Swal.fire({
    title: "確認要刪除嗎（無法還原）?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#333",
    confirmButtonText: "確定",
    cancelButtonText: "再想想",
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/postskill/` + id, {
          method: "DELETE",
        })
        .then((res) => res.json())
        .catch((err) => ({
          error: String(err),
        }))
        .then((json) => {
          if (json.error) {
            Swal.fire("刪唔到嘅", json.error, "error");
          } else {
            Swal.fire("成功刪除!", "文章已刪除", "success");
            window.location = "/";
          }
        });
    }
  });
});


function sweetAlertError(message) {
  Swal.fire({
    icon: 'error',
    title: '發生錯誤！',
    timer: 2000,
    text: message,
  })
}

function sweetAlertSuccess(message) {
  Swal.fire({
    icon: 'success',
    title: message,
    showConfirmButton: false,
    timer: 1000
  })
}