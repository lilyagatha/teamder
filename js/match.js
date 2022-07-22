'use strict';

let toBeMatched = document.querySelector(".to-be-matched");
let cardList = document.querySelector(".outer-container");


var tinderContainer = document.querySelector('.tinder');
var allCards = document.querySelector('.tinder--cards');
var nope = document.getElementById('nope');
var love = document.getElementById('love');
let matchContainerTemplate = document.querySelector(".tinder--card");
let teachItemTemplate = matchContainerTemplate.querySelector(".teach-item")
let learnItemTemplate = matchContainerTemplate.querySelector(".learn-item")

matchContainerTemplate.remove()
teachItemTemplate.remove()
learnItemTemplate.remove()

fetch('/postskillupdate')
  .then(res => res.json())
  .catch(err => ({
    error: String(err)
  }))
  .then((json) => {
    console.log(json)
    if (json.error) {
      sweetAlertError(json.error);
      setTimeout(function () {
        window.location = './login.html';
      }, 1000)
      return;
    }
  })

function sweetAlertError(message) {
  Swal.fire({
    icon: 'error',
    title: '發生錯誤！',
    timer: 2000,
    text: message,
  })
}


function dislikeUser(id) {
  fetch("/dislike/" + id, {
    method: "POST",
  });
}

function resetMatch() {
  fetch("/dislike/", {
    method: "DELETE",
  });
  location.reload()
}



function initCards(card, index) {
  var newCards = document.querySelectorAll('.tinder--card:not(.removed)');

  newCards.forEach(function (card, index) {
    card.style.zIndex = allCards.length - index;
    // card.style.transform = 'scale(' + (20 - index) / 20 + ') translateY(-' + 30 * index + 'px)';
    // card.style.opacity = (10 - index) / 10;
  });

  tinderContainer.classList.add('loaded');
}

initCards();

function setUpHammer(el) {
  var hammertime = new Hammer(el);

  hammertime.on('pan', function (event) {
    el.classList.add('moving');

  });

  hammertime.on('pan', function (event) {
    //if (event.target !== event.currentTarget){
    if (event.deltaX === 0) return;
    if (event.center.x === 0 && event.center.y === 0) return;

    tinderContainer.classList.toggle('tinder_love', event.deltaX > 0);
    tinderContainer.classList.toggle('tinder_nope', event.deltaX < 0);

    var xMulti = event.deltaX * 0.03;
    var yMulti = event.deltaY / 80;
    var rotate = xMulti * yMulti;

    // if (event.target.id === "abc")
    // {
    //   event.currentTarget.style.transform = 'translate(' + event.deltaX + 'px, ' + event.deltaY + 'px) rotate(' + rotate + 'deg)';

    // }else{
    event.target.style.transform = 'translate(' + event.deltaX + 'px, ' + event.deltaY + 'px) rotate(' + rotate + 'deg)';
    // }
    //}
  });

  hammertime.on('panend', function (event) {
    el.classList.remove('moving');
    tinderContainer.classList.remove('tinder_love');
    tinderContainer.classList.remove('tinder_nope');

    var moveOutWidth = document.body.clientWidth;
    var keep = Math.abs(event.deltaX) < 80 || Math.abs(event.velocityX) < 0.5;

    console.log(keep, event.deltaX, event.velocityX)

    event.target.classList.toggle('removed', !keep);

    if (keep) {
      event.target.style.transform = '';
    } else {
      var endX = Math.max(Math.abs(event.velocityX) * moveOutWidth, moveOutWidth);

      var toX = event.deltaX > 0 ? endX : -endX;
      var endY = Math.abs(event.velocityY) * moveOutWidth;
      var toY = event.deltaY > 0 ? endY : -endY;
      var xMulti = event.deltaX * 0.03;
      var yMulti = event.deltaY / 80;
      var rotate = xMulti * yMulti;

      event.target.style.transform = 'translate(' + toX + 'px, ' + (toY + event.deltaY) + 'px) rotate(' + rotate + 'deg)';

      let id = event.target.querySelector('.user-id').textContent

      if (event.deltaX < 0) {

        dislikeUser(id)

      }


      if (event.deltaX > 0) {
        // let cards = document.querySelectorAll('.tinder--card:not(.removed)');
        // let card = cards[cards.length-1];
        window.location.href = "/profile.html?id=" + id

      }

      initCards();
    }
  });
}


function createButtonListener(love) {
  return function (event) {
    var cards = document.querySelectorAll('.tinder--card:not(.removed)');
    var moveOutWidth = document.body.clientWidth * 1.5;

    console.log(cards.length, event)

    if (!cards.length) return false;

    var card = cards[cards.length - 1];
    let id = card.querySelector('.user-id').textContent

    card.classList.add('removed');
    console.log(love, event)
    // console.log({id})

    if (love) {
      card.style.transform = 'translate(' + moveOutWidth + 'px, -100px) rotate(-30deg)';
      window.location.href = "/profile.html?id=" + id
    } else {
      card.style.transform = 'translate(-' + moveOutWidth + 'px, -100px) rotate(30deg)';
      dislikeUser(id)
    }

    initCards();

    event.preventDefault();
  };
}

var nopeListener = createButtonListener(false);
var loveListener = createButtonListener(true);

nope.addEventListener('click', nopeListener);
love.addEventListener('click', loveListener);




fetch("/startmatch")
  .then((res) => res.json())
  .then((json) => {
    if (json.length == 0) {
      toBeMatched.style.display = "block";
    } else {
      cardList.style.display = "block";
    }
  });


fetch("/matching")
  .then((res) => res.json())
  .catch((error) => ({
    error: String(error),
  }))
  .then((json) => {
    if (json.error) {
      return;
    }
    json.users.forEach(showAll);
  });




function showAll(json) {
  console.log(json)
  console.log(1)
  let cardContainer = matchContainerTemplate.cloneNode(true);
  let teachList = cardContainer.querySelector(".teach-list");
  let learnList = cardContainer.querySelector(".learn-list");


  cardContainer.querySelector(".stat-creator-name").textContent = json.user.username.split("@", 1);
  cardContainer.querySelector(".stat-gender").textContent = json.user.gender;
  cardContainer.querySelector(".stat-age").textContent = json.user.age;
  cardContainer.querySelector(".stat-district").textContent = json.user.district;
  cardContainer.querySelector(".user-id").textContent = json.user.id;


  if (json.user.iconimage != null) {
    cardContainer.querySelector(".stat-creator-pic").src = json.user.iconimage;
  } else {
    cardContainer.querySelector(".stat-creator-pic").src =
      "https://pbs.twimg.com/media/Efx2L8BX0AADc8d.jpg";
  }


  // cardContainer.querySelector(".stat-link").href = "/profile.html?id=" + json.user.id;



  for (let title of json.teach) {
    let li = teachItemTemplate.cloneNode(true);
    li.textContent = "➡   " + title;
    teachList.appendChild(li);
  }

  for (let title of json.learn) {
    let li = learnItemTemplate.cloneNode(true);
    li.textContent = "➡   " + title;
    learnList.appendChild(li);
  }


  // json.learn.forEach(function (title) {
  //   let li = document.createElement('li');
  //   li.textContent = title;
  //   learnTemplate.appendChild(li);
  // });

  allCards.appendChild(cardContainer);
  setUpHammer(cardContainer)
  console.log(2)
}



// fetch("/dislike/" + uid, {
//   method: "POST",
// });