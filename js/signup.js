const loginButton = document.querySelector("#login-btn")

alreadyLoggedIn();

window.onload = () => {
  const signUpForm = document.querySelector('#signup-form');
  signUpForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    let formData = new FormData();
    formData.append('username', signUpForm.username.value);
    formData.append('password', signUpForm.password.value);
    formData.append('password2', signUpForm.password2.value);
    formData.append('nickname', signUpForm.nickname.value);
    formData.append('gender', signUpForm.gender.value);
    formData.append('district', signUpForm.district.value);
    formData.append('age', signUpForm.age.value);
    formData.append('iconimage', signUpForm.iconimage.files[0]);
    formData.append('email',signUpForm.email.value);

    // console.log(signUpForm)
    // formObject.username = signUpForm.username.value;
    // formObject.password = signUpForm.password.value;
    // formObject.password2 = signUpForm.password2.value;
    // formObject.nickname = signUpForm.nickname.value;
    // formObject.gender = signUpForm.gender.value;
    // formObject.district = signUpForm.district.value;
    // formObject.age = signUpForm.age.value;
    // formObject.iconimage = signUpForm.iconimage.value;
    const res = await fetch('/signup', {
      method: 'POST',
      // headers: {
      //   'content-type': 'application/json; charset=utf-8',
      // },
      body: formData,
      // body: JSON.stringify(formObject)
    })
    if (res.status !== 200) {
      const data = await res.json();
      sweetAlertError(data.error);
    } else {
      console.log('front-end:', res)
      console.log('hi')
      sweetAlertSuccess('註冊成功')
      setTimeout(function () { window.location = '/index.html' }, 1000)

    }
  });
}

function alreadyLoggedIn() {
  fetch("/session")
    .then(res => res.json())
    .catch(err => ({ error: String(err) }))
    .then(json => {
      if (json.id == null) {
        console.log('Guest')
        //change nav-bar css, remove logout button
        loginButton.classList.remove("d-none")
        loginButton.classList.add("d-inline-block")
        return
      } else {
        console.log(`logged in:`)
        console.log(json)
        //byebye 
        window.location = "/index.html"
        return
      }
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

function sweetAlertSuccess(message) {
  Swal.fire({
    icon: 'success',
    title: message,
    showConfirmButton: false,
    timer: 1000
  })
}
