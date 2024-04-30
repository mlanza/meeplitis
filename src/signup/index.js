import supabase from "/libs/supabase.js";

function toJSON(resp){
  return resp.json();
}

function see(label){
  return function(...args){
    return console.log(label, ...args);
  }
}

const signUpForm = document.querySelector('#signup');
document.querySelector('#signup').onsubmit = signUpSubmitted.bind(signUpForm);

function signUpSubmitted(event){
  event.preventDefault();
  const email = event.target[0].value
  const password = event.target[1].value
  supabase.auth
    .signUp({ email, password })
    .then(setToken);
}

function setToken(response) {
  if (response?.error) {
    alert("There was an issue");
    console.log(response?.error);
  } else if (response?.data?.user.confirmation_sent_at && !response?.data?.session?.access_token) {
    alert('A confirmation email was sent.  Please confirm it before attempting to sign in.');
    location.href = "/signin";
  }
}

Object.assign(window, {supabase});
