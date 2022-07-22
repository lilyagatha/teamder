const loginButton = document.querySelector("#login-btn")
const logoutButton = document.querySelector("#logout-btn");
const loginForm = document.querySelector("#login-form");
const logoutForm = document.querySelector("#logout-form");

window.onload = () => {
  loginEventListener()
  logoutEventListener();
  alreadyLoggedIn();
}


function loginEventListener() {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formObject = {};
    formObject.username = loginForm.username.value;
    formObject.password = loginForm.password.value;
    const res = await fetch("/login/password", {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(formObject),
    });
    if (res.status !== 200) {
      const data = await res.json();
      sweetAlertError(data.error);
    } else {
      window.location = "/index.html"
    }
  })
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


function logoutEventListener() {
  logoutForm.addEventListener("click", async (event) => {
    event.preventDefault();
    const res = await fetch("/logout", {
      method: "POST",
    })
    window.location = "/index.html"
  })
}



function sweetAlertError(message) {
  Swal.fire({
    icon: "error",
    title: "發生錯誤！",
    timer: 2000,
    text: message,
  });
}
