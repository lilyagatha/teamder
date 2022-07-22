let postSkill = document.querySelector('#post-skill')
let errorMessage = document.querySelector('.errorMessage')
let submitButton = document.querySelector('.submit-button')
let deleteButton = document.querySelector('.delete-button')
let title = document.querySelector('.form-title')
let params = new URLSearchParams(location.search)
let id = params.get('id')
deleteButton.style.display = "none"

title.addEventListener('keydown', (event) => {
  console.log(title.value)
  let newtitle = title.value
  const res = await fetch("/gettitles", {
    method: "POST",
    headers:{
      "content-type":"application/json"
    },
    body:JSON.stringify({newtitle}),
  });
  const result = await res.json();
  if (result.error) {
    return
  }
  console.log(result)
  // let originOption = document.querySelector(`.option-${option}`)
  // originOption.classList.replace("color-orange", "color-blue")
  // let newOption = document.querySelector(`.option-${second}`)
  // newOption.classList.replace("color-blue", "color-orange")
  // option = second
});


fetch('/postskillupdate')
  .then(res => res.json())
  .catch(err => ({
    error: String(err)
  }))
  .then((json) => {
    console.log(json)
    if (json.error) {
      sweetAlertError(json.error);
      setTimeout(function () { window.location = './login.html' }, 1000)
      return;
    }
  })


postSkill.addEventListener("submit", async function (event) {
  event.preventDefault();
  // Serialize the Form afterwards
  const form = event.target;
  const formData = new FormData();
  formData.append("category", form.category.value);
  formData.append("title", form.title.value);
  formData.append("content", form.content.value);
  formData.append("skill-radio", form["skill-radio"].value);
  formData.append("upload", form.upload.files[0]);



    const urlAPI = id ? "/postskillupdate/" + id : "/postskillupdate"
    // const fetchMethod = id? 'Patch' : 'Post'
    const res = await fetch(urlAPI, {
      method: 'Post',
      body: formData,
    })
    const result = await res.json()

    if (result.error) {
      Swal.fire({
        icon: 'error',
        title: '哎吔...',
        text: result.error,
      })
    } else {
      Swal.fire("成功!", "搞惦！", "success");
      setTimeout(function() {window.location = '/index.html'}, 1000)
    }
  })

if (id){
  submitButton.textContent = "編輯"
  deleteButton.style.display = "block"


  fetch('/postskill/' + id)
  .then(res => res.json())
  .catch(err => ({
    error: String(err)
  }))
  .then((json) => {
    if (json.error) {
      sweetAlertError(json.error);
      setTimeout(function () { window.location = './' }, 1000)
      return;
    }
    postSkill.title.value = json.title;
    postSkill.category.value = json.category_id;
    postSkill.content.value = json.content;
    // postSkill.upload.value = json.content = json.attachment
  })
}



document.querySelector(".delete-button").addEventListener("click", () => {
  Swal.fire({
    title: "真係要刪?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#333",
    confirmButtonText: "刪啦",
    cancelButtonText: "我再諗諗先",
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
            Swal.fire("刪除完成!", "文章已刪除", "success");
            window.location = "/";
          }
        });
    }
  });
});

document.querySelector(".close").addEventListener("click", function (event) {
  Swal.fire({
    title: "你仲未POST喎⋯要返去主頁？",
    showConfirmButton: true,
    showDenyButton: true,
    showCancelButton: false,
    confirmButtonText: "繼續編輯",
    denyButtonText: "返回主頁",
  }).then((result) => {
    /* Read more about isConfirmed, isDenied below */
    if (result.isDenied) {
      window.location = "/";
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