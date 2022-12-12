import supabase from "/lib/supabase.js";

async function updatePassword(e){
  e.preventDefault();
  const password = this[0].value;
  const { data, error } = await supabase.auth
    .updateUser({password});
  if (error) {
    throw error;
  }
  alert("Your password has been reset.");
}

const signInForm = document.querySelector('#signin');
document.querySelector('#signin').onsubmit = updatePassword.bind(signInForm);
