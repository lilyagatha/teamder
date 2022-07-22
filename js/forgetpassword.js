let submitForm = document.querySelector('.before-submit')
let afterSubmit = document.querySelector('.after-submit')




function forgetPassword(event) {
    event.preventDefault();
    let form = event.target;
    let params = new URLSearchParams();
    params.set("title", form.userid.value);
    
    fetch(form.action + "?userid=" + form.userid.value)
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
          })
          return;
        }
        afterSubmit.style.display = "block";
        submitForm.remove()
        console.log(json)
      });
  }