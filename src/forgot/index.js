import supabase from "/lib/supabase.js";

async function resetPassword(e){
  e.preventDefault();
  const email = this[0].value;
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: '/update-password',
  });
  console.log(data, error);
  alert("You will receive an email with a link to reset your password shortly.");
}

const signInForm = document.querySelector('#signin');
document.querySelector('#signin').onsubmit = resetPassword.bind(signInForm);

