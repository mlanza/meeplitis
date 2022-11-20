import supabase from "/lib/supabase.js";

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
    .then(setToken)
    .catch((err) => {
      alert(err.response.text);
    });
}

function setToken(response) {
  if (response.user.confirmation_sent_at && !response?.session?.access_token) {
    alert('Confirmation Email Sent');
    location.href = "/signin";
  } else {
    console.error(response);
  }
}

Object.assign(window, {supabase});
