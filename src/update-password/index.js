import supabase from "/libs/supabase.js";

const form = document.getElementById('signin'),
      password = form[0],
      confirmPassword = form[1];

function passwordsMatch(e){
  confirmPassword.setCustomValidity(password.value === confirmPassword.value ? "" : "Passwords don't match");
}

async function updatePassword(e){
  e.preventDefault();
  if (password.validity.valid && confirmPassword.validity.valid) {
    const { data, error } = await supabase.auth
      .updateUser({password: password.value});
    if (error) {
      throw error;
    }
    alert("Your password has been reset.");
    location.href = "/";
  }
  return false;
}

password.addEventListener("input", passwordsMatch);
confirmPassword.addEventListener("input", passwordsMatch);
form.addEventListener("submit", updatePassword);
