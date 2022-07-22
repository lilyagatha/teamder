const loginButton = document.querySelector("#login-btn")
const logoutButton = document.querySelector("#logout-btn");
const logoutForm = document.querySelector("#logout-form");


checkIsLoggedIn();
logoutEventListener();
getProfilePic();



function checkIsLoggedIn() {
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
                console.log(`Member logged in:`)
                console.log('Session:', json)
                //change nav-bar css, remove login button
                logoutButton.classList.remove("d-none")
                logoutButton.classList.add("d-inline-block")
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

function getProfilePic() {
    fetch("/profile")
        .then(res => res.json())
        .catch(err => ({ error: String(err) }))
        .then(json => {
            if (typeof json.user == 'undefined' || json.user.id == null) {
                //沒有登入
                // console.log('hi no login')
                document.querySelector("#profile-pic-nav").style.display = "none"
                document.querySelector("#profile-pic-container").style.display = "none"
                // document.querySelector('#profile-pic-nav').src = "./default-icon.jpeg"
            } else {
                // console.log(`logged with profile:`)
                // console.log(json)
                //get photo of users
                let photo = document.querySelector('#profile-pic-nav')
                json.user.iconimage != null ? photo.src = json.user.iconimage : photo.src = "./default-icon.jpeg"

                logoutButton.classList.remove("d-none")
                logoutButton.classList.add("d-inline-block")
                return
            }
        })
    }

    // document.querySelector('#profile-pic-nav').src = json.post.iconimage;
