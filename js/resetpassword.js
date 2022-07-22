let userName = document.querySelector('.user-name')
let userId = document.querySelector('.hide-id')

userId.remove()


let params = new URLSearchParams(location.search);
let id = params.get("id");

fetch('/resetpassword/' + id)
  .then(res => res.json())
  .catch(err => ({
    error: String(err)
  }))
  .then((json) => {
    console.log(json)
    if (json.error) {
      sweetAlertError(json.error);
      setTimeout(function () { window.location = './' }, 1000)
      return;
    }
    userName.textContent = json.username;
    userId.textContent = json.id;
  })


  function resetPassword(event) {
    event.preventDefault();
    let form = event.target;
    const formObject = {}
    
    formObject['password'] = form.password.value
    formObject['password2'] = form.password2.value

    fetch(form.action + "?id=" + id, {
        method: "POST",
        headers:{
            "content-type":"application/json"
        },
        body: JSON.stringify(formObject)
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
          })
          return;
        } else{
          // submitForm.remove()
          console.log(json)
          sweetAlertSuccess('成功更改密碼')
          setTimeout(function () { window.location = './login.html' }, 1000)
        }
      });
  }

  function sweetAlertSuccess(message) {
    Swal.fire({
      icon: 'success',
      title: message,
      showConfirmButton: false,
      timer: 1000
    })
  }

  function sweetAlertError(message) {
    Swal.fire({
      icon: 'error',
      title: '發生錯誤！',
      timer: 2000,
      text: message,
    })
  }