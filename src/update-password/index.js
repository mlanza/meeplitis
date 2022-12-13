import supabase from "/lib/supabase.js";

async function updatePassword(e){
  e.preventDefault();
  const password = this[0],
        confirmPassword = this[1];
  if (password.value === confirmPassword.value) {
    confirmPassword.setCustomValidity();
    const { data, error } = await supabase.auth
      .updateUser({password: password.value});
    if (error) {
      throw error;
    }
    alert("Your password has been reset.");
    location.href = "/";
  } else {
    confirmPassword.setCustomValidity("Passwords don't match");
  }
}

const signInForm = document.querySelector('#signin');
document.querySelector('#signin').onsubmit = updatePassword.bind(signInForm);
