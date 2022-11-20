import supabase from "/lib/supabase.js";
import {session, $online} from "/lib/session.js";
debugger
const params = new URLSearchParams(document.location.search),
      dest   = params.get('dest') ? decodeURIComponent(params.get('dest')) : null;

function redirects(ms, fallback){
  return function redirect(){
    console.log("->", arguments);
    const href = dest || fallback;
    if (href != null) {
      setTimeout(function(){
        location.href = href;
      }, ms || 1000);
    }
  }
}

const {data, error} = await supabase.auth.getUser();
const {user} = data;

if (user) {
  document.getElementById("signout-section").style.display = "block";
  const p = document.querySelector("#signout-section p");
  p.textContent = user.email;
  redirects(5000)();
} else {
  document.getElementById("signin-section").style.display = "block";
}

const signInForm = document.querySelector('#signin');
document.querySelector('#signin').onsubmit = signInSubmitted.bind(signInForm);
const signOutButton = document.querySelector('#signout-button')
document.querySelector('#signout-button').onclick = signOutSubmitted.bind(signOutButton)

function signInSubmitted(event){
  event.preventDefault();
  const email = event.target[0].value
  const password = event.target[1].value
  supabase.auth
    .signInWithPassword({email, password})
    .then(redirects(1000, ""))
    .catch((err) => {
      alert(err.response.text);
    });
}

function signOutSubmitted(event){
  event.preventDefault()
  supabase.auth
    .signOut().then(redirects(0, ""));
}

function setToken(response) {
  if (response?.data?.user.confirmation_sent_at && !response?.session?.access_token) {
    alert('Confirmation Email Sent')
  } else {
    console.log("resp", response);
  }
  location.href = dest;
}

Object.assign(window, {supabase});
